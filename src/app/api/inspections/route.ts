import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getRepository } from "@/lib/repository";
import { sessaoDaApi } from "@/lib/auth/dal";
import {
  equipesRepo,
  garagensRepo,
  inspetoresRepo,
  itensChecklistRepo,
  tiposLimpezaRepo,
  veiculosRepo,
} from "@/lib/repository/cadastros";
import { calcularResumo } from "@/lib/calculations";
import { catalogoAplicavel } from "@/lib/checklist-catalog";
import { ItemChecklistCadastro, Veiculo } from "@/types/cadastros";
import { Inspecao, ItemResultado, NovaInspecaoPayload, Turno } from "@/types/inspection";

export const runtime = "nodejs";

const TURNOS_VALIDOS: Turno[] = ["Manhã", "Tarde", "Noite"];

function validarPayload(
  body: unknown,
  itensExigidos: ItemChecklistCadastro[]
): { erro: string } | { payload: NovaInspecaoPayload } {
  if (!body || typeof body !== "object") return { erro: "Corpo da requisição inválido." };
  const b = body as Partial<NovaInspecaoPayload>;

  if (!b.veiculoId) return { erro: "Selecione o veículo." };
  if (!b.garagemId) return { erro: "Selecione a garagem/unidade." };
  if (!b.tipoLimpezaId) return { erro: "Selecione o tipo de limpeza." };
  if (!b.inspetorId) return { erro: "Selecione o inspetor/encarregado." };
  if (!b.equipeId) return { erro: "Selecione a equipe." };
  if (!b.turno || !TURNOS_VALIDOS.includes(b.turno)) return { erro: "Selecione o turno." };

  if (!Array.isArray(b.itens) || b.itens.length !== itensExigidos.length) {
    return { erro: "Checklist incompleto." };
  }

  for (const catalogItem of itensExigidos) {
    const item = b.itens.find((i) => i.itemId === catalogItem.id) as ItemResultado | undefined;
    if (!item) return { erro: `Item do checklist ausente: ${catalogItem.nome}` };
    if (!["CONFORME", "NAO_CONFORME", "NA"].includes(item.status)) {
      return { erro: `Status inválido para o item: ${catalogItem.nome}` };
    }
    if (item.status === "NAO_CONFORME") {
      if (!item.observacao || item.observacao.trim() === "") {
        return { erro: `Observação obrigatória para item não conforme: ${catalogItem.nome}` };
      }
      if (!item.criticidade || !["CRITICA", "NAO_CRITICA"].includes(item.criticidade)) {
        return { erro: `Criticidade obrigatória para item não conforme: ${catalogItem.nome}` };
      }
    }
  }

  return { payload: b as NovaInspecaoPayload };
}

export async function GET(request: NextRequest) {
  const sessao = await sessaoDaApi();
  if (!sessao) {
    return NextResponse.json({ erro: "Sessão expirada. Faça login novamente." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const repo = getRepository();
  const inspecoes = await repo.list({
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    prefixo: searchParams.get("prefixo") ?? undefined,
    garagem: searchParams.get("garagem") ?? undefined,
    turno: searchParams.get("turno") ?? undefined,
    inspetor: searchParams.get("inspetor") ?? undefined,
    equipe: searchParams.get("equipe") ?? undefined,
    resultado: (searchParams.get("resultado") as "APROVADO" | "REPROVADO") ?? undefined,
    q: searchParams.get("q") ?? undefined,
  });
  return NextResponse.json(inspecoes);
}

export async function POST(request: NextRequest) {
  const sessao = await sessaoDaApi();
  if (!sessao) {
    return NextResponse.json({ erro: "Sessão expirada. Faça login novamente." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ erro: "JSON inválido." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ erro: "Corpo da requisição inválido." }, { status: 400 });
  }
  const veiculoId = (body as Partial<NovaInspecaoPayload>).veiculoId;
  if (!veiculoId) {
    return NextResponse.json({ erro: "Selecione o veículo." }, { status: 400 });
  }

  const veiculo: Veiculo | null = await veiculosRepo.getById(veiculoId);
  if (!veiculo) return NextResponse.json({ erro: "Veículo não encontrado." }, { status: 400 });

  // O conjunto de itens exigido depende do veículo (itens condicionais, como
  // "Mantas presentes" em veículos DD, só entram quando aplicáveis) — por
  // isso é recalculado aqui no servidor, autoritativamente, a partir do
  // catálogo ativo no momento, e não confiado a partir do que o cliente
  // enviou.
  const itensAtivos = (await itensChecklistRepo.list()).filter((i) => i.status === "ATIVO");
  const itensExigidos = catalogoAplicavel(itensAtivos, veiculo);

  const validacao = validarPayload(body, itensExigidos);
  if ("erro" in validacao) {
    return NextResponse.json({ erro: validacao.erro }, { status: 400 });
  }

  const { payload } = validacao;

  // Resolve os cadastros no servidor (fonte autoritativa) e grava o texto
  // resultante como snapshot imutável — nunca mais recalculado a partir dos
  // cadastros depois de salvo, mesmo que os cadastros mudem no futuro.
  const [garagem, tipoLimpeza, inspetor, equipe] = await Promise.all([
    garagensRepo.getById(payload.garagemId!),
    tiposLimpezaRepo.getById(payload.tipoLimpezaId),
    inspetoresRepo.getById(payload.inspetorId),
    equipesRepo.getById(payload.equipeId),
  ]);

  if (!garagem) return NextResponse.json({ erro: "Garagem/Unidade não encontrada." }, { status: 400 });
  if (!tipoLimpeza) return NextResponse.json({ erro: "Tipo de limpeza não encontrado." }, { status: 400 });
  if (!inspetor) return NextResponse.json({ erro: "Inspetor/Encarregado não encontrado." }, { status: 400 });
  if (!equipe) return NextResponse.json({ erro: "Equipe não encontrada." }, { status: 400 });

  // Normaliza os itens na ordem canônica do catálogo aplicável e recalcula o
  // resumo no servidor para garantir a integridade do snapshot (não confia
  // no cliente para categoria/nome/criticidade do catálogo).
  const itens: ItemResultado[] = itensExigidos.map((catalogItem) => {
    const item = payload.itens.find((i) => i.itemId === catalogItem.id)!;
    return {
      itemId: catalogItem.id,
      categoria: catalogItem.categoria,
      label: catalogItem.nome,
      status: item.status,
      observacao: item.status === "NAO_CONFORME" ? item.observacao : undefined,
      fotoDataUrl: item.status === "NAO_CONFORME" ? item.fotoDataUrl : undefined,
      evidenciaTipo: item.status === "NAO_CONFORME" ? item.evidenciaTipo : undefined,
      criticidade: item.status === "NAO_CONFORME" ? item.criticidade : undefined,
    };
  });

  const resumo = calcularResumo(itens);

  const inspecao: Inspecao = {
    id: randomUUID(),
    criadoEm: payload.criadoEm || new Date().toISOString(),
    finalizadoEm: new Date().toISOString(),
    prefixo: veiculo.prefixo,
    placa: veiculo.placa,
    garagem: garagem.nome,
    turno: payload.turno,
    tipoLimpeza: tipoLimpeza.nome,
    inspetor: inspetor.nomeCompleto,
    equipe: equipe.nome,
    veiculoId: veiculo.id,
    garagemId: garagem.id,
    tipoLimpezaId: tipoLimpeza.id,
    inspetorId: inspetor.id,
    equipeId: equipe.id,
    criadoPorUsuarioId: sessao.userId,
    criadoPorNome: sessao.nome,
    itens,
    resumo,
  };

  const repo = getRepository();
  const salva = await repo.create(inspecao);

  return NextResponse.json(salva, { status: 201 });
}

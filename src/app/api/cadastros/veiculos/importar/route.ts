import { NextRequest, NextResponse } from "next/server";
import { garagensRepo, veiculosRepo } from "@/lib/repository/cadastros";
import { LinhaCsvBruta, validarLinhasImportacaoVeiculos } from "@/lib/import-veiculos";
import { exigirPerfilApi } from "@/lib/auth/dal";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const sessao = await exigirPerfilApi(["ADMIN"]);
  if (!sessao) {
    return NextResponse.json({ erro: "Apenas administradores podem importar veículos." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ erro: "JSON inválido." }, { status: 400 });
  }

  const { linhas, confirmar } = (body ?? {}) as { linhas?: LinhaCsvBruta[]; confirmar?: boolean };

  if (!Array.isArray(linhas) || linhas.length === 0) {
    return NextResponse.json({ erro: "Nenhuma linha para importar." }, { status: 400 });
  }
  if (linhas.length > 2000) {
    return NextResponse.json({ erro: "Arquivo muito grande (limite de 2000 linhas)." }, { status: 400 });
  }

  const [veiculosExistentes, garagens] = await Promise.all([veiculosRepo.list(), garagensRepo.list()]);
  const linhasValidadas = validarLinhasImportacaoVeiculos(linhas, veiculosExistentes, garagens);

  const totalValidos = linhasValidadas.filter((l) => l.valido).length;
  const totalInvalidos = linhasValidadas.length - totalValidos;

  if (!confirmar) {
    return NextResponse.json({ linhasValidadas, totalValidos, totalInvalidos });
  }

  let importados = 0;
  for (const linha of linhasValidadas) {
    if (!linha.valido) continue;
    await veiculosRepo.create({
      prefixo: linha.prefixo,
      placa: linha.placa,
      garagemId: linha.garagemId,
      fabricante: linha.fabricante,
      modelo: linha.modelo,
      ano: linha.ano,
      tipoVeiculo: linha.tipoVeiculo,
      observacao: linha.observacao,
      status: "ATIVO",
    });
    importados += 1;
  }

  return NextResponse.json({ linhasValidadas, totalValidos, totalInvalidos, importados });
}

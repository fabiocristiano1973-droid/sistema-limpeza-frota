import { NextRequest, NextResponse } from "next/server";
import { CADASTROS, isEntidadeValida } from "@/lib/repository/cadastro-registry";
import { exigirPerfilApi } from "@/lib/auth/dal";

export const runtime = "nodejs";

function normalizarDados(entidade: string, dados: Record<string, unknown>) {
  if (entidade === "veiculos") {
    return {
      ...dados,
      prefixo: String(dados.prefixo ?? "").trim(),
      placa: String(dados.placa ?? "")
        .trim()
        .toUpperCase(),
    };
  }
  return dados;
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ entidade: string }> }) {
  const sessao = await exigirPerfilApi(["ADMIN"]);
  if (!sessao) {
    return NextResponse.json({ erro: "Apenas administradores podem alterar cadastros." }, { status: 403 });
  }

  const { entidade } = await ctx.params;
  if (!isEntidadeValida(entidade)) {
    return NextResponse.json({ erro: "Cadastro não encontrado." }, { status: 404 });
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

  const config = CADASTROS[entidade];
  const dados = normalizarDados(entidade, body as Record<string, unknown>);

  for (const campo of config.camposObrigatorios) {
    const valor = dados[campo];
    if (valor === undefined || valor === null || String(valor).trim() === "") {
      return NextResponse.json({ erro: `Campo obrigatório ausente: ${campo}` }, { status: 400 });
    }
  }

  if (config.validarExtra) {
    const erro = await config.validarExtra(dados);
    if (erro) return NextResponse.json({ erro }, { status: 409 });
  }

  const criado = await config.repo.create(dados);
  return NextResponse.json(criado, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { CADASTROS, isEntidadeValida } from "@/lib/repository/cadastro-registry";
import { exigirPerfilApi } from "@/lib/auth/dal";

export const runtime = "nodejs";

function normalizarDados(entidade: string, dados: Record<string, unknown>) {
  if (entidade === "veiculos") {
    const normalizado = { ...dados };
    if (typeof dados.prefixo === "string") normalizado.prefixo = dados.prefixo.trim();
    if (typeof dados.placa === "string") normalizado.placa = dados.placa.trim().toUpperCase();
    return normalizado;
  }
  return dados;
}

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ entidade: string; id: string }> }
) {
  const sessao = await exigirPerfilApi(["ADMIN"]);
  if (!sessao) {
    return NextResponse.json({ erro: "Apenas administradores podem alterar cadastros." }, { status: 403 });
  }

  const { entidade, id } = await ctx.params;
  if (!isEntidadeValida(entidade)) {
    return NextResponse.json({ erro: "Cadastro não encontrado." }, { status: 404 });
  }

  const config = CADASTROS[entidade];
  const existente = await config.repo.getById(id);
  if (!existente) {
    return NextResponse.json({ erro: "Registro não encontrado." }, { status: 404 });
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

  const dados = normalizarDados(entidade, body as Record<string, unknown>);

  // Só valida obrigatoriedade dos campos que vieram no corpo (permite PATCH
  // parcial, ex.: apenas { status: "INATIVO" } para ativar/inativar).
  for (const campo of config.camposObrigatorios) {
    if (campo in dados) {
      const valor = dados[campo];
      if (valor === undefined || valor === null || String(valor).trim() === "") {
        return NextResponse.json({ erro: `Campo obrigatório ausente: ${campo}` }, { status: 400 });
      }
    }
  }

  if (config.validarExtra) {
    // Mescla o registro existente com o patch para validar o estado
    // resultante completo (ex.: prefixo/placa de veículos, ou
    // aplicacaoTipo/aplicacaoClassificacao de itens do checklist), mesmo
    // quando o campo em questão não veio no corpo da requisição.
    const mesclado = { ...existente, ...dados };
    const erro = await config.validarExtra(mesclado, id);
    if (erro) return NextResponse.json({ erro }, { status: 409 });
  }

  const atualizado = await config.repo.update(id, dados);
  return NextResponse.json(atualizado, { status: 200 });
}

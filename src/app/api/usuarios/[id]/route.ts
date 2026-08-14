import { NextRequest, NextResponse } from "next/server";
import { usuariosRepo, loginJaExiste } from "@/lib/repository/usuarios";
import { hashPassword } from "@/lib/auth/password";
import { exigirPerfilApi } from "@/lib/auth/dal";
import { paraUsuarioPublico, PerfilUsuario } from "@/types/auth";

export const runtime = "nodejs";

const PERFIS_VALIDOS: PerfilUsuario[] = ["INSPETOR", "GESTOR", "ADMIN"];

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const sessao = await exigirPerfilApi(["ADMIN"]);
  if (!sessao) return NextResponse.json({ erro: "Acesso restrito a administradores." }, { status: 403 });

  const { id } = await ctx.params;
  const existente = await usuariosRepo.getById(id);
  if (!existente) return NextResponse.json({ erro: "Usuário não encontrado." }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ erro: "JSON inválido." }, { status: 400 });
  }

  const { nome, login, senha, perfil, status } = (body ?? {}) as {
    nome?: string;
    login?: string;
    senha?: string;
    perfil?: string;
    status?: string;
  };

  if (perfil && !PERFIS_VALIDOS.includes(perfil as PerfilUsuario)) {
    return NextResponse.json({ erro: "Perfil inválido." }, { status: 400 });
  }
  if (login && (await loginJaExiste(login, id))) {
    return NextResponse.json({ erro: `Já existe um usuário com o login "${login}".` }, { status: 409 });
  }
  if (senha && senha.length < 8) {
    return NextResponse.json({ erro: "A senha deve ter pelo menos 8 caracteres." }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (nome?.trim()) patch.nome = nome.trim();
  if (login?.trim()) patch.login = login.trim();
  if (perfil) patch.perfil = perfil;
  if (status === "ATIVO" || status === "INATIVO") patch.status = status;
  if (senha) {
    patch.senhaHash = hashPassword(senha);
    patch.deveTrocarSenha = true;
  }

  const atualizado = await usuariosRepo.update(id, patch);
  return NextResponse.json(paraUsuarioPublico(atualizado));
}

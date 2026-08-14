import { NextRequest, NextResponse } from "next/server";
import { usuariosRepo, loginJaExiste } from "@/lib/repository/usuarios";
import { hashPassword } from "@/lib/auth/password";
import { exigirPerfilApi } from "@/lib/auth/dal";
import { paraUsuarioPublico, PerfilUsuario } from "@/types/auth";

export const runtime = "nodejs";

const PERFIS_VALIDOS: PerfilUsuario[] = ["INSPETOR", "GESTOR", "ADMIN"];

export async function GET() {
  const sessao = await exigirPerfilApi(["ADMIN"]);
  if (!sessao) return NextResponse.json({ erro: "Acesso restrito a administradores." }, { status: 403 });

  const usuarios = await usuariosRepo.list();
  return NextResponse.json(usuarios.map(paraUsuarioPublico));
}

export async function POST(request: NextRequest) {
  const sessao = await exigirPerfilApi(["ADMIN"]);
  if (!sessao) return NextResponse.json({ erro: "Acesso restrito a administradores." }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ erro: "JSON inválido." }, { status: 400 });
  }

  const { nome, login, senha, perfil } = (body ?? {}) as {
    nome?: string;
    login?: string;
    senha?: string;
    perfil?: string;
  };

  if (!nome?.trim() || !login?.trim() || !senha || !perfil) {
    return NextResponse.json({ erro: "Preencha nome, login, senha e perfil." }, { status: 400 });
  }
  if (!PERFIS_VALIDOS.includes(perfil as PerfilUsuario)) {
    return NextResponse.json({ erro: "Perfil inválido." }, { status: 400 });
  }
  if (senha.length < 8) {
    return NextResponse.json({ erro: "A senha deve ter pelo menos 8 caracteres." }, { status: 400 });
  }
  if (await loginJaExiste(login)) {
    return NextResponse.json({ erro: `Já existe um usuário com o login "${login}".` }, { status: 409 });
  }

  const criado = await usuariosRepo.create({
    nome: nome.trim(),
    login: login.trim(),
    senhaHash: hashPassword(senha),
    perfil: perfil as PerfilUsuario,
    deveTrocarSenha: true,
  });

  return NextResponse.json(paraUsuarioPublico(criado), { status: 201 });
}

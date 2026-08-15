import { NextRequest, NextResponse } from "next/server";
import { buscarUsuarioPorLogin } from "@/lib/repository/usuarios";
import { verifyPassword } from "@/lib/auth/password";
import { criarSessao } from "@/lib/auth/session";
import { paraUsuarioPublico } from "@/types/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ erro: "JSON inválido." }, { status: 400 });
  }

  const { login, senha } = (body ?? {}) as { login?: string; senha?: string };
  if (!login || !senha) {
    return NextResponse.json({ erro: "Informe login e senha." }, { status: 400 });
  }

  const usuario = await buscarUsuarioPorLogin(login);
  if (!usuario || usuario.status !== "ATIVO" || !verifyPassword(senha, usuario.senhaHash)) {
    return NextResponse.json({ erro: "Login ou senha inválidos." }, { status: 401 });
  }

  await criarSessao({
    userId: usuario.id,
    nome: usuario.nome,
    login: usuario.login,
    perfil: usuario.perfil,
    deveTrocarSenha: usuario.deveTrocarSenha,
  });

  return NextResponse.json({ usuario: paraUsuarioPublico(usuario) });
}

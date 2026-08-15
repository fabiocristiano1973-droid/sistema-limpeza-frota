import { NextRequest, NextResponse } from "next/server";
import { usuariosRepo } from "@/lib/repository/usuarios";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { criarSessao } from "@/lib/auth/session";
import { sessaoDaApi } from "@/lib/auth/dal";

export const runtime = "nodejs";

/**
 * Autoatendimento: o próprio usuário autenticado troca a sua senha —
 * cobre tanto a troca obrigatória de senha provisória (deveTrocarSenha)
 * quanto a troca voluntária a qualquer momento. Diferente de
 * PATCH /api/usuarios/[id], que é restrito a ADMIN e troca a senha de
 * QUALQUER usuário sem confirmar a senha atual.
 */
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

  const { senhaAtual, novaSenha } = (body ?? {}) as { senhaAtual?: string; novaSenha?: string };
  if (!senhaAtual || !novaSenha) {
    return NextResponse.json({ erro: "Informe a senha atual e a nova senha." }, { status: 400 });
  }
  if (novaSenha.length < 8) {
    return NextResponse.json({ erro: "A nova senha deve ter pelo menos 8 caracteres." }, { status: 400 });
  }

  const usuario = await usuariosRepo.getById(sessao.userId);
  if (!usuario || usuario.status !== "ATIVO") {
    return NextResponse.json({ erro: "Usuário não encontrado ou inativo." }, { status: 403 });
  }
  if (!verifyPassword(senhaAtual, usuario.senhaHash)) {
    return NextResponse.json({ erro: "Senha atual incorreta." }, { status: 400 });
  }

  await usuariosRepo.update(usuario.id, {
    senhaHash: hashPassword(novaSenha),
    deveTrocarSenha: false,
  });

  // Reemite a sessão já com deveTrocarSenha=false — sem isso o proxy
  // continuaria redirecionando para /trocar-senha até o próximo login.
  await criarSessao({
    userId: usuario.id,
    nome: usuario.nome,
    login: usuario.login,
    perfil: usuario.perfil,
    deveTrocarSenha: false,
  });

  return NextResponse.json({ ok: true });
}

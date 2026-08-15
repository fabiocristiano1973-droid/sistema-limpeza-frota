import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { getSessionSecret } from "./secret";
import { PerfilUsuario } from "@/types/auth";

export interface SessionPayload {
  userId: string;
  nome: string;
  login: string;
  perfil: PerfilUsuario;
  // Snapshot do momento do login — usado pelo proxy para forçar a troca de
  // senha antes de liberar qualquer outra tela. Sessões antigas (emitidas
  // antes deste campo existir) decodificam com `undefined`, tratado como
  // "não precisa trocar" — não bloqueia retroativamente quem já tinha sessão.
  deveTrocarSenha: boolean;
  exp: number;
}

export const SESSION_COOKIE_NAME = "slf_session";
const DURACAO_MS = 12 * 60 * 60 * 1000; // 12h

function sign(valor: string): string {
  return createHmac("sha256", getSessionSecret()).update(valor).digest("hex");
}

function empacotar(payload: SessionPayload): string {
  const json = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${json}.${sign(json)}`;
}

export function decodificarSessao(valorCookie: string | undefined): SessionPayload | null {
  if (!valorCookie) return null;
  const [json, assinatura] = valorCookie.split(".");
  if (!json || !assinatura) return null;

  const esperada = sign(json);
  const a = Buffer.from(assinatura);
  const b = Buffer.from(esperada);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(json, "base64url").toString("utf-8")) as SessionPayload;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Cookie sem `secure`: o sistema roda apenas em HTTP (rede local/notebook),
 * sem TLS configurado. Reavaliar quando o Objetivo 6 (acesso HTTPS externo)
 * for implementado.
 */
export async function criarSessao(dados: Omit<SessionPayload, "exp">): Promise<void> {
  const payload: SessionPayload = { ...dados, exp: Date.now() + DURACAO_MS };
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, empacotar(payload), {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: DURACAO_MS / 1000,
  });
}

export async function destruirSessao(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function obterSessao(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  return decodificarSessao(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

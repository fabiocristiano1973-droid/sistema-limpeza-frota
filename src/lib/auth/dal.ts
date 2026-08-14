import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { obterSessao, SessionPayload } from "./session";
import { PerfilUsuario } from "@/types/auth";

/** Para uso em páginas/Server Components: redireciona para /login se não houver sessão. */
export const verificarSessao = cache(async (): Promise<SessionPayload> => {
  const sessao = await obterSessao();
  if (!sessao) redirect("/login");
  return sessao;
});

/** Para uso em Route Handlers: nunca redireciona, apenas retorna a sessão (ou null). */
export async function sessaoDaApi(): Promise<SessionPayload | null> {
  return obterSessao();
}

/** Para uso em Route Handlers: retorna a sessão só se o perfil for permitido. */
export async function exigirPerfilApi(perfis: PerfilUsuario[]): Promise<SessionPayload | null> {
  const sessao = await obterSessao();
  if (!sessao || !perfis.includes(sessao.perfil)) return null;
  return sessao;
}

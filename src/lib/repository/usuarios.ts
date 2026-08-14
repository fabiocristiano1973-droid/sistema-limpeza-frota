import { createSqliteCrudRepository } from "./sqlite-crud-repository";
import { Usuario } from "@/types/auth";

export const usuariosRepo = createSqliteCrudRepository<Usuario>("usuarios", () => []);

export async function buscarUsuarioPorLogin(login: string): Promise<Usuario | null> {
  const todos = await usuariosRepo.list();
  const alvo = login.trim().toLowerCase();
  return todos.find((u) => u.login.toLowerCase() === alvo) ?? null;
}

export async function loginJaExiste(login: string, idExcluir?: string): Promise<boolean> {
  const todos = await usuariosRepo.list();
  const alvo = login.trim().toLowerCase();
  return todos.some((u) => u.id !== idExcluir && u.login.toLowerCase() === alvo);
}

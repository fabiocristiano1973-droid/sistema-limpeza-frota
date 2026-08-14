import { StatusCadastro } from "./cadastros";

export type PerfilUsuario = "INSPETOR" | "GESTOR" | "ADMIN";

export interface Usuario {
  id: string;
  nome: string;
  login: string;
  senhaHash: string;
  perfil: PerfilUsuario;
  deveTrocarSenha: boolean;
  status: StatusCadastro;
  criadoEm: string;
  atualizadoEm: string;
}

export type UsuarioPublico = Omit<Usuario, "senhaHash">;

export function paraUsuarioPublico(usuario: Usuario): UsuarioPublico {
  const resto: Partial<Usuario> = { ...usuario };
  delete resto.senhaHash;
  return resto as UsuarioPublico;
}

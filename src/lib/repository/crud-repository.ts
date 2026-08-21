import { StatusCadastro } from "@/types/cadastros";
import { getDbDriver } from "@/lib/db/driver";
import { createSqliteCrudRepository } from "./sqlite-crud-repository";
import { createPostgresCrudRepository } from "./postgres-crud-repository";
import { JsonCrudRepository } from "./json-crud-factory";

interface EntidadeBase {
  id: string;
  status: StatusCadastro;
  criadoEm: string;
  atualizadoEm: string;
}

/**
 * Ponto único de troca de storage para os cadastros (veículos, garagens,
 * itens de checklist, etc.) e usuários — mesmo papel que getRepository() tem
 * para inspeções (repository/index.ts). Decidido por getDbDriver().
 */
export function createCrudRepository<T extends EntidadeBase>(
  tableName: string,
  seed: () => Omit<T, "criadoEm" | "atualizadoEm">[]
): JsonCrudRepository<T> {
  return getDbDriver() === "postgres"
    ? createPostgresCrudRepository<T>(tableName, seed)
    : createSqliteCrudRepository<T>(tableName, seed);
}

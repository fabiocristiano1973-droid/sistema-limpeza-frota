import { randomUUID } from "crypto";
import { StatusCadastro } from "@/types/cadastros";
import { getDb } from "@/lib/db/sqlite";
import { JsonCrudRepository } from "./json-crud-factory";

interface EntidadeBase {
  id: string;
  status: StatusCadastro;
  criadoEm: string;
  atualizadoEm: string;
}

/**
 * Repositório CRUD genérico com persistência em SQLite (uma tabela por
 * entidade, registro completo guardado como JSON na coluna `data`, com
 * colunas indexadas para consultas simples). Implementa a mesma interface
 * de `json-crud-factory.ts`, então nenhuma página/API precisa mudar.
 */
export function createSqliteCrudRepository<T extends EntidadeBase>(
  tableName: string,
  seed: () => Omit<T, "criadoEm" | "atualizadoEm">[]
): JsonCrudRepository<T> {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS ${tableName} (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      criado_em TEXT NOT NULL,
      atualizado_em TEXT NOT NULL,
      data TEXT NOT NULL
    )
  `);

  const countStmt = db.prepare(`SELECT COUNT(*) as c FROM ${tableName}`);
  const total = countStmt.get() as { c: number };
  if (total.c === 0) {
    const agora = new Date().toISOString();
    const registros = seed().map((dados) => ({
      ...dados,
      criadoEm: agora,
      atualizadoEm: agora,
    })) as T[];
    const insert = db.prepare(
      `INSERT INTO ${tableName} (id, status, criado_em, atualizado_em, data) VALUES (?, ?, ?, ?, ?)`
    );
    db.exec("BEGIN");
    try {
      for (const registro of registros) {
        insert.run(registro.id, registro.status, registro.criadoEm, registro.atualizadoEm, JSON.stringify(registro));
      }
      db.exec("COMMIT");
    } catch (err) {
      db.exec("ROLLBACK");
      throw err;
    }
  }

  function getRow(id: string): T | null {
    const row = db.prepare(`SELECT data FROM ${tableName} WHERE id = ?`).get(id) as
      | { data: string }
      | undefined;
    return row ? (JSON.parse(row.data) as T) : null;
  }

  return {
    async list() {
      const rows = db.prepare(`SELECT data FROM ${tableName}`).all() as { data: string }[];
      return rows.map((r) => JSON.parse(r.data) as T);
    },

    async getById(id) {
      return getRow(id);
    },

    async create(dados) {
      const agora = new Date().toISOString();
      const registro = {
        ...dados,
        status: dados.status ?? "ATIVO",
        id: randomUUID(),
        criadoEm: agora,
        atualizadoEm: agora,
      } as T;
      db.prepare(`INSERT INTO ${tableName} (id, status, criado_em, atualizado_em, data) VALUES (?, ?, ?, ?, ?)`).run(
        registro.id,
        registro.status,
        registro.criadoEm,
        registro.atualizadoEm,
        JSON.stringify(registro)
      );
      return registro;
    },

    async update(id, dados) {
      const existente = getRow(id);
      if (!existente) throw new Error("Registro não encontrado.");
      const atualizado: T = {
        ...existente,
        ...dados,
        id: existente.id,
        criadoEm: existente.criadoEm,
        atualizadoEm: new Date().toISOString(),
      };
      db.prepare(`UPDATE ${tableName} SET status = ?, atualizado_em = ?, data = ? WHERE id = ?`).run(
        atualizado.status,
        atualizado.atualizadoEm,
        JSON.stringify(atualizado),
        id
      );
      return atualizado;
    },

    async setStatus(id, status) {
      const existente = getRow(id);
      if (!existente) throw new Error("Registro não encontrado.");
      const atualizado = { ...existente, status, atualizadoEm: new Date().toISOString() } as T;
      db.prepare(`UPDATE ${tableName} SET status = ?, atualizado_em = ?, data = ? WHERE id = ?`).run(
        status,
        atualizado.atualizadoEm,
        JSON.stringify(atualizado),
        id
      );
      return atualizado;
    },
  };
}

import { randomUUID } from "crypto";
import { StatusCadastro } from "@/types/cadastros";
import { getPool } from "@/lib/db/postgres";
import { JsonCrudRepository } from "./json-crud-factory";

interface EntidadeBase {
  id: string;
  status: StatusCadastro;
  criadoEm: string;
  atualizadoEm: string;
}

/**
 * Espelho de sqlite-crud-repository.ts, mesma interface (JsonCrudRepository),
 * trocando `node:sqlite` síncrono por `pg` assíncrono. Mesmo desenho de
 * tabela: uma linha por registro, campo `data` guarda o registro inteiro
 * como JSON — aqui em `jsonb` nativo do Postgres em vez de `TEXT`.
 *
 * A criação de tabela/seed não pode rodar no carregamento do módulo (como
 * na versão SQLite, que é síncrona) porque toda chamada ao Postgres é
 * assíncrona — por isso `ensureReady()` é preparado uma vez (memoizado) e
 * aguardado no início de cada operação, mesmo padrão já usado em
 * json-crud-factory.ts com `ensureDataFile()`.
 */
export function createPostgresCrudRepository<T extends EntidadeBase>(
  tableName: string,
  seed: () => Omit<T, "criadoEm" | "atualizadoEm">[]
): JsonCrudRepository<T> {
  const pool = getPool();
  let ready: Promise<void> | null = null;

  function ensureReady(): Promise<void> {
    if (!ready) {
      ready = (async () => {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS ${tableName} (
            id TEXT PRIMARY KEY,
            status TEXT NOT NULL,
            criado_em TEXT NOT NULL,
            atualizado_em TEXT NOT NULL,
            data JSONB NOT NULL
          )
        `);

        const { rows } = await pool.query(`SELECT COUNT(*)::int as c FROM ${tableName}`);
        if (rows[0].c === 0) {
          const agora = new Date().toISOString();
          const registros = seed().map((dados) => ({
            ...dados,
            criadoEm: agora,
            atualizadoEm: agora,
          })) as T[];

          const client = await pool.connect();
          try {
            await client.query("BEGIN");
            for (const registro of registros) {
              await client.query(
                `INSERT INTO ${tableName} (id, status, criado_em, atualizado_em, data) VALUES ($1, $2, $3, $4, $5)`,
                [registro.id, registro.status, registro.criadoEm, registro.atualizadoEm, JSON.stringify(registro)]
              );
            }
            await client.query("COMMIT");
          } catch (err) {
            await client.query("ROLLBACK");
            throw err;
          } finally {
            client.release();
          }
        }
      })();
    }
    return ready;
  }

  async function getRow(id: string): Promise<T | null> {
    const { rows } = await pool.query(`SELECT data FROM ${tableName} WHERE id = $1`, [id]);
    return rows[0] ? (rows[0].data as T) : null;
  }

  return {
    async list() {
      await ensureReady();
      const { rows } = await pool.query(`SELECT data FROM ${tableName}`);
      return rows.map((r) => r.data as T);
    },

    async getById(id) {
      await ensureReady();
      return getRow(id);
    },

    async create(dados) {
      await ensureReady();
      const agora = new Date().toISOString();
      const registro = {
        ...dados,
        status: dados.status ?? "ATIVO",
        id: randomUUID(),
        criadoEm: agora,
        atualizadoEm: agora,
      } as T;
      await pool.query(
        `INSERT INTO ${tableName} (id, status, criado_em, atualizado_em, data) VALUES ($1, $2, $3, $4, $5)`,
        [registro.id, registro.status, registro.criadoEm, registro.atualizadoEm, JSON.stringify(registro)]
      );
      return registro;
    },

    async update(id, dados) {
      await ensureReady();
      const existente = await getRow(id);
      if (!existente) throw new Error("Registro não encontrado.");
      const atualizado: T = {
        ...existente,
        ...dados,
        id: existente.id,
        criadoEm: existente.criadoEm,
        atualizadoEm: new Date().toISOString(),
      };
      await pool.query(`UPDATE ${tableName} SET status = $1, atualizado_em = $2, data = $3 WHERE id = $4`, [
        atualizado.status,
        atualizado.atualizadoEm,
        JSON.stringify(atualizado),
        id,
      ]);
      return atualizado;
    },

    async setStatus(id, status) {
      await ensureReady();
      const existente = await getRow(id);
      if (!existente) throw new Error("Registro não encontrado.");
      const atualizado = { ...existente, status, atualizadoEm: new Date().toISOString() } as T;
      await pool.query(`UPDATE ${tableName} SET status = $1, atualizado_em = $2, data = $3 WHERE id = $4`, [
        status,
        atualizado.atualizadoEm,
        JSON.stringify(atualizado),
        id,
      ]);
      return atualizado;
    },
  };
}

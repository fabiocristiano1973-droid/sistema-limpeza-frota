import { Inspecao, InspectionFilter } from "@/types/inspection";
import { getPool } from "@/lib/db/postgres";
import { InspectionRepository } from "./types";
import { Pool } from "pg";

function matchesFilter(inspecao: Inspecao, filter?: InspectionFilter): boolean {
  if (!filter) return true;

  if (filter.from && inspecao.criadoEm < filter.from) return false;
  if (filter.to && inspecao.criadoEm > filter.to) return false;
  if (filter.prefixo && !inspecao.prefixo.toLowerCase().includes(filter.prefixo.toLowerCase()))
    return false;
  if (filter.garagem && filter.garagem !== "" && inspecao.garagem !== filter.garagem)
    return false;
  if (filter.turno && filter.turno !== "" && inspecao.turno !== filter.turno) return false;
  if (
    filter.inspetor &&
    !inspecao.inspetor.toLowerCase().includes(filter.inspetor.toLowerCase())
  )
    return false;
  if (filter.equipe && filter.equipe !== "" && inspecao.equipe !== filter.equipe) return false;
  if (filter.tipoLimpeza && filter.tipoLimpeza !== "" && inspecao.tipoLimpeza !== filter.tipoLimpeza)
    return false;
  if (filter.resultado && inspecao.resumo.resultado !== filter.resultado) return false;
  if (filter.q) {
    const q = filter.q.toLowerCase();
    const haystack = `${inspecao.prefixo} ${inspecao.placa} ${inspecao.inspetor} ${inspecao.equipe} ${inspecao.garagem}`.toLowerCase();
    if (!haystack.includes(q)) return false;
  }

  return true;
}

/**
 * Espelho de sqlite-inspection-repository.ts. Mesma lógica de filtro (feita
 * em memória, não em SQL) de propósito — mantém paridade exata de
 * comportamento entre os dois drivers em vez de reimplementar os filtros
 * como WHERE/JSONB operators, o que arriscaria divergência sutil.
 */
export class PostgresInspectionRepository implements InspectionRepository {
  private pool: Pool = getPool();
  private ready: Promise<void> | null = null;

  private ensureReady(): Promise<void> {
    if (!this.ready) {
      this.ready = this.pool
        .query(
          `CREATE TABLE IF NOT EXISTS inspecoes (
            id TEXT PRIMARY KEY,
            criado_em TEXT NOT NULL,
            data JSONB NOT NULL
          )`
        )
        .then(() => undefined);
    }
    return this.ready;
  }

  async create(inspecao: Inspecao): Promise<Inspecao> {
    await this.ensureReady();
    await this.pool.query(`INSERT INTO inspecoes (id, criado_em, data) VALUES ($1, $2, $3)`, [
      inspecao.id,
      inspecao.criadoEm,
      JSON.stringify(inspecao),
    ]);
    return inspecao;
  }

  async list(filter?: InspectionFilter): Promise<Inspecao[]> {
    await this.ensureReady();
    const { rows } = await this.pool.query(`SELECT data FROM inspecoes`);
    const all = rows.map((r) => r.data as Inspecao);
    return all
      .filter((i) => matchesFilter(i, filter))
      .sort((a, b) => (a.criadoEm < b.criadoEm ? 1 : -1));
  }

  async getById(id: string): Promise<Inspecao | null> {
    await this.ensureReady();
    const { rows } = await this.pool.query(`SELECT data FROM inspecoes WHERE id = $1`, [id]);
    return rows[0] ? (rows[0].data as Inspecao) : null;
  }
}

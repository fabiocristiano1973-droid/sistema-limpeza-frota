import { Inspecao, InspectionFilter } from "@/types/inspection";
import { getDb } from "@/lib/db/sqlite";
import { InspectionRepository } from "./types";

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

export class SqliteInspectionRepository implements InspectionRepository {
  private db = getDb();

  constructor() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS inspecoes (
        id TEXT PRIMARY KEY,
        criado_em TEXT NOT NULL,
        data TEXT NOT NULL
      )
    `);
  }

  async create(inspecao: Inspecao): Promise<Inspecao> {
    this.db
      .prepare(`INSERT INTO inspecoes (id, criado_em, data) VALUES (?, ?, ?)`)
      .run(inspecao.id, inspecao.criadoEm, JSON.stringify(inspecao));
    return inspecao;
  }

  async list(filter?: InspectionFilter): Promise<Inspecao[]> {
    const rows = this.db.prepare(`SELECT data FROM inspecoes`).all() as { data: string }[];
    const all = rows.map((r) => JSON.parse(r.data) as Inspecao);
    return all
      .filter((i) => matchesFilter(i, filter))
      .sort((a, b) => (a.criadoEm < b.criadoEm ? 1 : -1));
  }

  async getById(id: string): Promise<Inspecao | null> {
    const row = this.db.prepare(`SELECT data FROM inspecoes WHERE id = ?`).get(id) as
      | { data: string }
      | undefined;
    return row ? (JSON.parse(row.data) as Inspecao) : null;
  }
}

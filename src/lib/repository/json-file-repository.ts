import { promises as fs } from "fs";
import path from "path";
import { Inspecao, InspectionFilter } from "@/types/inspection";
import { InspectionRepository } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "inspections.json");

// Mutex simples em memória: evita corrida de leitura/escrita concorrente
// dentro do mesmo processo do servidor Next.js (uso local, single-instance).
let writeQueue: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const result = writeQueue.then(fn, fn);
  writeQueue = result.catch(() => undefined);
  return result;
}

async function ensureDataFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, "[]", "utf-8");
  }
}

async function readAll(): Promise<Inspecao[]> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  if (!raw.trim()) return [];
  try {
    return JSON.parse(raw) as Inspecao[];
  } catch {
    return [];
  }
}

async function writeAll(inspecoes: Inspecao[]): Promise<void> {
  await ensureDataFile();
  const tmpFile = `${DATA_FILE}.tmp`;
  await fs.writeFile(tmpFile, JSON.stringify(inspecoes, null, 2), "utf-8");
  // O diretório de dados pode estar sincronizado pelo OneDrive, que às vezes
  // prende o arquivo por um instante (EPERM/EBUSY) durante o rename. Tenta
  // novamente algumas vezes antes de desistir.
  for (let tentativa = 1; ; tentativa++) {
    try {
      await fs.rename(tmpFile, DATA_FILE);
      return;
    } catch (err) {
      const codigo = (err as NodeJS.ErrnoException).code;
      if (tentativa >= 5 || (codigo !== "EPERM" && codigo !== "EBUSY")) throw err;
      await new Promise((resolve) => setTimeout(resolve, 100 * tentativa));
    }
  }
}

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

export class JsonFileInspectionRepository implements InspectionRepository {
  async create(inspecao: Inspecao): Promise<Inspecao> {
    return withLock(async () => {
      const all = await readAll();
      all.push(inspecao);
      await writeAll(all);
      return inspecao;
    });
  }

  async list(filter?: InspectionFilter): Promise<Inspecao[]> {
    const all = await readAll();
    return all
      .filter((i) => matchesFilter(i, filter))
      .sort((a, b) => (a.criadoEm < b.criadoEm ? 1 : -1));
  }

  async getById(id: string): Promise<Inspecao | null> {
    const all = await readAll();
    return all.find((i) => i.id === id) ?? null;
  }
}

import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { StatusCadastro } from "@/types/cadastros";

const DATA_DIR = path.join(process.cwd(), "data");

interface EntidadeBase {
  id: string;
  status: StatusCadastro;
  criadoEm: string;
  atualizadoEm: string;
}

export interface JsonCrudRepository<T extends EntidadeBase> {
  list(): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  create(dados: Omit<T, "id" | "criadoEm" | "atualizadoEm" | "status"> & { status?: StatusCadastro }): Promise<T>;
  update(id: string, dados: Partial<Omit<T, "id" | "criadoEm" | "atualizadoEm">>): Promise<T>;
  setStatus(id: string, status: StatusCadastro): Promise<T>;
}

/**
 * Fábrica de repositório CRUD genérico com persistência em arquivo JSON local.
 * Cada cadastro (veículos, garagens, tipos de limpeza, inspetores, equipes)
 * usa esta mesma implementação, trocando apenas o nome do arquivo e o seed
 * inicial. Para migrar para Supabase/PostgreSQL no futuro, basta escrever uma
 * implementação alternativa de JsonCrudRepository<T> por entidade — as
 * páginas e API routes que consomem o repositório não precisam mudar.
 */
export function createJsonCrudRepository<T extends EntidadeBase>(
  fileName: string,
  // O seed já traz o `id` fixo (determinístico) para permitir que outros
  // cadastros de seed façam referência cruzada (ex: veículo -> garagemId).
  seed: () => Omit<T, "criadoEm" | "atualizadoEm">[]
): JsonCrudRepository<T> {
  const filePath = path.join(DATA_DIR, fileName);

  let writeQueue: Promise<unknown> = Promise.resolve();
  function withLock<R>(fn: () => Promise<R>): Promise<R> {
    const result = writeQueue.then(fn, fn);
    writeQueue = result.catch(() => undefined);
    return result;
  }

  async function ensureDataFile(): Promise<void> {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      await fs.access(filePath);
    } catch {
      const agora = new Date().toISOString();
      const registros = seed().map((dados) => ({
        ...dados,
        criadoEm: agora,
        atualizadoEm: agora,
      })) as T[];
      await fs.writeFile(filePath, JSON.stringify(registros, null, 2), "utf-8");
    }
  }

  async function readAll(): Promise<T[]> {
    await ensureDataFile();
    const raw = await fs.readFile(filePath, "utf-8");
    if (!raw.trim()) return [];
    try {
      return JSON.parse(raw) as T[];
    } catch {
      return [];
    }
  }

  async function writeAll(registros: T[]): Promise<void> {
    await ensureDataFile();
    const tmpFile = `${filePath}.tmp`;
    await fs.writeFile(tmpFile, JSON.stringify(registros, null, 2), "utf-8");
    // O diretório de dados pode estar sincronizado pelo OneDrive, que às
    // vezes prende o arquivo por um instante (EPERM/EBUSY) durante o
    // rename. Tenta novamente algumas vezes antes de desistir.
    for (let tentativa = 1; ; tentativa++) {
      try {
        await fs.rename(tmpFile, filePath);
        return;
      } catch (err) {
        const codigo = (err as NodeJS.ErrnoException).code;
        if (tentativa >= 5 || (codigo !== "EPERM" && codigo !== "EBUSY")) throw err;
        await new Promise((resolve) => setTimeout(resolve, 100 * tentativa));
      }
    }
  }

  return {
    async list() {
      return readAll();
    },

    async getById(id) {
      const all = await readAll();
      return all.find((r) => r.id === id) ?? null;
    },

    async create(dados) {
      return withLock(async () => {
        const all = await readAll();
        const agora = new Date().toISOString();
        const registro = {
          ...dados,
          status: dados.status ?? "ATIVO",
          id: randomUUID(),
          criadoEm: agora,
          atualizadoEm: agora,
        } as T;
        all.push(registro);
        await writeAll(all);
        return registro;
      });
    },

    async update(id, dados) {
      return withLock(async () => {
        const all = await readAll();
        const idx = all.findIndex((r) => r.id === id);
        if (idx === -1) throw new Error("Registro não encontrado.");
        const atualizado: T = {
          ...all[idx],
          ...dados,
          id: all[idx].id,
          criadoEm: all[idx].criadoEm,
          atualizadoEm: new Date().toISOString(),
        };
        all[idx] = atualizado;
        await writeAll(all);
        return atualizado;
      });
    },

    async setStatus(id, status) {
      return withLock(async () => {
        const all = await readAll();
        const idx = all.findIndex((r) => r.id === id);
        if (idx === -1) throw new Error("Registro não encontrado.");
        all[idx] = { ...all[idx], status, atualizadoEm: new Date().toISOString() };
        await writeAll(all);
        return all[idx];
      });
    },
  };
}

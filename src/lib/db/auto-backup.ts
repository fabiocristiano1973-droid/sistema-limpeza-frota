import "server-only";
import fs from "fs";
import path from "path";
import { DatabaseSync, backup } from "node:sqlite";
import { getDataDir } from "@/lib/data-dir";

// @types/node instalado (v20) ainda não inclui `backup` em node:sqlite —
// a função existe no runtime real (Node 24, ver package.json/engines), mesma
// premissa já usada em scripts/reset-admin-password.mjs e
// scripts/reorganizar-fluxo-checklist.mjs. Sem isto o tsc rejeita o import.
declare module "node:sqlite" {
  export function backup(sourceDb: DatabaseSync, destinationPath: string): Promise<number>;
}

/**
 * Backup automático reforçado, temporário, enquanto a causa do incidente de
 * 2026-08-15 (banco reduzido a um esqueleto vazio de um dia para o outro)
 * não for confirmada. Roda no boot e periodicamente (ver instrumentation.ts).
 * Usa a mesma técnica de Online Backup do SQLite dos scripts administrativos
 * (scripts/reset-admin-password.mjs etc.) — segura mesmo com o servidor
 * escrevendo no banco ao mesmo tempo.
 */

// process.cwd() é a raiz do projeto quando rodando via `next start`/`next dev`
// (start-prod.ps1 define -WorkingDirectory antes de subir o processo).
const BACKUPS_DIR = path.join(process.cwd(), "backups");
const LIMITE_BACKUPS_AUTOMATICOS = 48; // ~12h a cada 15min; evita crescimento sem limite

function caminhoBanco(): string {
  return path.join(getDataDir(), "sistema-limpeza-frota.db");
}

export interface ResultadoBackup {
  ok: boolean;
  caminho?: string;
  erro?: string;
}

export async function backupAutomatico(motivo: string): Promise<ResultadoBackup> {
  const dbPath = caminhoBanco();
  if (!fs.existsSync(dbPath)) {
    return { ok: false, erro: "Banco ainda não existe — nada para copiar." };
  }

  const carimbo = new Date().toISOString().replace(/[:.]/g, "-");
  const destDir = path.join(BACKUPS_DIR, `auto-${motivo}-${carimbo}`);
  const destPath = path.join(destDir, "sistema-limpeza-frota.db");

  let origem: InstanceType<typeof DatabaseSync> | null = null;
  try {
    fs.mkdirSync(destDir, { recursive: true });
    origem = new DatabaseSync(dbPath, { readOnly: true });
    await backup(origem, destPath);
    return { ok: true, caminho: destPath };
  } catch (erro) {
    return { ok: false, erro: erro instanceof Error ? erro.message : String(erro) };
  } finally {
    origem?.close();
  }
}

/** Mantém só os N backups automáticos mais recentes (backups manuais, com outros prefixos, nunca são tocados). */
export function limparBackupsAutomaticosAntigos(): void {
  try {
    if (!fs.existsSync(BACKUPS_DIR)) return;
    const pastasAuto = fs
      .readdirSync(BACKUPS_DIR, { withFileTypes: true })
      .filter((e) => e.isDirectory() && e.name.startsWith("auto-"))
      .map((e) => e.name)
      .sort(); // nomes começam com carimbo ISO-like → ordem alfabética = ordem cronológica

    const excedentes = pastasAuto.length - LIMITE_BACKUPS_AUTOMATICOS;
    if (excedentes <= 0) return;

    for (const nome of pastasAuto.slice(0, excedentes)) {
      fs.rmSync(path.join(BACKUPS_DIR, nome), { recursive: true, force: true });
    }
  } catch {
    // Limpeza é conveniência, não pode derrubar o backup em si.
  }
}

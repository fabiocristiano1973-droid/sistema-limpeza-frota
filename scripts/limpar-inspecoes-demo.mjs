// Remove SOMENTE as inspeções de demonstração criadas por
// scripts/seed-inspecoes-demo.mjs, usando a lista exata de IDs gravada em
// scripts/demo-inspecoes-ids.json. Nunca apaga a tabela inteira nem
// inspeções reais registradas depois da demonstração. Faz backup antes.
//
// USO: node scripts/limpar-inspecoes-demo.mjs
import { DatabaseSync, backup } from "node:sqlite";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";

const DATA_DIR =
  process.env.SLF_DATA_DIR ||
  path.join(process.env.LOCALAPPDATA || os.homedir(), "SistemaLimpezaFrota");
const DB_PATH = path.join(DATA_DIR, "sistema-limpeza-frota.db");

const REGISTRO_PATH = path.join(
  "C:\\Users\\Rota\\OneDrive\\Meus Documentos Pessoais\\Sistema_Limpeza_Frota",
  "scripts",
  "demo-inspecoes-ids.json"
);

if (!fs.existsSync(REGISTRO_PATH)) {
  throw new Error(`Arquivo de registro não encontrado: ${REGISTRO_PATH}. Nada a limpar (ou já foi limpo).`);
}
const registro = JSON.parse(fs.readFileSync(REGISTRO_PATH, "utf-8"));
const ids = registro.ids;
if (!Array.isArray(ids) || ids.length === 0) {
  throw new Error("Registro de IDs vazio ou inválido — abortando.");
}

// --- 1. Backup ---------------------------------------------------------
const carimbo = new Date().toISOString().replace(/[:.]/g, "-");
const BACKUP_DIR = path.join(
  "C:\\Users\\Rota\\OneDrive\\Meus Documentos Pessoais\\Sistema_Limpeza_Frota\\backups",
  `sqlite-pre-limpar-demo-${carimbo}`
);
fs.mkdirSync(BACKUP_DIR, { recursive: true });
const BACKUP_DB_PATH = path.join(BACKUP_DIR, "sistema-limpeza-frota.db");

const origemBackup = new DatabaseSync(DB_PATH, { readOnly: true });
const paginasCopiadas = await backup(origemBackup, BACKUP_DB_PATH);
origemBackup.close();
console.log(`Backup criado em: ${BACKUP_DB_PATH} (${paginasCopiadas} páginas).`);

// --- 2. Remoção transacional, restrita aos IDs registrados ---------------
const db = new DatabaseSync(DB_PATH);
const totalAntes = db.prepare("SELECT COUNT(*) as n FROM inspecoes").get().n;

db.exec("BEGIN IMMEDIATE");
try {
  const del = db.prepare("DELETE FROM inspecoes WHERE id = ?");
  let removidos = 0;
  for (const id of ids) {
    const resultado = del.run(id);
    removidos += resultado.changes;
  }

  const totalDepois = db.prepare("SELECT COUNT(*) as n FROM inspecoes").get().n;
  if (totalDepois !== totalAntes - removidos) {
    throw new Error(`Contagem inconsistente após remoção (antes=${totalAntes}, removidos=${removidos}, depois=${totalDepois}). Revertendo.`);
  }

  db.exec("COMMIT");
  console.log(`Confirmado: ${removidos} de ${ids.length} inspeção(ões) de demonstração removida(s). Total: ${totalAntes} → ${totalDepois}.`);
  if (removidos < ids.length) {
    console.log(`Aviso: ${ids.length - removidos} ID(s) do registro não foram encontrados no banco (já removidos antes?).`);
  }
} catch (erro) {
  db.exec("ROLLBACK");
  db.close();
  console.error("Falha ao remover — NENHUMA alteração foi salva:", erro.message);
  process.exit(1);
}
db.close();

fs.unlinkSync(REGISTRO_PATH);
console.log("Registro de IDs removido — dashboard voltou ao estado real (sem dados de demonstração).");

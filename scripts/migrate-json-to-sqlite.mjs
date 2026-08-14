// Migração única: le os JSONs em data/ (dentro do OneDrive) e grava no banco
// SQLite fora do OneDrive (%LOCALAPPDATA%\SistemaLimpezaFrota). Valida
// contagem antes/depois por entidade e aborta se algo não bater.
import { DatabaseSync } from "node:sqlite";
import { readFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import os from "node:os";

const PROJECT_DIR = "C:\\Users\\Rota\\OneDrive\\Meus Documentos Pessoais\\Sistema_Limpeza_Frota";
const JSON_DATA_DIR = path.join(PROJECT_DIR, "data");

const DATA_DIR = process.env.SLF_DATA_DIR || path.join(process.env.LOCALAPPDATA || os.homedir(), "SistemaLimpezaFrota");
mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = path.join(DATA_DIR, "sistema-limpeza-frota.db");

console.log(`JSON de origem: ${JSON_DATA_DIR}`);
console.log(`Banco de destino: ${DB_PATH}`);

const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode = WAL");

const CADASTROS = [
  { file: "garagens.json", table: "garagens" },
  { file: "tipos-limpeza.json", table: "tipos_limpeza" },
  { file: "veiculos.json", table: "veiculos" },
  { file: "inspetores.json", table: "inspetores" },
  { file: "equipes.json", table: "equipes" },
  { file: "itens-checklist.json", table: "itens_checklist" },
];

let algumErro = false;

for (const { file, table } of CADASTROS) {
  const filePath = path.join(JSON_DATA_DIR, file);
  if (!existsSync(filePath)) {
    console.log(`[${table}] arquivo ${file} não existe, pulando.`);
    continue;
  }
  const registros = JSON.parse(readFileSync(filePath, "utf-8"));

  db.exec(`
    CREATE TABLE IF NOT EXISTS ${table} (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      criado_em TEXT NOT NULL,
      atualizado_em TEXT NOT NULL,
      data TEXT NOT NULL
    )
  `);

  const existentes = db.prepare(`SELECT COUNT(*) as c FROM ${table}`).get().c;
  if (existentes > 0) {
    console.log(`[${table}] tabela já tem ${existentes} registro(s) — pulando (migração já executada?).`);
    continue;
  }

  const insert = db.prepare(
    `INSERT INTO ${table} (id, status, criado_em, atualizado_em, data) VALUES (?, ?, ?, ?, ?)`
  );

  db.exec("BEGIN");
  try {
    for (const r of registros) {
      insert.run(r.id, r.status, r.criadoEm, r.atualizadoEm, JSON.stringify(r));
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    console.error(`[${table}] ERRO ao migrar: ${err.message}`);
    algumErro = true;
    continue;
  }

  const depois = db.prepare(`SELECT COUNT(*) as c FROM ${table}`).get().c;
  const status = depois === registros.length ? "OK" : "DIVERGENTE!";
  console.log(`[${table}] JSON=${registros.length} -> SQLite=${depois} [${status}]`);
  if (depois !== registros.length) algumErro = true;
}

// Inspeções (schema diferente: sem seed, id + criado_em + data)
const inspFile = path.join(JSON_DATA_DIR, "inspections.json");
if (existsSync(inspFile)) {
  const inspecoes = JSON.parse(readFileSync(inspFile, "utf-8"));
  db.exec(`
    CREATE TABLE IF NOT EXISTS inspecoes (
      id TEXT PRIMARY KEY,
      criado_em TEXT NOT NULL,
      data TEXT NOT NULL
    )
  `);
  const existentes = db.prepare(`SELECT COUNT(*) as c FROM inspecoes`).get().c;
  if (existentes > 0) {
    console.log(`[inspecoes] tabela já tem ${existentes} registro(s) — pulando.`);
  } else {
    const insert = db.prepare(`INSERT INTO inspecoes (id, criado_em, data) VALUES (?, ?, ?)`);
    db.exec("BEGIN");
    try {
      for (const i of inspecoes) {
        insert.run(i.id, i.criadoEm, JSON.stringify(i));
      }
      db.exec("COMMIT");
    } catch (err) {
      db.exec("ROLLBACK");
      console.error(`[inspecoes] ERRO ao migrar: ${err.message}`);
      algumErro = true;
    }
    const depois = db.prepare(`SELECT COUNT(*) as c FROM inspecoes`).get().c;
    const status = depois === inspecoes.length ? "OK" : "DIVERGENTE!";
    console.log(`[inspecoes] JSON=${inspecoes.length} -> SQLite=${depois} [${status}]`);
    if (depois !== inspecoes.length) algumErro = true;
  }
}

db.close();

if (algumErro) {
  console.error("\nMIGRAÇÃO CONCLUÍDA COM DIVERGÊNCIAS — verifique os logs acima.");
  process.exit(1);
} else {
  console.log("\nMIGRAÇÃO CONCLUÍDA — todas as contagens conferem.");
}

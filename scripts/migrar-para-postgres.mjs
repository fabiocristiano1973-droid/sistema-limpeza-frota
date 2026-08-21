// Migração única: lê o SQLite local (%LOCALAPPDATA%\SistemaLimpezaFrota) e
// grava no Postgres (Supabase) apontado por DATABASE_URL. Idempotente: se uma
// tabela já tem linhas no destino, pula (não sobrescreve, não duplica) —
// pode rodar de novo com segurança se travar no meio.
//
// Backup do SQLite de origem SEMPRE primeiro, antes de qualquer leitura, para
// nunca depender só do arquivo em uso.
//
// Uso (PowerShell, no computador onde o SQLite atual vive):
//   $env:DATABASE_URL = "postgresql://postgres:SENHA@db.xxxx.supabase.co:5432/postgres"
//   node scripts/migrar-para-postgres.mjs
//
// Use a connection string DIRETA (porta 5432), não a do pooler (6543) —
// este script é um processo único de vida curta, não uma função serverless,
// então não precisa do pgbouncer e evita qualquer questão de prepared
// statements com transaction pooling.
import { DatabaseSync } from "node:sqlite";
import { cpSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("ERRO: defina DATABASE_URL antes de rodar este script (ver comentário no topo do arquivo).");
  process.exit(1);
}

const DATA_DIR = process.env.SLF_DATA_DIR || path.join(process.env.LOCALAPPDATA || os.homedir(), "SistemaLimpezaFrota");
const DB_PATH = path.join(DATA_DIR, "sistema-limpeza-frota.db");

if (!existsSync(DB_PATH)) {
  console.error(`ERRO: banco SQLite não encontrado em ${DB_PATH}.`);
  process.exit(1);
}

// --- 1. Backup do SQLite de origem, antes de tocar em qualquer coisa ---
const carimbo = new Date().toISOString().replace(/[:.]/g, "-");
const backupDir = path.join(process.cwd(), "backups", `pre-migracao-postgres-${carimbo}`);
mkdirSync(backupDir, { recursive: true });
for (const sufixo of ["", "-wal", "-shm"]) {
  const origem = DB_PATH + sufixo;
  if (existsSync(origem)) {
    cpSync(origem, path.join(backupDir, path.basename(DB_PATH) + sufixo));
  }
}
console.log(`Backup do SQLite de origem salvo em: ${backupDir}`);

// --- 2. Conexões ---
const sqlite = new DatabaseSync(DB_PATH, { readOnly: true });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const CADASTROS = ["garagens", "tipos_limpeza", "veiculos", "inspetores", "equipes", "itens_checklist", "usuarios"];

let algumErro = false;

for (const table of CADASTROS) {
  const linhas = sqlite.prepare(`SELECT id, status, criado_em, atualizado_em, data FROM ${table}`).all();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${table} (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      criado_em TEXT NOT NULL,
      atualizado_em TEXT NOT NULL,
      data JSONB NOT NULL
    )
  `);

  const { rows: existentesRows } = await pool.query(`SELECT COUNT(*)::int as c FROM ${table}`);
  if (existentesRows[0].c > 0) {
    console.log(`[${table}] destino já tem ${existentesRows[0].c} registro(s) — pulando (migração já rodou?).`);
    continue;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const linha of linhas) {
      await client.query(
        `INSERT INTO ${table} (id, status, criado_em, atualizado_em, data) VALUES ($1, $2, $3, $4, $5)`,
        [linha.id, linha.status, linha.criado_em, linha.atualizado_em, linha.data]
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(`[${table}] ERRO ao migrar: ${err.message}`);
    algumErro = true;
    client.release();
    continue;
  }
  client.release();

  const { rows: depoisRows } = await pool.query(`SELECT COUNT(*)::int as c FROM ${table}`);
  const status = depoisRows[0].c === linhas.length ? "OK" : "DIVERGENTE!";
  console.log(`[${table}] SQLite=${linhas.length} -> Postgres=${depoisRows[0].c} [${status}]`);
  if (depoisRows[0].c !== linhas.length) algumErro = true;
}

// Inspeções: schema diferente (sem status/seed) — id + criado_em + data.
{
  const linhas = sqlite.prepare(`SELECT id, criado_em, data FROM inspecoes`).all();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS inspecoes (
      id TEXT PRIMARY KEY,
      criado_em TEXT NOT NULL,
      data JSONB NOT NULL
    )
  `);

  const { rows: existentesRows } = await pool.query(`SELECT COUNT(*)::int as c FROM inspecoes`);
  if (existentesRows[0].c > 0) {
    console.log(`[inspecoes] destino já tem ${existentesRows[0].c} registro(s) — pulando.`);
  } else {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const linha of linhas) {
        await client.query(`INSERT INTO inspecoes (id, criado_em, data) VALUES ($1, $2, $3)`, [
          linha.id,
          linha.criado_em,
          linha.data,
        ]);
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(`[inspecoes] ERRO ao migrar: ${err.message}`);
      algumErro = true;
      client.release();
    }
    if (!algumErro) {
      client.release();
      const { rows: depoisRows } = await pool.query(`SELECT COUNT(*)::int as c FROM inspecoes`);
      const status = depoisRows[0].c === linhas.length ? "OK" : "DIVERGENTE!";
      console.log(`[inspecoes] SQLite=${linhas.length} -> Postgres=${depoisRows[0].c} [${status}]`);
      if (depoisRows[0].c !== linhas.length) algumErro = true;
    }
  }
}

sqlite.close();
await pool.end();

if (algumErro) {
  console.error("\nMIGRAÇÃO CONCLUÍDA COM DIVERGÊNCIAS — verifique os logs acima antes de apontar o app para o Postgres.");
  process.exit(1);
} else {
  console.log("\nMIGRAÇÃO CONCLUÍDA — todas as contagens conferem. Backup do SQLite original preservado em backups/.");
}

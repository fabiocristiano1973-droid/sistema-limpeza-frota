// Variante de migrar-para-postgres.mjs que lê de um dump JSON já exportado
// (backups/dump-para-migracao/export-sqlite.json) em vez de abrir o SQLite
// local diretamente — usada quando o terminal que roda este script não
// enxerga a mesma pasta %LOCALAPPDATA% que gerou o dump (ambientes
// diferentes, mesma pasta de projeto sincronizada por OneDrive).
//
// Uso (PowerShell):
//   $env:DATABASE_URL = (Get-Content .env.local | Select-String "DATABASE_URL=").ToString().Split("=",2)[1]
//   node scripts/migrar-dump-para-postgres.mjs
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("ERRO: defina DATABASE_URL antes de rodar este script.");
  process.exit(1);
}

const DUMP_PATH = path.join(process.cwd(), "backups", "dump-para-migracao", "export-sqlite.json");
if (!existsSync(DUMP_PATH)) {
  console.error(`ERRO: dump não encontrado em ${DUMP_PATH}.`);
  process.exit(1);
}

const dump = JSON.parse(readFileSync(DUMP_PATH, "utf-8"));
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

let algumErro = false;

for (const table of Object.keys(dump.cadastros)) {
  const linhas = dump.cadastros[table];

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
  console.log(`[${table}] Dump=${linhas.length} -> Postgres=${depoisRows[0].c} [${status}]`);
  if (depoisRows[0].c !== linhas.length) algumErro = true;
}

{
  const linhas = dump.inspecoes;

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
  } else if (linhas.length > 0) {
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
      console.log(`[inspecoes] Dump=${linhas.length} -> Postgres=${depoisRows[0].c} [${status}]`);
      if (depoisRows[0].c !== linhas.length) algumErro = true;
    }
  } else {
    console.log("[inspecoes] dump não tem nenhuma linha — nada a migrar.");
  }
}

await pool.end();

if (algumErro) {
  console.error("\nMIGRAÇÃO CONCLUÍDA COM DIVERGÊNCIAS — verifique os logs acima.");
  process.exit(1);
} else {
  console.log("\nMIGRAÇÃO CONCLUÍDA — todas as contagens conferem.");
}

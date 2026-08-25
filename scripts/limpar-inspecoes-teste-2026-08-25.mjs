// Script de uso unico: apaga as 4 inspecoes de teste (registradas como
// "Administrador", 21-24/08/2026) do banco de producao, autorizado pelo
// Fabio em conversa em 25/08/2026. Faz backup de tudo antes de apagar.
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import pg from "pg";

const { Pool } = pg;

const envLine = readFileSync(".env.local", "utf-8").trim();
const connectionString = envLine.split("=").slice(1).join("=");
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

const IDS_TESTE = [
  "5d9033f5-4c58-44bb-b955-8c8db33a66d9",
  "6baf2203-9377-4a11-8dba-6f18fd06b82b",
  "da271061-41f4-4404-b0d9-53a28fd1c3f5",
  "96c7ac84-44e9-4cf7-bcc2-7ce98997db56",
];

const antes = await pool.query("SELECT * FROM inspecoes ORDER BY criado_em DESC");
const carimbo = new Date().toISOString().replace(/[:.]/g, "-");
const destDir = path.join("backups", `pre-limpeza-testes-producao-${carimbo}`);
mkdirSync(destDir, { recursive: true });
writeFileSync(path.join(destDir, "inspecoes.json"), JSON.stringify(antes.rows, null, 2));
console.log(`Backup salvo em: ${destDir} (${antes.rows.length} linha(s))`);

const del = await pool.query("DELETE FROM inspecoes WHERE id = ANY($1::text[])", [IDS_TESTE]);
console.log(`Linhas apagadas: ${del.rowCount}`);

const depois = await pool.query("SELECT COUNT(*)::int as c FROM inspecoes");
console.log(`Total de inspeções restantes: ${depois.rows[0].c}`);

await pool.end();

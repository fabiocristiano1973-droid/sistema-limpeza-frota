import { Pool } from "pg";

let instance: Pool | null = null;

/**
 * Pool de conexões Postgres (Supabase). Usa a connection string do modo
 * "pooler" (porta 6543, pgbouncer transaction mode) que o Supabase
 * disponibiliza em Project Settings > Database — necessário porque o Vercel
 * roda funções serverless (muitas conexões curtas), não um processo único
 * como o `next start` local.
 *
 * `max` baixo de propósito: cada instância serverless abre seu próprio pool,
 * então um `max` alto multiplicado pelo número de instâncias simultâneas
 * pode estourar o limite de conexões do pooler. Reavaliar quando o volume
 * real de uso em produção for conhecido.
 */
export function getPool(): Pool {
  if (instance) return instance;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL não configurada — getPool() não deveria ser chamado sem ela.");
  }

  instance = new Pool({
    connectionString,
    max: 5,
    ssl: { rejectUnauthorized: false },
  });
  return instance;
}

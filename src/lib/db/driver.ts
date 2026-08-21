/**
 * Ponto único de decisão: qual banco está ativo. A presença de DATABASE_URL
 * decide — sem essa variável, o app continua rodando 100% em SQLite local,
 * exatamente como hoje (nenhum comportamento muda até essa variável existir).
 * Ver ESTADO_TECNICO.md, seção "Missão em andamento", para o motivo da
 * migração para Postgres/Supabase.
 */
export type DbDriver = "sqlite" | "postgres";

export function getDbDriver(): DbDriver {
  return process.env.DATABASE_URL ? "postgres" : "sqlite";
}

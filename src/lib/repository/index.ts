import { InspectionRepository } from "./types";
import { SqliteInspectionRepository } from "./sqlite-inspection-repository";
import { PostgresInspectionRepository } from "./postgres-inspection-repository";
import { getDbDriver } from "@/lib/db/driver";

let instance: InspectionRepository | null = null;

// Ponto único de troca de storage — decidido por getDbDriver() (presença de
// DATABASE_URL). Sem essa variável, continua 100% SQLite local.
export function getRepository(): InspectionRepository {
  if (!instance) {
    instance = getDbDriver() === "postgres" ? new PostgresInspectionRepository() : new SqliteInspectionRepository();
  }
  return instance;
}

export type { InspectionRepository } from "./types";

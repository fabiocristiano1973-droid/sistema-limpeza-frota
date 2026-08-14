import { InspectionRepository } from "./types";
import { SqliteInspectionRepository } from "./sqlite-inspection-repository";

let instance: InspectionRepository | null = null;

// Ponto único de troca de storage. Para migrar para Supabase/PostgreSQL,
// implemente `InspectionRepository` (types.ts) com um client Supabase e
// retorne essa instância aqui.
export function getRepository(): InspectionRepository {
  if (!instance) {
    instance = new SqliteInspectionRepository();
  }
  return instance;
}

export type { InspectionRepository } from "./types";

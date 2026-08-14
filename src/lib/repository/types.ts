import { Inspecao, InspectionFilter } from "@/types/inspection";

/**
 * Contrato de persistência. A implementação atual grava em arquivo JSON local
 * (ver json-file-repository.ts). Para migrar para Supabase/PostgreSQL no futuro,
 * basta criar uma nova classe que implemente esta interface e trocar o retorno
 * de getRepository() em index.ts — nenhum código de página/API precisa mudar.
 */
export interface InspectionRepository {
  create(inspecao: Inspecao): Promise<Inspecao>;
  list(filter?: InspectionFilter): Promise<Inspecao[]>;
  getById(id: string): Promise<Inspecao | null>;
}

import path from "path";
import os from "os";

/**
 * Diretório de dados em produção e em desenvolvimento (mesmo caminho nos
 * dois casos, para não haver divergência entre `npm run dev` e o serviço
 * de produção). Fica fora da pasta do projeto (que está sincronizada pelo
 * OneDrive) para evitar locks de sincronização durante gravações.
 * Pode ser sobrescrito via variável de ambiente SLF_DATA_DIR (útil para testes).
 */
export function getDataDir(): string {
  if (process.env.SLF_DATA_DIR) return process.env.SLF_DATA_DIR;
  const base = process.env.LOCALAPPDATA || os.homedir();
  return path.join(base, "SistemaLimpezaFrota");
}

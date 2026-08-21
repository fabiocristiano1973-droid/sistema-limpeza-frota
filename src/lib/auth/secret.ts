import { randomBytes } from "crypto";
import fs from "fs";
import path from "path";
import { getDataDir } from "@/lib/data-dir";

let cached: string | null = null;

/**
 * Chave de assinatura da sessão. Em produção na Vercel, vem de SESSION_SECRET
 * (variável de ambiente) -- não daria pra gerar e persistir num arquivo local
 * como no SQLite: não existe disco persistente e compartilhado entre
 * instâncias serverless, então cada instância geraria uma chave diferente e
 * sessões assinadas numa instância falhariam ao serem lidas por outra
 * (logout aleatório). Localmente (sem essa variável), continua gerando e
 * persistindo um arquivo fora do OneDrive, como sempre.
 */
export function getSessionSecret(): string {
  if (cached) return cached;

  if (process.env.SESSION_SECRET) {
    cached = process.env.SESSION_SECRET;
    return cached;
  }

  const dir = getDataDir();
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "session-secret.key");

  if (fs.existsSync(file)) {
    cached = fs.readFileSync(file, "utf-8").trim();
  } else {
    cached = randomBytes(32).toString("hex");
    fs.writeFileSync(file, cached, "utf-8");
  }
  return cached;
}

import { randomBytes } from "crypto";
import fs from "fs";
import path from "path";
import { getDataDir } from "@/lib/data-dir";

let cached: string | null = null;

/** Chave de assinatura da sessão, gerada uma vez e persistida fora do OneDrive. */
export function getSessionSecret(): string {
  if (cached) return cached;

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

import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

export function hashPassword(senha: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(senha, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(senha: string, armazenado: string): boolean {
  const [salt, hashHex] = armazenado.split(":");
  if (!salt || !hashHex) return false;
  const hashTentativa = scryptSync(senha, salt, 64);
  const hashArmazenado = Buffer.from(hashHex, "hex");
  if (hashTentativa.length !== hashArmazenado.length) return false;
  return timingSafeEqual(hashTentativa, hashArmazenado);
}

export function gerarSenhaTemporaria(): string {
  return randomBytes(9).toString("base64url");
}

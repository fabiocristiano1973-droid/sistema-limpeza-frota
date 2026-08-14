// Cria o primeiro usuário ADMIN (bootstrap). Roda uma vez; se já existir
// algum usuário ADMIN ativo, não faz nada. A senha temporária gerada é
// impressa APENAS no console — não é salva em nenhum arquivo em texto puro.
import { DatabaseSync } from "node:sqlite";
import { randomUUID, randomBytes, scryptSync } from "node:crypto";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";

const DATA_DIR = process.env.SLF_DATA_DIR || path.join(process.env.LOCALAPPDATA || os.homedir(), "SistemaLimpezaFrota");
fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = path.join(DATA_DIR, "sistema-limpeza-frota.db");

const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    criado_em TEXT NOT NULL,
    atualizado_em TEXT NOT NULL,
    data TEXT NOT NULL
  )
`);

function hashPassword(senha) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(senha, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const existentes = db.prepare("SELECT data FROM usuarios").all().map((r) => JSON.parse(r.data));
const jaTemAdmin = existentes.some((u) => u.perfil === "ADMIN" && u.status === "ATIVO");

if (jaTemAdmin) {
  console.log("Já existe um usuário ADMIN ativo — nada a fazer.");
  db.close();
  process.exit(0);
}

const login = process.env.SLF_ADMIN_LOGIN || "admin";
const senha = randomBytes(9).toString("base64url");
const agora = new Date().toISOString();

const usuario = {
  id: randomUUID(),
  nome: "Administrador",
  login,
  senhaHash: hashPassword(senha),
  perfil: "ADMIN",
  deveTrocarSenha: true,
  status: "ATIVO",
  criadoEm: agora,
  atualizadoEm: agora,
};

db.prepare("INSERT INTO usuarios (id, status, criado_em, atualizado_em, data) VALUES (?, ?, ?, ?, ?)").run(
  usuario.id,
  usuario.status,
  usuario.criadoEm,
  usuario.atualizadoEm,
  JSON.stringify(usuario)
);

db.close();

console.log("Usuário ADMIN criado com sucesso.");
console.log(`Login: ${login}`);
console.log(`Senha temporária: ${senha}`);
console.log("(anote agora — não será exibida novamente; recomenda-se trocar no primeiro acesso)");

// Redefine a senha do usuário ADMIN já identificado (login "admin"), gerando
// uma senha temporária aleatória e forçando troca no próximo login.
// Nunca imprime o hash (nem o antigo, nem o novo) — só a senha temporária em
// texto puro, uma única vez, e somente depois de confirmar a atualização.
//
// USO: node scripts/reset-admin-password.mjs
// Alvo fixo (não recebe login por argumento, para eliminar risco de alterar
// o usuário errado): id conferido antes por consulta somente-leitura.
import { DatabaseSync, backup } from "node:sqlite";
import { randomBytes, scryptSync } from "node:crypto";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";

// --- Localização do banco -------------------------------------------------
// Mesma lógica usada em toda a aplicação e nos demais scripts do projeto:
// fora do OneDrive, em %LOCALAPPDATA%, para evitar os erros EPERM de
// sincronização que motivaram essa migração (Objetivo 3 da missão).
const DATA_DIR =
  process.env.SLF_DATA_DIR ||
  path.join(process.env.LOCALAPPDATA || os.homedir(), "SistemaLimpezaFrota");
const DB_PATH = path.join(DATA_DIR, "sistema-limpeza-frota.db");

// Login e id do usuário ADMIN já identificados numa consulta somente-leitura
// anterior (PRAGMA table_info + SELECT com hash mascarado). Fixos de
// propósito: este script nunca decide "qual usuário" a partir de um
// argumento externo, o que eliminaria a garantia de alterar só o admin
// certo.
const LOGIN_ALVO = "admin";
const ID_ALVO = "e14b5d53-3bd9-4ec2-b0e0-3bd4ca714207";

// --- 1. Backup do banco ANTES de qualquer escrita -------------------------
// O banco está em modo WAL e o servidor de produção (watchdog + next start)
// continua rodando durante este script — ou seja, pode haver escrita
// concorrente a qualquer instante. Uma cópia bruta de arquivo
// (fs.copyFileSync de .db/.db-wal/.db-shm) NÃO é segura nesse cenário: se o
// SQLite fizer um checkpoint do WAL para o .db principal exatamente entre a
// cópia de um arquivo e outra, o conjunto copiado fica inconsistente.
//
// Por isso usamos a API oficial de Backup Online do SQLite
// (sqlite3_backup_init/step/finish), exposta pelo node:sqlite como a função
// `backup()`. Ela lê o banco de origem no nível de páginas do próprio motor
// SQLite — o mesmo mecanismo do comando `.backup` do sqlite3 CLI — e
// garante uma cópia consistente mesmo com o banco em uso, sem travar nem
// interromper o servidor em produção. Testado isoladamente antes de entrar
// neste script (backup de teste em arquivo descartável, íntegro e legível).
const carimbo = new Date().toISOString().replace(/[:.]/g, "-");
const BACKUP_DIR = path.join(
  "C:\\Users\\Rota\\OneDrive\\Meus Documentos Pessoais\\Sistema_Limpeza_Frota\\backups",
  `sqlite-pre-reset-admin-${carimbo}`
);
fs.mkdirSync(BACKUP_DIR, { recursive: true });
const BACKUP_DB_PATH = path.join(BACKUP_DIR, "sistema-limpeza-frota.db");

// Conexão de ORIGEM aberta em modo somente-leitura: garante que este script
// não pode, nem por engano, escrever no banco de produção durante o backup.
const origemBackup = new DatabaseSync(DB_PATH, { readOnly: true });
const paginasCopiadas = await backup(origemBackup, BACKUP_DB_PATH);
origemBackup.close();

// Verificação de integridade do backup: reabre o arquivo copiado (somente
// leitura) e confirma que dá para consultar a tabela usuarios antes de
// prosseguir. Se o backup não for válido, aborta sem alterar o banco real.
const verificacaoBackup = new DatabaseSync(BACKUP_DB_PATH, { readOnly: true });
const totalUsuariosBackup = verificacaoBackup.prepare("SELECT COUNT(*) as n FROM usuarios").get().n;
verificacaoBackup.close();
if (totalUsuariosBackup < 1) {
  throw new Error("Backup gerado parece inválido (tabela usuarios vazia) — abortando antes de alterar o banco real.");
}

console.log(`Backup consistente criado em: ${BACKUP_DB_PATH} (${paginasCopiadas} páginas, ${totalUsuariosBackup} usuário(s) confirmados).`);

// --- 2. Mesma função de hash usada pelo sistema (scrypt) ------------------
// Réplica intencional de src/lib/auth/password.ts:hashPassword — mesmo
// algoritmo (scrypt), mesmo tamanho de salt (16 bytes) e derivação (64
// bytes), mesmo formato de saída "salt:hashHex" que
// src/lib/auth/password.ts:verifyPassword espera ao validar o login no
// endpoint /api/auth/login. Réplica em vez de import direto porque este é
// um script .mjs standalone fora do pipeline de build do Next/TypeScript —
// mesmo padrão já usado em scripts/create-admin-user.mjs.
function hashPassword(senha) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(senha, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

// --- 3. Gera a senha temporária (mínimo 20 caracteres) --------------------
// 16 bytes aleatórios criptograficamente seguros (crypto.randomBytes),
// codificados em base64url (sem +, / ou = — mais fácil de digitar/ditar),
// resultando em ~22 caracteres. A verificação abaixo é uma trava extra
// contra qualquer mudança futura no tamanho.
const senhaTemporaria = randomBytes(16).toString("base64url");
if (senhaTemporaria.length < 20) {
  throw new Error("Senha temporária gerada tem menos de 20 caracteres — abortando por segurança.");
}

const novoHash = hashPassword(senhaTemporaria);
const agora = new Date().toISOString();

// --- 4. Atualização transacional, restrita a exatamente 1 usuário ---------
const db = new DatabaseSync(DB_PATH);

db.exec("BEGIN IMMEDIATE"); // trava de escrita imediata: evita corrida com outra escrita concorrente
try {
  // Lê o registro atual completo para preservar todos os campos que NÃO
  // devem mudar (nome, login, perfil, status, criadoEm, id).
  const linha = db
    .prepare("SELECT data FROM usuarios WHERE id = ? AND status = 'ATIVO'")
    .get(ID_ALVO);

  if (!linha) {
    throw new Error(`Usuário ADMIN com id ${ID_ALVO} não encontrado ou inativo — abortando sem alterar nada.`);
  }

  const usuario = JSON.parse(linha.data);

  // Confirma, por segurança extra, que o login bate com o esperado antes de
  // escrever qualquer coisa no banco.
  if (usuario.login !== LOGIN_ALVO) {
    throw new Error(
      `Login do registro (${usuario.login}) não confere com o esperado (${LOGIN_ALVO}) — abortando.`
    );
  }

  // Altera SOMENTE os três campos autorizados. Todos os demais campos
  // (id, login, nome, perfil, status, criadoEm) continuam exatamente como
  // estavam, porque partimos de uma cópia do registro já existente.
  usuario.senhaHash = novoHash;
  usuario.deveTrocarSenha = true; // obrigatório: força troca no próximo login
  usuario.atualizadoEm = agora;

  const resultado = db
    .prepare("UPDATE usuarios SET data = ?, atualizado_em = ? WHERE id = ? AND status = 'ATIVO'")
    .run(JSON.stringify(usuario), agora, ID_ALVO);

  // Trava de segurança: só confirma se EXATAMENTE 1 linha foi afetada.
  // Qualquer outro número (0 ou mais de 1) desfaz tudo.
  if (resultado.changes !== 1) {
    throw new Error(
      `Esperado exatamente 1 registro atualizado, mas foram ${resultado.changes}. Revertendo.`
    );
  }

  db.exec("COMMIT");
  console.log(
    `Confirmado: ${resultado.changes} registro atualizado (login "${LOGIN_ALVO}", id ${ID_ALVO}).`
  );
} catch (erro) {
  db.exec("ROLLBACK");
  db.close();
  console.error("Falha na atualização — NENHUMA alteração foi salva:", erro.message);
  process.exit(1);
}

db.close();

// --- 5. Só imprime a senha temporária DEPOIS de confirmar a atualização ---
// Nunca imprime o hash (nem o antigo, nem o novo) — apenas a senha em texto
// puro, uma única vez, para uso imediato no teste de login.
console.log("");
console.log("=== SENHA TEMPORÁRIA DO ADMIN (anote agora — não será exibida de novo) ===");
console.log(`Login: ${LOGIN_ALVO}`);
console.log(`Senha temporária: ${senhaTemporaria}`);
console.log('O sistema exigirá troca de senha no primeiro login (deveTrocarSenha = true).');

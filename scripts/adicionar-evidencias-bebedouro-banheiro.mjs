// Fase 4: adiciona os novos itens de evidência obrigatória às etapas
// Bebedouro e Banheiro. Só INSERE itens novos — não altera nenhum dos itens
// já existentes nem qualquer inspeção já finalizada (o snapshot delas é
// imutável por design, ver src/lib/checklist-catalog.ts).
//
// USO: node scripts/adicionar-evidencias-bebedouro-banheiro.mjs
import { DatabaseSync, backup } from "node:sqlite";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";

const DATA_DIR =
  process.env.SLF_DATA_DIR ||
  path.join(process.env.LOCALAPPDATA || os.homedir(), "SistemaLimpezaFrota");
const DB_PATH = path.join(DATA_DIR, "sistema-limpeza-frota.db");

// --- 1. Backup ---------------------------------------------------------
const carimbo = new Date().toISOString().replace(/[:.]/g, "-");
const BACKUP_DIR = path.join(
  "C:\\Users\\Rota\\OneDrive\\Meus Documentos Pessoais\\Sistema_Limpeza_Frota\\backups",
  `sqlite-pre-fase4-bebedouro-banheiro-${carimbo}`
);
fs.mkdirSync(BACKUP_DIR, { recursive: true });
const BACKUP_DB_PATH = path.join(BACKUP_DIR, "sistema-limpeza-frota.db");

const origemBackup = new DatabaseSync(DB_PATH, { readOnly: true });
const paginasCopiadas = await backup(origemBackup, BACKUP_DB_PATH);
origemBackup.close();
console.log(`Backup criado em: ${BACKUP_DB_PATH} (${paginasCopiadas} páginas).`);

// --- 2. Itens novos -------------------------------------------------------
const TODOS = "TODOS";
const NORMAL = "NORMAL";
const CRITICO = "CRITICO";
const agora = new Date().toISOString();

const NOVOS = [
  // Bebedouro — ordem 700-730 já ocupada pelos 4 itens existentes.
  {
    id: "bebedouro-foto-estado",
    categoria: "bebedouro",
    nome: "Estado de limpeza do bebedouro",
    ordem: 740,
    exigeFoto: true,
    criticidadePadrao: NORMAL,
  },
  {
    id: "bebedouro-foto-amostra",
    categoria: "bebedouro",
    nome: "Amostra da água coletada",
    ordem: 750,
    exigeFoto: true,
    criticidadePadrao: NORMAL,
  },
  {
    id: "bebedouro-aparencia-agua",
    categoria: "bebedouro",
    nome: "Aparência da água",
    ordem: 760,
    tipoResposta: "SELECAO",
    opcoesSelecao: [
      "Normal / límpida",
      "Turva",
      "Presença de partículas ou resíduos",
      "Coloração anormal",
      "Outro aspecto anormal",
    ],
    opcaoConforme: "Normal / límpida",
    criticidadePadrao: CRITICO,
  },
  // Banheiro — ordem 800-840 já ocupada pelos 5 itens existentes.
  {
    id: "banheiro-foto-reservatorio",
    categoria: "banheiro",
    nome: "Água disponível no reservatório do banheiro",
    ordem: 850,
    exigeFoto: true,
    criticidadePadrao: CRITICO,
  },
  {
    id: "banheiro-foto-descarga",
    categoria: "banheiro",
    nome: "Descarga funcionando",
    ordem: 860,
    exigeFoto: true,
    criticidadePadrao: CRITICO,
  },
  {
    id: "banheiro-foto-guilhotina-porta",
    categoria: "banheiro",
    nome: "Guilhotina (trava da porta) abrindo",
    ordem: 870,
    exigeFoto: true,
    criticidadePadrao: CRITICO,
  },
  {
    id: "banheiro-foto-guilhotina-descarga",
    categoria: "banheiro",
    nome: "Guilhotina da descarga abrindo e fechando",
    ordem: 880,
    exigeFoto: true,
    criticidadePadrao: CRITICO,
  },
].map((item) => ({
  ...item,
  status: "ATIVO",
  aplicacaoTipo: TODOS,
  tipoResposta: item.tipoResposta ?? "PADRAO",
  criadoEm: agora,
  atualizadoEm: agora,
}));

// --- 3. Escrita transacional -----------------------------------------------
const db = new DatabaseSync(DB_PATH);
const totalAntes = db.prepare("SELECT COUNT(*) as n FROM itens_checklist").get().n;

db.exec("BEGIN IMMEDIATE");
try {
  const getStmt = db.prepare("SELECT data FROM itens_checklist WHERE id = ?");
  const insertStmt = db.prepare(
    "INSERT INTO itens_checklist (id, status, criado_em, atualizado_em, data) VALUES (?, ?, ?, ?, ?)"
  );

  for (const novo of NOVOS) {
    const existente = getStmt.get(novo.id);
    if (existente) throw new Error(`Item "${novo.id}" já existe — abortando para não sobrescrever.`);
    insertStmt.run(novo.id, novo.status, novo.criadoEm, novo.atualizadoEm, JSON.stringify(novo));
  }

  const totalDepois = db.prepare("SELECT COUNT(*) as n FROM itens_checklist").get().n;
  const esperado = totalAntes + NOVOS.length;
  if (totalDepois !== esperado) {
    throw new Error(`Esperado ${esperado} itens após a migração, mas há ${totalDepois}. Revertendo.`);
  }

  db.exec("COMMIT");
  console.log(`Confirmado: ${NOVOS.length} item(ns) novo(s) inserido(s). Total: ${totalAntes} → ${totalDepois}.`);
} catch (erro) {
  db.exec("ROLLBACK");
  db.close();
  console.error("Falha na migração — NENHUMA alteração foi salva:", erro.message);
  process.exit(1);
}
db.close();

console.log("\nItens adicionados:");
for (const n of NOVOS) {
  console.log(`  [${n.categoria}] ordem=${n.ordem}  exigeFoto=${!!n.exigeFoto}  tipoResposta=${n.tipoResposta}  "${n.nome}"`);
}

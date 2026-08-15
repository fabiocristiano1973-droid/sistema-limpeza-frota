// Reorganiza o catálogo de itens do checklist (tabela itens_checklist) para
// seguir o fluxo físico de inspeção definido pela diretoria em 2026-08-14:
//
//   Externo/Bagageiro → Entrada dianteira → Cabine → Acesso ao salão →
//   Salão/Corredor → Bebedouro → Banheiro → (Finalização, etapa fixa do
//   wizard, fora deste catálogo)
//
// O que muda:
//   - Itens de "bagageiro" passam a fazer parte de "externa" (mesma etapa).
//   - O item de "equipamentos" (Mantas presentes, condicional DD) passa a
//     fazer parte de "cabine" (deixa de criar uma etapa própria).
//   - Os 4 itens de bebedouro, hoje dentro de "salao", viram categoria
//     própria "bebedouro".
//   - Duas categorias novas são criadas com os itens ditados pela diretoria:
//     "entrada_dianteira" e "acesso_salao".
//   - Todo o catálogo é renumerado (campo `ordem`) para refletir a nova
//     sequência, com espaçamento de 10 entre itens de uma mesma categoria e
//     de 100+ entre categorias (mesmo padrão usado no seed original).
//
// Nenhum `id` de item existente é alterado — inspeções já realizadas guardam
// um snapshot próprio (categoria/nome no momento em que foram feitas) e não
// são afetadas por esta migração (ver comentário em src/lib/checklist-catalog.ts).
//
// USO: node scripts/reorganizar-fluxo-checklist.mjs
import { DatabaseSync, backup } from "node:sqlite";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";

const DATA_DIR =
  process.env.SLF_DATA_DIR ||
  path.join(process.env.LOCALAPPDATA || os.homedir(), "SistemaLimpezaFrota");
const DB_PATH = path.join(DATA_DIR, "sistema-limpeza-frota.db");

// --- 1. Backup do banco ANTES de qualquer escrita -------------------------
// Mesma técnica de backup online do SQLite usada em
// scripts/reset-admin-password.mjs: segura mesmo com o servidor rodando e
// escrevendo concorrentemente (modo WAL).
const carimbo = new Date().toISOString().replace(/[:.]/g, "-");
const BACKUP_DIR = path.join(
  "C:\\Users\\Rota\\OneDrive\\Meus Documentos Pessoais\\Sistema_Limpeza_Frota\\backups",
  `sqlite-pre-reorganizar-checklist-${carimbo}`
);
fs.mkdirSync(BACKUP_DIR, { recursive: true });
const BACKUP_DB_PATH = path.join(BACKUP_DIR, "sistema-limpeza-frota.db");

const origemBackup = new DatabaseSync(DB_PATH, { readOnly: true });
const paginasCopiadas = await backup(origemBackup, BACKUP_DB_PATH);
origemBackup.close();

const verificacaoBackup = new DatabaseSync(BACKUP_DB_PATH, { readOnly: true });
const totalItensBackup = verificacaoBackup.prepare("SELECT COUNT(*) as n FROM itens_checklist").get().n;
verificacaoBackup.close();
if (totalItensBackup < 1) {
  throw new Error("Backup gerado parece inválido (tabela itens_checklist vazia) — abortando antes de alterar o banco real.");
}
console.log(`Backup consistente criado em: ${BACKUP_DB_PATH} (${paginasCopiadas} páginas, ${totalItensBackup} item(ns) confirmados).`);

// --- 2. Definição das mudanças ---------------------------------------------
const TODOS = "TODOS";
const NORMAL = "NORMAL";

// Itens existentes: só mudam `categoria`/`ordem`. Todos os demais campos do
// registro atual são preservados (nome, aplicacaoTipo, aplicacaoClassificacao,
// criticidadePadrao, status, criadoEm).
const ATUALIZACOES = [
  // Bagageiro entra na etapa "Externo/Bagageiro" (categoria "externa")
  { id: "bag-1", categoria: "externa", ordem: 160 },
  { id: "bag-2", categoria: "externa", ordem: 170 },
  { id: "bag-3", categoria: "externa", ordem: 180 },
  // Cabine renumerada (era 400-440)
  { id: "cab-1", categoria: "cabine", ordem: 300 },
  { id: "cab-2", categoria: "cabine", ordem: 310 },
  { id: "cab-3", categoria: "cabine", ordem: 320 },
  { id: "cab-4", categoria: "cabine", ordem: 330 },
  { id: "cab-5", categoria: "cabine", ordem: 340 },
  // Equipamentos (Mantas, condicional DD) passa a ser item de "cabine"
  { id: "equip-1", categoria: "cabine", ordem: 350 },
  // Salão renumerado (era 200-340), sem os 4 itens de bebedouro
  { id: "sal-1", categoria: "salao", ordem: 500 },
  { id: "sal-2", categoria: "salao", ordem: 510 },
  { id: "sal-3", categoria: "salao", ordem: 520 },
  { id: "sal-4", categoria: "salao", ordem: 530 },
  { id: "sal-5", categoria: "salao", ordem: 540 },
  { id: "sal-6", categoria: "salao", ordem: 550 },
  { id: "sal-7", categoria: "salao", ordem: 560 },
  { id: "sal-8", categoria: "salao", ordem: 570 },
  { id: "sal-9", categoria: "salao", ordem: 580 },
  { id: "sal-10", categoria: "salao", ordem: 590 },
  { id: "sal-11", categoria: "salao", ordem: 600 },
  { id: "sal-12", categoria: "salao", ordem: 610 },
  { id: "sal-13", categoria: "salao", ordem: 620 },
  { id: "sal-14", categoria: "salao", ordem: 630 },
  { id: "sal-15", categoria: "salao", ordem: 640 },
  // Bebedouro sai do Salão e vira categoria própria
  { id: "sal-16", categoria: "bebedouro", ordem: 700 },
  { id: "sal-17", categoria: "bebedouro", ordem: 710 },
  { id: "sal-18", categoria: "bebedouro", ordem: 720 },
  { id: "sal-19", categoria: "bebedouro", ordem: 730 },
  // Banheiro renumerado (era 500-540)
  { id: "ban-1", categoria: "banheiro", ordem: 800 },
  { id: "ban-2", categoria: "banheiro", ordem: 810 },
  { id: "ban-3", categoria: "banheiro", ordem: 820 },
  { id: "ban-4", categoria: "banheiro", ordem: 830 },
  { id: "ban-5", categoria: "banheiro", ordem: 840 },
  // Acabamento renumerado (era 700-720) — permanece como última etapa do
  // catálogo, antes da tela fixa de Finalização do wizard
  { id: "aca-1", categoria: "acabamento", ordem: 900 },
  { id: "aca-2", categoria: "acabamento", ordem: 910 },
  { id: "aca-3", categoria: "acabamento", ordem: 920 },
];

// Itens novos, ditados pela diretoria.
const agora = new Date().toISOString();
const NOVOS = [
  { id: "ent-1", categoria: "entrada_dianteira", nome: "Porta dianteira limpa", ordem: 200 },
  { id: "ent-2", categoria: "entrada_dianteira", nome: "Vidros da porta limpos", ordem: 210 },
  { id: "ent-3", categoria: "entrada_dianteira", nome: "Degraus limpos", ordem: 220 },
  { id: "ent-4", categoria: "entrada_dianteira", nome: "Corrimãos limpos", ordem: 230 },
  { id: "ent-5", categoria: "entrada_dianteira", nome: "Área de entrada limpa e sem resíduos", ordem: 240 },
  { id: "aces-1", categoria: "acesso_salao", nome: "Porta/divisória de acesso limpa", ordem: 400 },
  { id: "aces-2", categoria: "acesso_salao", nome: "Vidros limpos, se houver", ordem: 410 },
  { id: "aces-3", categoria: "acesso_salao", nome: "Área de passagem limpa", ordem: 420 },
  { id: "aces-4", categoria: "acesso_salao", nome: "Corrimãos/apoios limpos", ordem: 430 },
  { id: "aces-5", categoria: "acesso_salao", nome: "Sem resíduos ou obstáculos na passagem", ordem: 440 },
].map((item) => ({
  ...item,
  status: "ATIVO",
  aplicacaoTipo: TODOS,
  criticidadePadrao: NORMAL,
  criadoEm: agora,
  atualizadoEm: agora,
}));

// --- 3. Execução transacional -----------------------------------------------
const db = new DatabaseSync(DB_PATH);
const totalAntes = db.prepare("SELECT COUNT(*) as n FROM itens_checklist").get().n;

db.exec("BEGIN IMMEDIATE");
try {
  const getStmt = db.prepare("SELECT data FROM itens_checklist WHERE id = ?");
  const updateStmt = db.prepare(
    "UPDATE itens_checklist SET atualizado_em = ?, data = ? WHERE id = ?"
  );
  const insertStmt = db.prepare(
    "INSERT INTO itens_checklist (id, status, criado_em, atualizado_em, data) VALUES (?, ?, ?, ?, ?)"
  );

  for (const mudanca of ATUALIZACOES) {
    const linha = getStmt.get(mudanca.id);
    if (!linha) throw new Error(`Item "${mudanca.id}" não encontrado — abortando.`);
    const item = JSON.parse(linha.data);
    item.categoria = mudanca.categoria;
    item.ordem = mudanca.ordem;
    item.atualizadoEm = agora;
    updateStmt.run(agora, JSON.stringify(item), mudanca.id);
  }

  for (const novo of NOVOS) {
    const existente = getStmt.get(novo.id);
    if (existente) throw new Error(`Item novo "${novo.id}" já existe — abortando para não sobrescrever.`);
    insertStmt.run(novo.id, novo.status, novo.criadoEm, novo.atualizadoEm, JSON.stringify(novo));
  }

  const totalDepois = db.prepare("SELECT COUNT(*) as n FROM itens_checklist").get().n;
  const esperado = totalAntes + NOVOS.length;
  if (totalDepois !== esperado) {
    throw new Error(`Esperado ${esperado} itens após a migração, mas há ${totalDepois}. Revertendo.`);
  }

  db.exec("COMMIT");
  console.log(`Confirmado: ${ATUALIZACOES.length} item(ns) atualizado(s), ${NOVOS.length} item(ns) novo(s) inserido(s).`);
  console.log(`Total de itens: ${totalAntes} → ${totalDepois}.`);
} catch (erro) {
  db.exec("ROLLBACK");
  db.close();
  console.error("Falha na migração — NENHUMA alteração foi salva:", erro.message);
  process.exit(1);
}

db.close();

// Popula o banco com inspeções de EXEMPLO, realistas, usando veículos e
// garagens reais já cadastrados — só para o dashboard ter dado pra mostrar
// numa demonstração à diretoria. Não mexe em nenhum cadastro, só insere
// registros novos na tabela `inspecoes`. Faz backup do banco antes.
//
// Regra de negócio (calcularResumo/catalogoAplicavel) replicada aqui em vez
// de importada porque este é um script .mjs standalone fora do pipeline
// TypeScript do Next — mesmo padrão dos demais scripts em scripts/.
//
// USO: node scripts/seed-inspecoes-demo.mjs
import { DatabaseSync, backup } from "node:sqlite";
import { randomUUID } from "node:crypto";
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
  `sqlite-pre-seed-demo-${carimbo}`
);
fs.mkdirSync(BACKUP_DIR, { recursive: true });
const BACKUP_DB_PATH = path.join(BACKUP_DIR, "sistema-limpeza-frota.db");

const origemBackup = new DatabaseSync(DB_PATH, { readOnly: true });
const paginasCopiadas = await backup(origemBackup, BACKUP_DB_PATH);
origemBackup.close();
console.log(`Backup criado em: ${BACKUP_DB_PATH} (${paginasCopiadas} páginas).`);

// --- 2. Leitura dos cadastros reais -------------------------------------
const dbLeitura = new DatabaseSync(DB_PATH, { readOnly: true });
function carregarTabela(tabela) {
  return dbLeitura
    .prepare(`SELECT data FROM ${tabela}`)
    .all()
    .map((r) => JSON.parse(r.data));
}
const veiculos = carregarTabela("veiculos");
const garagens = carregarTabela("garagens");
const tiposLimpeza = carregarTabela("tipos_limpeza");
const inspetores = carregarTabela("inspetores");
const equipes = carregarTabela("equipes");
const itensChecklist = carregarTabela("itens_checklist").filter((i) => i.status === "ATIVO");
const admin = dbLeitura.prepare("SELECT data FROM usuarios WHERE status='ATIVO' LIMIT 1").get();
dbLeitura.close();
const usuarioLogado = JSON.parse(admin.data);

function porId(lista, id) {
  const r = lista.find((x) => x.id === id);
  if (!r) throw new Error(`Registro não encontrado: ${id}`);
  return r;
}
function porPrefixo(prefixo) {
  const r = veiculos.find((v) => v.prefixo === prefixo);
  if (!r) throw new Error(`Veículo com prefixo ${prefixo} não encontrado.`);
  return r;
}

function itemAplicavel(item, veiculo) {
  if (item.aplicacaoTipo === "TODOS") return true;
  if (!veiculo.tipoVeiculo) return false;
  return veiculo.tipoVeiculo.trim().toLowerCase() === (item.aplicacaoClassificacao ?? "").trim().toLowerCase();
}

function calcularResumo(itens) {
  const totalItens = itens.length;
  const conformes = itens.filter((i) => i.status === "CONFORME").length;
  const naoConformes = itens.filter((i) => i.status === "NAO_CONFORME").length;
  const naCount = itens.filter((i) => i.status === "NA").length;
  const ncCriticas = itens.filter((i) => i.status === "NAO_CONFORME" && i.criticidade === "CRITICA").length;
  const avaliaveis = conformes + naoConformes;
  const percentualConformidade = avaliaveis > 0 ? Math.round((conformes / avaliaveis) * 1000) / 10 : 100;
  const resultado = ncCriticas > 0 ? "REPROVADO" : "APROVADO";
  return { totalItens, conformes, naoConformes, naCount, percentualConformidade, ncCriticas, resultado };
}

// --- 3. Cenários de demonstração ----------------------------------------
// Datas escalonadas nas últimas ~3 semanas para a "Evolução por Período"
// mostrar uma tendência de melhora, incluindo uma reincidência real (mesmo
// veículo + mesmo item) identificada e depois corrigida.
const CENARIOS = [
  {
    diasAtras: 18, veiculo: "5115", turno: "Manhã", equipeId: "equ-alfa", inspetorId: "ins-carlos", tipoLimpezaId: "tl-geral",
    naoConformes: [
      { nome: "Piso do bagageiro limpo", criticidade: "NAO_CRITICA", observacao: "Resíduos de terra acumulados no piso do bagageiro." },
      { nome: "Bebedouro limpo", criticidade: "NAO_CRITICA", observacao: "Bebedouro com manchas, precisa higienização." },
    ],
  },
  {
    diasAtras: 15, veiculo: "5125", turno: "Tarde", equipeId: "equ-bravo", inspetorId: "ins-patricia", tipoLimpezaId: "c874fcb0-e008-452c-9e1b-9df31f0f8ce9",
    naoConformes: [],
  },
  {
    diasAtras: 12, veiculo: "5115", turno: "Noite", equipeId: "equ-charlie", inspetorId: "ins-carlos", tipoLimpezaId: "tl-geral",
    naoConformes: [
      { nome: "Piso do bagageiro limpo", criticidade: "NAO_CRITICA", observacao: "Mesmo problema identificado na inspeção anterior — reincidência." },
      { nome: "Vaso sanitário higienizado", criticidade: "CRITICA", observacao: "Vaso sanitário sem higienização, odor forte. Veículo retido." },
    ],
  },
  {
    diasAtras: 9, veiculo: "5485", turno: "Manhã", equipeId: "equ-delta", inspetorId: "ins-patricia", tipoLimpezaId: "tl-geral",
    naoConformes: [
      { nome: "Corrimãos e barras de apoio limpos", criticidade: "NAO_CRITICA", observacao: "Corrimãos com poeira, limpeza incompleta." },
    ],
  },
  {
    diasAtras: 6, veiculo: "5495", turno: "Tarde", equipeId: "equ-bravo", inspetorId: "ins-carlos", tipoLimpezaId: "c874fcb0-e008-452c-9e1b-9df31f0f8ce9",
    naoConformes: [],
  },
  {
    diasAtras: 4, veiculo: "5125", turno: "Manhã", equipeId: "equ-alfa", inspetorId: "ins-patricia", tipoLimpezaId: "tl-geral",
    naoConformes: [],
  },
  {
    diasAtras: 2, veiculo: "5115", turno: "Tarde", equipeId: "equ-bravo", inspetorId: "ins-carlos", tipoLimpezaId: "tl-geral",
    naoConformes: [], // problema reincidente já corrigido
  },
  {
    diasAtras: 0, veiculo: "5485", turno: "Noite", equipeId: "equ-charlie", inspetorId: "ins-patricia", tipoLimpezaId: "c874fcb0-e008-452c-9e1b-9df31f0f8ce9",
    naoConformes: [],
  },
];

const garagem = garagens[0]; // única garagem ativa no cadastro atual

const inspecoes = CENARIOS.map((cenario) => {
  const veiculo = porPrefixo(cenario.veiculo);
  const equipe = porId(equipes, cenario.equipeId);
  const inspetor = porId(inspetores, cenario.inspetorId);
  const tipoLimpeza = porId(tiposLimpeza, cenario.tipoLimpezaId);

  const itensAplicaveis = itensChecklist
    .filter((i) => itemAplicavel(i, veiculo))
    .sort((a, b) => a.ordem - b.ordem);

  const itens = itensAplicaveis.map((catalogItem) => {
    const nc = cenario.naoConformes.find((n) => n.nome === catalogItem.nome);
    if (nc) {
      return {
        itemId: catalogItem.id,
        categoria: catalogItem.categoria,
        label: catalogItem.nome,
        status: "NAO_CONFORME",
        observacao: nc.observacao,
        criticidade: nc.criticidade,
      };
    }
    return {
      itemId: catalogItem.id,
      categoria: catalogItem.categoria,
      label: catalogItem.nome,
      status: "CONFORME",
    };
  });

  const naoEncontrados = cenario.naoConformes.filter(
    (nc) => !itensAplicaveis.some((i) => i.nome === nc.nome)
  );
  if (naoEncontrados.length > 0) {
    throw new Error(`Item(ns) de não conformidade não encontrado(s) no catálogo: ${naoEncontrados.map((n) => n.nome).join(", ")}`);
  }

  const dataBase = new Date();
  dataBase.setDate(dataBase.getDate() - cenario.diasAtras);
  dataBase.setHours(8 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60), 0, 0);
  const criadoEm = dataBase.toISOString();
  const finalizadoEm = new Date(dataBase.getTime() + 18 * 60 * 1000).toISOString();

  const resumo = calcularResumo(itens);

  return {
    id: randomUUID(),
    criadoEm,
    finalizadoEm,
    prefixo: veiculo.prefixo,
    placa: veiculo.placa,
    garagem: garagem.nome,
    turno: cenario.turno,
    tipoLimpeza: tipoLimpeza.nome,
    inspetor: inspetor.nomeCompleto,
    equipe: equipe.nome,
    veiculoId: veiculo.id,
    garagemId: garagem.id,
    tipoLimpezaId: tipoLimpeza.id,
    inspetorId: inspetor.id,
    equipeId: equipe.id,
    criadoPorUsuarioId: usuarioLogado.id,
    criadoPorNome: usuarioLogado.nome,
    itens,
    resumo,
  };
});

// --- 4. Escrita transacional ---------------------------------------------
const db = new DatabaseSync(DB_PATH);
const totalAntes = db.prepare("SELECT COUNT(*) as n FROM inspecoes").get().n;

db.exec("BEGIN IMMEDIATE");
try {
  const insert = db.prepare("INSERT INTO inspecoes (id, criado_em, data) VALUES (?, ?, ?)");
  for (const insp of inspecoes) {
    insert.run(insp.id, insp.criadoEm, JSON.stringify(insp));
  }
  const totalDepois = db.prepare("SELECT COUNT(*) as n FROM inspecoes").get().n;
  if (totalDepois !== totalAntes + inspecoes.length) {
    throw new Error(`Esperado ${totalAntes + inspecoes.length} inspeções, mas há ${totalDepois}. Revertendo.`);
  }
  db.exec("COMMIT");
  console.log(`Confirmado: ${inspecoes.length} inspeção(ões) de exemplo inserida(s). Total: ${totalAntes} → ${totalDepois}.`);
} catch (erro) {
  db.exec("ROLLBACK");
  db.close();
  console.error("Falha ao inserir — NENHUMA alteração foi salva:", erro.message);
  process.exit(1);
}
db.close();

// --- 5. Registro dos IDs criados, para permitir limpeza exata depois -----
// Ver scripts/limpar-inspecoes-demo.mjs — remove SOMENTE os IDs listados
// aqui, nunca a tabela inteira, para não arriscar apagar inspeções reais
// feitas entre a demonstração e a limpeza.
const REGISTRO_PATH = path.join(
  "C:\\Users\\Rota\\OneDrive\\Meus Documentos Pessoais\\Sistema_Limpeza_Frota",
  "scripts",
  "demo-inspecoes-ids.json"
);
fs.writeFileSync(
  REGISTRO_PATH,
  JSON.stringify({ criadoEm: new Date().toISOString(), ids: inspecoes.map((i) => i.id) }, null, 2),
  "utf-8"
);
console.log(`\nIDs registrados em: ${REGISTRO_PATH} (use scripts/limpar-inspecoes-demo.mjs para remover depois).`);

console.log("\nResumo das inspeções criadas:");
for (const i of inspecoes) {
  console.log(
    `  ${i.criadoEm.slice(0, 10)}  ${i.prefixo}  ${i.turno.padEnd(6)}  ${i.resumo.resultado.padEnd(9)}  NC=${i.resumo.naoConformes}  Críticas=${i.resumo.ncCriticas}`
  );
}

import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { gerarId } from "./ids";
import {
  CONFIGURACAO_LEMBRETES_PADRAO,
  type ConfiguracaoLembretes,
  type ConflitoValores,
  type Principio,
  type RevisaoSemanal,
  type SelecaoPrincipioSemanal,
  type Situacao,
  type Valor,
} from "./types";

const DB_NAME = "governo-interior";
const DB_VERSAO = 1;

interface GovernoInteriorSchema extends DBSchema {
  valores: { key: string; value: Valor };
  principios: { key: string; value: Principio };
  situacoes: {
    key: string;
    value: Situacao;
    indexes: { data: string; valorId: string; principioId: string };
  };
  conflitos: { key: string; value: ConflitoValores };
  selecoesSemanais: { key: string; value: SelecaoPrincipioSemanal; indexes: { semanaInicio: string } };
  revisoesSemanais: { key: string; value: RevisaoSemanal; indexes: { semanaInicio: string } };
  configuracoes: { key: string; value: { chave: string; valor: unknown } };
}

let dbPromise: Promise<IDBPDatabase<GovernoInteriorSchema>> | null = null;

function valoresIniciais(): Valor[] {
  const agora = new Date().toISOString();
  const base: Array<Pick<Valor, "nome" | "objetivo">> = [
    { nome: "Fé", objetivo: "Confiar e agir com propósito mesmo diante da incerteza." },
    { nome: "Família", objetivo: "Cuidar e fortalecer os laços com quem eu amo." },
    { nome: "Integridade", objetivo: "Ser o mesmo homem em público e em particular." },
    { nome: "Dignidade Humana", objetivo: "Tratar toda pessoa — inclusive eu mesmo — com respeito." },
    { nome: "Evolução", objetivo: "Tornar-me continuamente um profissional e uma pessoa melhor." },
  ];
  return base.map((v) => ({
    id: gerarId(),
    nome: v.nome,
    objetivo: v.objetivo,
    status: "EM_VALIDACAO",
    comportamentosQueDemonstram: [],
    comportamentosQueContradizem: [],
    evidenciasIds: [],
    conflitosComOutrosValores: "",
    aprendizados: "",
    criadoEm: agora,
    atualizadoEm: agora,
  }));
}

export function getDb(): Promise<IDBPDatabase<GovernoInteriorSchema>> {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB indisponível neste ambiente.");
  }
  if (!dbPromise) {
    dbPromise = openDB<GovernoInteriorSchema>(DB_NAME, DB_VERSAO, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("valores")) {
          db.createObjectStore("valores", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("principios")) {
          db.createObjectStore("principios", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("situacoes")) {
          const store = db.createObjectStore("situacoes", { keyPath: "id" });
          store.createIndex("data", "data");
          store.createIndex("valorId", "valorId");
          store.createIndex("principioId", "principioId");
        }
        if (!db.objectStoreNames.contains("conflitos")) {
          db.createObjectStore("conflitos", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("selecoesSemanais")) {
          const store = db.createObjectStore("selecoesSemanais", { keyPath: "id" });
          store.createIndex("semanaInicio", "semanaInicio");
        }
        if (!db.objectStoreNames.contains("revisoesSemanais")) {
          const store = db.createObjectStore("revisoesSemanais", { keyPath: "id" });
          store.createIndex("semanaInicio", "semanaInicio");
        }
        if (!db.objectStoreNames.contains("configuracoes")) {
          db.createObjectStore("configuracoes", { keyPath: "chave" });
        }
      },
    }).then(async (db) => {
      const existentes = await db.count("valores");
      if (existentes === 0) {
        const tx = db.transaction("valores", "readwrite");
        await Promise.all(valoresIniciais().map((v) => tx.store.put(v)));
        await tx.done;
      }
      return db;
    });
  }
  return dbPromise;
}

// --- Valores -----------------------------------------------------------

export async function listarValores(): Promise<Valor[]> {
  const db = await getDb();
  const todos = await db.getAll("valores");
  return todos.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

export async function obterValor(id: string): Promise<Valor | undefined> {
  const db = await getDb();
  return db.get("valores", id);
}

export async function salvarValor(valor: Valor): Promise<void> {
  const db = await getDb();
  await db.put("valores", { ...valor, atualizadoEm: new Date().toISOString() });
}

export async function criarValor(dados: Omit<Valor, "id" | "criadoEm" | "atualizadoEm" | "evidenciasIds">): Promise<Valor> {
  const agora = new Date().toISOString();
  const novo: Valor = { ...dados, id: gerarId(), evidenciasIds: [], criadoEm: agora, atualizadoEm: agora };
  const db = await getDb();
  await db.put("valores", novo);
  return novo;
}

export async function excluirValor(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("valores", id);
}

// --- Princípios ----------------------------------------------------------

export async function listarPrincipios(): Promise<Principio[]> {
  const db = await getDb();
  const todos = await db.getAll("principios");
  return todos.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

export async function obterPrincipio(id: string): Promise<Principio | undefined> {
  const db = await getDb();
  return db.get("principios", id);
}

export async function salvarPrincipio(principio: Principio): Promise<void> {
  const db = await getDb();
  await db.put("principios", { ...principio, atualizadoEm: new Date().toISOString() });
}

export async function criarPrincipio(
  dados: Omit<Principio, "id" | "criadoEm" | "atualizadoEm" | "estagio" | "incorporadoEm">,
): Promise<Principio> {
  const agora = new Date().toISOString();
  const novo: Principio = {
    ...dados,
    id: gerarId(),
    estagio: "DESCOBRIR",
    incorporadoEm: null,
    criadoEm: agora,
    atualizadoEm: agora,
  };
  const db = await getDb();
  await db.put("principios", novo);
  return novo;
}

export async function excluirPrincipio(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("principios", id);
}

// --- Situações (teste da vida real) --------------------------------------

export async function listarSituacoes(): Promise<Situacao[]> {
  const db = await getDb();
  const todas = await db.getAll("situacoes");
  return todas.sort((a, b) => b.data.localeCompare(a.data));
}

export async function listarSituacoesPorPrincipio(principioId: string): Promise<Situacao[]> {
  const db = await getDb();
  const todas = await db.getAllFromIndex("situacoes", "principioId", principioId);
  return todas.sort((a, b) => b.data.localeCompare(a.data));
}

export async function listarSituacoesPorValor(valorId: string): Promise<Situacao[]> {
  const db = await getDb();
  const todas = await db.getAllFromIndex("situacoes", "valorId", valorId);
  return todas.sort((a, b) => b.data.localeCompare(a.data));
}

export async function obterSituacao(id: string): Promise<Situacao | undefined> {
  const db = await getDb();
  return db.get("situacoes", id);
}

export async function criarSituacao(dados: Omit<Situacao, "id" | "criadoEm" | "atualizadoEm">): Promise<Situacao> {
  const agora = new Date().toISOString();
  const nova: Situacao = { ...dados, id: gerarId(), criadoEm: agora, atualizadoEm: agora };
  const db = await getDb();
  await db.put("situacoes", nova);
  return nova;
}

export async function salvarSituacao(situacao: Situacao): Promise<void> {
  const db = await getDb();
  await db.put("situacoes", { ...situacao, atualizadoEm: new Date().toISOString() });
}

export async function excluirSituacao(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("situacoes", id);
}

// --- Conflitos de valores --------------------------------------------------

export async function listarConflitos(): Promise<ConflitoValores[]> {
  const db = await getDb();
  const todos = await db.getAll("conflitos");
  return todos.sort((a, b) => b.data.localeCompare(a.data));
}

export async function obterConflito(id: string): Promise<ConflitoValores | undefined> {
  const db = await getDb();
  return db.get("conflitos", id);
}

export async function criarConflito(
  dados: Omit<ConflitoValores, "id" | "criadoEm" | "atualizadoEm" | "revisoes">,
): Promise<ConflitoValores> {
  const agora = new Date().toISOString();
  const novo: ConflitoValores = { ...dados, id: gerarId(), revisoes: [], criadoEm: agora, atualizadoEm: agora };
  const db = await getDb();
  await db.put("conflitos", novo);
  return novo;
}

export async function salvarConflito(conflito: ConflitoValores): Promise<void> {
  const db = await getDb();
  await db.put("conflitos", { ...conflito, atualizadoEm: new Date().toISOString() });
}

// --- Princípio da semana / revisão semanal ---------------------------------

export async function obterSelecaoSemanal(semanaInicio: string): Promise<SelecaoPrincipioSemanal | undefined> {
  const db = await getDb();
  const resultados = await db.getAllFromIndex("selecoesSemanais", "semanaInicio", semanaInicio);
  return resultados[0];
}

export async function definirPrincipioDaSemana(semanaInicio: string, principioId: string): Promise<SelecaoPrincipioSemanal> {
  const db = await getDb();
  const existente = await obterSelecaoSemanal(semanaInicio);
  const registro: SelecaoPrincipioSemanal = existente
    ? { ...existente, principioId }
    : { id: gerarId(), semanaInicio, principioId, criadoEm: new Date().toISOString() };
  await db.put("selecoesSemanais", registro);
  return registro;
}

export async function listarRevisoesSemanais(): Promise<RevisaoSemanal[]> {
  const db = await getDb();
  const todas = await db.getAll("revisoesSemanais");
  return todas.sort((a, b) => b.semanaInicio.localeCompare(a.semanaInicio));
}

export async function criarRevisaoSemanal(dados: Omit<RevisaoSemanal, "id" | "criadoEm">): Promise<RevisaoSemanal> {
  const db = await getDb();
  const nova: RevisaoSemanal = { ...dados, id: gerarId(), criadoEm: new Date().toISOString() };
  await db.put("revisoesSemanais", nova);
  return nova;
}

// --- Configurações -----------------------------------------------------------

export async function obterConfiguracaoLembretes(): Promise<ConfiguracaoLembretes> {
  const db = await getDb();
  const registro = await db.get("configuracoes", "lembretes");
  if (!registro) return CONFIGURACAO_LEMBRETES_PADRAO;
  return { ...CONFIGURACAO_LEMBRETES_PADRAO, ...(registro.valor as ConfiguracaoLembretes) };
}

export async function salvarConfiguracaoLembretes(config: ConfiguracaoLembretes): Promise<void> {
  const db = await getDb();
  await db.put("configuracoes", { chave: "lembretes", valor: config });
}

// --- Export / import completo ------------------------------------------------

export async function exportarTudo() {
  const [valores, principios, situacoes, conflitos, configuracaoLembretes] = await Promise.all([
    listarValores(),
    listarPrincipios(),
    listarSituacoes(),
    listarConflitos(),
    obterConfiguracaoLembretes(),
  ]);
  const db = await getDb();
  const selecoesSemanais = await db.getAll("selecoesSemanais");
  const revisoesSemanais = await db.getAll("revisoesSemanais");
  return {
    valores,
    principios,
    situacoes,
    conflitos,
    selecoesSemanais,
    revisoesSemanais,
    configuracaoLembretes,
  };
}

export async function importarTudo(dados: {
  valores: Valor[];
  principios: Principio[];
  situacoes: Situacao[];
  conflitos: ConflitoValores[];
  selecoesSemanais: SelecaoPrincipioSemanal[];
  revisoesSemanais: RevisaoSemanal[];
  configuracaoLembretes: ConfiguracaoLembretes;
}): Promise<void> {
  const db = await getDb();

  async function substituir<Nome extends "valores" | "principios" | "situacoes" | "conflitos" | "selecoesSemanais" | "revisoesSemanais">(
    nomeStore: Nome,
    registros: GovernoInteriorSchema[Nome]["value"][],
  ) {
    const tx = db.transaction(nomeStore, "readwrite");
    await tx.store.clear();
    for (const registro of registros) {
      await tx.store.put(registro);
    }
    await tx.done;
  }

  await substituir("valores", dados.valores);
  await substituir("principios", dados.principios);
  await substituir("situacoes", dados.situacoes);
  await substituir("conflitos", dados.conflitos);
  await substituir("selecoesSemanais", dados.selecoesSemanais);
  await substituir("revisoesSemanais", dados.revisoesSemanais);
  await salvarConfiguracaoLembretes(dados.configuracaoLembretes);
}

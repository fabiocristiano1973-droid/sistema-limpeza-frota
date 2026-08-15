import "server-only";
import fs from "fs";
import path from "path";
import { DatabaseSync } from "node:sqlite";
import { getDataDir } from "@/lib/data-dir";

/**
 * Tabelas que, numa instalação já em uso, nunca deveriam aparecer ausentes
 * ou vazias. Se o arquivo do banco já existe (não é a primeira execução) e
 * qualquer uma delas estiver faltando/zerada, tratamos como sinal de perda
 * de dados — não como "primeira vez, hora de semear dados de exemplo".
 *
 * Contexto: incidente de 2026-08-15 em que o arquivo do banco foi
 * substituído por um esqueleto vazio entre uma noite e a manhã seguinte, e
 * o app teria silenciosamente recriado tabelas com dados fictícios de seed
 * assim que qualquer página de cadastro fosse aberta.
 */
const TABELAS_CRITICAS = ["veiculos", "garagens", "itens_checklist"] as const;

const NOME_ARQUIVO_ALERTA = "ALERTA_INTEGRIDADE.json";

export interface ResultadoIntegridade {
  ok: boolean;
  motivo?: string;
  detalhes?: Record<string, number | "ausente">;
}

export interface AlertaAtivo {
  motivo: string;
  detectadoEm: string;
  detalhes?: Record<string, number | "ausente">;
}

function caminhoBanco(): string {
  return path.join(getDataDir(), "sistema-limpeza-frota.db");
}

function caminhoAlerta(): string {
  return path.join(getDataDir(), NOME_ARQUIVO_ALERTA);
}

function escreverAlerta(motivo: string, detalhes?: Record<string, number | "ausente">) {
  const payload: AlertaAtivo = { motivo, detectadoEm: new Date().toISOString(), detalhes };
  fs.writeFileSync(caminhoAlerta(), JSON.stringify(payload, null, 2), "utf-8");
}

function limparAlerta() {
  const p = caminhoAlerta();
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

/**
 * Roda a verificação e atualiza o arquivo de alerta (grava se encontrar
 * problema, remove se estiver tudo certo). Chamada na inicialização do
 * servidor (instrumentation.ts) e periodicamente junto do backup
 * automático, para detectar perda de dados mesmo sem reiniciar o processo.
 */
export function verificarIntegridadeBanco(): ResultadoIntegridade {
  const dbPath = caminhoBanco();

  // Instalação nova de verdade: arquivo ainda não existe. Não é incidente,
  // é o primeiro boot — deixa o fluxo normal de seed cuidar disso.
  if (!fs.existsSync(dbPath)) {
    limparAlerta();
    return { ok: true };
  }

  let db: InstanceType<typeof DatabaseSync> | null = null;
  try {
    db = new DatabaseSync(dbPath, { readOnly: true });
    const tabelasExistentes = new Set(
      (db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[]).map(
        (r) => r.name
      )
    );

    const detalhes: Record<string, number | "ausente"> = {};
    let comprometido = false;
    for (const tabela of TABELAS_CRITICAS) {
      if (!tabelasExistentes.has(tabela)) {
        detalhes[tabela] = "ausente";
        comprometido = true;
        continue;
      }
      const linha = db.prepare(`SELECT COUNT(*) as c FROM ${tabela}`).get() as { c: number };
      detalhes[tabela] = linha.c;
      if (linha.c === 0) comprometido = true;
    }

    if (comprometido) {
      const motivo = "Tabelas críticas ausentes ou vazias — possível perda de dados.";
      escreverAlerta(motivo, detalhes);
      return { ok: false, motivo, detalhes };
    }

    limparAlerta();
    return { ok: true, detalhes };
  } catch (erro) {
    const motivo = `Falha ao verificar integridade do banco: ${erro instanceof Error ? erro.message : String(erro)}`;
    escreverAlerta(motivo);
    return { ok: false, motivo };
  } finally {
    db?.close();
  }
}

/** Leitura rápida (sem tocar no banco) usada pelo layout em toda requisição. */
export function lerAlertaAtivo(): AlertaAtivo | null {
  const p = caminhoAlerta();
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8")) as AlertaAtivo;
  } catch {
    return {
      motivo: "Alerta de integridade ativo (arquivo de alerta ilegível).",
      detectadoEm: new Date().toISOString(),
    };
  }
}

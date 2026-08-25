import { DadosInspecao } from "@/components/nova-inspecao/DadosForm";
import { ItemEditState } from "@/lib/wizard";

/**
 * Rascunho da inspeção em andamento, salvo no localStorage do navegador a
 * cada mudança. Existe para o problema relatado em campo (checklist
 * 21-25/08/2026): um recarregamento acidental da página (F5, ou o gesto de
 * "puxar para atualizar" do navegador do celular tocando perto do topo da
 * tela) apagava a inspeção inteira sem salvar nada, porque todo o estado
 * vivia só em memória do React. Isso cobre esse caso — ao reabrir
 * "Nova Inspeção", o rascunho é recuperado automaticamente.
 */
const CHAVE_RASCUNHO = "slf_rascunho_inspecao_v1";

export interface RascunhoInspecao {
  dados: DadosInspecao;
  itens: ItemEditState[];
  step: number;
  salvoEm: string;
}

function localStorageDisponivel(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function carregarRascunho(): RascunhoInspecao | null {
  if (!localStorageDisponivel()) return null;
  try {
    const raw = window.localStorage.getItem(CHAVE_RASCUNHO);
    if (!raw) return null;
    return JSON.parse(raw) as RascunhoInspecao;
  } catch {
    return null;
  }
}

export function salvarRascunho(rascunho: Omit<RascunhoInspecao, "salvoEm">): void {
  if (!localStorageDisponivel()) return;
  const completo: RascunhoInspecao = { ...rascunho, salvoEm: new Date().toISOString() };
  try {
    window.localStorage.setItem(CHAVE_RASCUNHO, JSON.stringify(completo));
  } catch {
    // Provavelmente estourou a cota do localStorage (fotos em base64 pesam
    // muito) — tenta de novo sem as evidências, pra não perder pelo menos as
    // respostas do checklist (status/observação/criticidade). O inspetor
    // teria que reanexar as fotos se precisar recuperar depois de um
    // recarregamento, mas não perde o checklist inteiro.
    try {
      const semEvidencias: RascunhoInspecao = {
        ...completo,
        itens: completo.itens.map((i) => ({ ...i, fotoDataUrl: undefined, evidenciaTipo: undefined })),
      };
      window.localStorage.setItem(CHAVE_RASCUNHO, JSON.stringify(semEvidencias));
    } catch {
      // Sem espaço nem assim — segue só em memória, como antes.
    }
  }
}

export function limparRascunho(): void {
  if (!localStorageDisponivel()) return;
  try {
    window.localStorage.removeItem(CHAVE_RASCUNHO);
  } catch {
    // Sem consequência prática se isso falhar.
  }
}

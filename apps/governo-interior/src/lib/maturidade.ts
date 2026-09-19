import type { EstagioMaturidade, Situacao } from "./types";
import { CICLO_MATURIDADE } from "./types";

export const MINIMO_SITUACOES_PARA_INCORPORAR = 5;
export const PROPORCAO_MINIMA_COERENCIA = 0.6;

export interface EstatisticasPrincipio {
  totalSituacoes: number;
  coerentes: number;
  contradicoes: number;
  padroes: number;
  evolucoes: number;
  ultimaSituacaoData: string | null;
}

export function calcularEstatisticas(situacoes: Situacao[]): EstatisticasPrincipio {
  return {
    totalSituacoes: situacoes.length,
    coerentes: situacoes.filter((s) => s.coerente === true).length,
    contradicoes: situacoes.filter((s) => s.coerente === false).length,
    padroes: situacoes.filter((s) => s.classificacoes.includes("PADRAO")).length,
    evolucoes: situacoes.filter((s) => s.classificacoes.includes("EVOLUCAO")).length,
    ultimaSituacaoData: situacoes.length
      ? situacoes.reduce((maisRecente, s) => (s.data > maisRecente ? s.data : maisRecente), situacoes[0].data)
      : null,
  };
}

export interface AvaliacaoAvanco {
  podeAvancar: boolean;
  motivo: string;
}

/**
 * Só a etapa final (INCORPORAR) é bloqueada por evidência — as demais o
 * usuário controla livremente, porque descobrir/definir/testar/praticar/
 * revisar são decisões dele, não fatos que o sistema possa verificar.
 */
export function avaliarAvancoParaEstagio(
  estagioDestino: EstagioMaturidade,
  estatisticas: EstatisticasPrincipio,
): AvaliacaoAvanco {
  if (estagioDestino !== "INCORPORAR") {
    return { podeAvancar: true, motivo: "" };
  }

  if (estatisticas.totalSituacoes < MINIMO_SITUACOES_PARA_INCORPORAR) {
    const faltam = MINIMO_SITUACOES_PARA_INCORPORAR - estatisticas.totalSituacoes;
    return {
      podeAvancar: false,
      motivo: `Faltam ${faltam} situação(ões) real(is) registrada(s) para este princípio (mínimo de ${MINIMO_SITUACOES_PARA_INCORPORAR}).`,
    };
  }

  const proporcaoCoerencia = estatisticas.coerentes / estatisticas.totalSituacoes;
  if (proporcaoCoerencia < PROPORCAO_MINIMA_COERENCIA) {
    return {
      podeAvancar: false,
      motivo: `Apenas ${Math.round(proporcaoCoerencia * 100)}% das situações registradas foram coerentes com este princípio — é preciso pelo menos ${Math.round(PROPORCAO_MINIMA_COERENCIA * 100)}% para incorporar.`,
    };
  }

  return { podeAvancar: true, motivo: "" };
}

export function indiceEstagio(estagio: EstagioMaturidade): number {
  return CICLO_MATURIDADE.indexOf(estagio);
}

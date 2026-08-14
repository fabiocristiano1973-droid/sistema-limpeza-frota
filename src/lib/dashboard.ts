import { Inspecao } from "@/types/inspection";
import { dataLocalISO } from "@/lib/date";

export interface GrupoResultado {
  chave: string;
  total: number;
  aprovados: number;
  reprovados: number;
  percentualAprovacao: number;
}

export interface RankingNC {
  label: string;
  ocorrencias: number;
  percentual: number;
  percentualAcumulado: number;
}

export interface Reincidencia {
  prefixo: string;
  itemLabel: string;
  ocorrencias: number;
}

export interface EvolucaoPeriodo {
  data: string;
  total: number;
  aprovados: number;
  reprovados: number;
  percentualAprovacao: number;
}

export interface DashboardStats {
  totalInspecoes: number;
  aprovados: number;
  reprovados: number;
  percentualAprovacao: number;
  totalNC: number;
  ncCriticas: number;
  topNaoConformidades: RankingNC[];
  reincidencias: Reincidencia[];
  resultadoPorVeiculo: GrupoResultado[];
  resultadoPorEquipe: GrupoResultado[];
  resultadoPorTurno: GrupoResultado[];
  evolucaoPorPeriodo: EvolucaoPeriodo[];
}

function agrupar(inspecoes: Inspecao[], chaveFn: (i: Inspecao) => string): GrupoResultado[] {
  const mapa = new Map<string, { total: number; aprovados: number; reprovados: number }>();
  for (const insp of inspecoes) {
    const chave = chaveFn(insp);
    const atual = mapa.get(chave) ?? { total: 0, aprovados: 0, reprovados: 0 };
    atual.total += 1;
    if (insp.resumo.resultado === "APROVADO") atual.aprovados += 1;
    else atual.reprovados += 1;
    mapa.set(chave, atual);
  }
  return Array.from(mapa.entries())
    .map(([chave, v]) => ({
      chave,
      total: v.total,
      aprovados: v.aprovados,
      reprovados: v.reprovados,
      percentualAprovacao: v.total > 0 ? Math.round((v.aprovados / v.total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

export function calcularDashboard(inspecoes: Inspecao[]): DashboardStats {
  const totalInspecoes = inspecoes.length;
  const aprovados = inspecoes.filter((i) => i.resumo.resultado === "APROVADO").length;
  const reprovados = totalInspecoes - aprovados;
  const percentualAprovacao =
    totalInspecoes > 0 ? Math.round((aprovados / totalInspecoes) * 1000) / 10 : 0;

  let totalNC = 0;
  let ncCriticas = 0;
  const ncPorLabel = new Map<string, number>();
  const ncPorVeiculoItem = new Map<string, { prefixo: string; itemLabel: string; ocorrencias: number }>();

  for (const insp of inspecoes) {
    for (const item of insp.itens) {
      if (item.status !== "NAO_CONFORME") continue;
      totalNC += 1;
      if (item.criticidade === "CRITICA") ncCriticas += 1;
      ncPorLabel.set(item.label, (ncPorLabel.get(item.label) ?? 0) + 1);

      const chaveVI = `${insp.prefixo}::${item.label}`;
      const atual = ncPorVeiculoItem.get(chaveVI) ?? {
        prefixo: insp.prefixo,
        itemLabel: item.label,
        ocorrencias: 0,
      };
      atual.ocorrencias += 1;
      ncPorVeiculoItem.set(chaveVI, atual);
    }
  }

  const rankingBruto = Array.from(ncPorLabel.entries()).sort((a, b) => b[1] - a[1]);
  let acumulado = 0;
  const topNaoConformidades: RankingNC[] = rankingBruto.slice(0, 10).map(([label, ocorrencias]) => {
    const percentual = totalNC > 0 ? Math.round((ocorrencias / totalNC) * 1000) / 10 : 0;
    acumulado += percentual;
    return {
      label,
      ocorrencias,
      percentual,
      percentualAcumulado: Math.round(acumulado * 10) / 10,
    };
  });

  const reincidencias: Reincidencia[] = Array.from(ncPorVeiculoItem.values())
    .filter((r) => r.ocorrencias >= 2)
    .sort((a, b) => b.ocorrencias - a.ocorrencias)
    .slice(0, 10);

  const resultadoPorVeiculo = agrupar(inspecoes, (i) => `${i.prefixo} (${i.placa})`);
  const resultadoPorEquipe = agrupar(inspecoes, (i) => i.equipe);
  const resultadoPorTurno = agrupar(inspecoes, (i) => i.turno);

  const evolucaoMapa = new Map<string, { total: number; aprovados: number; reprovados: number }>();
  for (const insp of inspecoes) {
    const dia = dataLocalISO(insp.criadoEm);
    const atual = evolucaoMapa.get(dia) ?? { total: 0, aprovados: 0, reprovados: 0 };
    atual.total += 1;
    if (insp.resumo.resultado === "APROVADO") atual.aprovados += 1;
    else atual.reprovados += 1;
    evolucaoMapa.set(dia, atual);
  }
  const evolucaoPorPeriodo: EvolucaoPeriodo[] = Array.from(evolucaoMapa.entries())
    .map(([data, v]) => ({
      data,
      total: v.total,
      aprovados: v.aprovados,
      reprovados: v.reprovados,
      percentualAprovacao: v.total > 0 ? Math.round((v.aprovados / v.total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => (a.data < b.data ? -1 : 1));

  return {
    totalInspecoes,
    aprovados,
    reprovados,
    percentualAprovacao,
    totalNC,
    ncCriticas,
    topNaoConformidades,
    reincidencias,
    resultadoPorVeiculo,
    resultadoPorEquipe,
    resultadoPorTurno,
    evolucaoPorPeriodo,
  };
}

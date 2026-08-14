import { Inspecao, Turno } from "@/types/inspection";
import { obterInfoCategoria } from "@/lib/checklist-catalog";
import { EvolucaoPeriodo, RankingNC } from "@/lib/dashboard";
import { dataLocalISO } from "@/lib/date";

export interface AreaOfensora {
  categoria: string;
  label: string;
  ocorrencias: number;
}

export interface ItemOfensor {
  label: string;
  ocorrencias: number;
}

export interface TurnoCritico {
  turno: Turno;
  taxaReprovacao: number;
  totalInspecoes: number;
  reprovadas: number;
}

export interface EquipeRelacionada {
  equipe: string;
  reprovadas: number;
}

export interface DesempenhoUnidade {
  unidade: string;
  totalInspecoes: number;
  aprovadas: number;
  reprovadas: number;
  taxaAprovacao: number;
  taxaReprovacao: number;
  totalNC: number;
  ncCriticas: number;
  mediaNcPorInspecao: number;
  principalArea: AreaOfensora | null;
  principalItem: ItemOfensor | null;
  turnoMaisCritico: TurnoCritico | null;
  equipeMaisRelacionada: EquipeRelacionada | null;
  reincidencias: number;
  topNaoConformidades: RankingNC[];
  evolucaoPorPeriodo: EvolucaoPeriodo[];
}

function calcularParetoNC(inspecoes: Inspecao[]): { totalNC: number; ranking: RankingNC[] } {
  const porLabel = new Map<string, number>();
  let totalNC = 0;
  for (const insp of inspecoes) {
    for (const item of insp.itens) {
      if (item.status !== "NAO_CONFORME") continue;
      totalNC += 1;
      porLabel.set(item.label, (porLabel.get(item.label) ?? 0) + 1);
    }
  }
  const ordenado = Array.from(porLabel.entries()).sort((a, b) => b[1] - a[1]);
  let acumulado = 0;
  const ranking: RankingNC[] = ordenado.slice(0, 10).map(([label, ocorrencias]) => {
    const percentual = totalNC > 0 ? Math.round((ocorrencias / totalNC) * 1000) / 10 : 0;
    acumulado += percentual;
    return { label, ocorrencias, percentual, percentualAcumulado: Math.round(acumulado * 10) / 10 };
  });
  return { totalNC, ranking };
}

function calcularEvolucao(inspecoes: Inspecao[]): EvolucaoPeriodo[] {
  const mapa = new Map<string, { total: number; aprovados: number; reprovados: number }>();
  for (const insp of inspecoes) {
    const dia = dataLocalISO(insp.criadoEm);
    const atual = mapa.get(dia) ?? { total: 0, aprovados: 0, reprovados: 0 };
    atual.total += 1;
    if (insp.resumo.resultado === "APROVADO") atual.aprovados += 1;
    else atual.reprovados += 1;
    mapa.set(dia, atual);
  }
  return Array.from(mapa.entries())
    .map(([data, v]) => ({
      data,
      total: v.total,
      aprovados: v.aprovados,
      reprovados: v.reprovados,
      percentualAprovacao: v.total > 0 ? Math.round((v.aprovados / v.total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => (a.data < b.data ? -1 : 1));
}

/**
 * Desempenho por Garagem/Unidade — SEMPRE agrupado pelo campo `garagem`
 * gravado no snapshot de cada inspeção (o texto capturado no momento da
 * finalização), nunca pela unidade atual do cadastro do veículo. Isso
 * garante que, se um veículo for transferido de unidade depois, as
 * inspeções antigas continuem contabilizadas na unidade onde realmente
 * foram realizadas.
 */
export function calcularDesempenhoPorUnidade(inspecoes: Inspecao[]): DesempenhoUnidade[] {
  const porUnidade = new Map<string, Inspecao[]>();
  for (const insp of inspecoes) {
    const lista = porUnidade.get(insp.garagem) ?? [];
    lista.push(insp);
    porUnidade.set(insp.garagem, lista);
  }

  const resultado: DesempenhoUnidade[] = [];

  for (const [unidade, lista] of porUnidade.entries()) {
    const totalInspecoes = lista.length;
    const aprovadas = lista.filter((i) => i.resumo.resultado === "APROVADO").length;
    const reprovadas = totalInspecoes - aprovadas;
    const taxaAprovacao = totalInspecoes > 0 ? Math.round((aprovadas / totalInspecoes) * 1000) / 10 : 0;
    const taxaReprovacao = totalInspecoes > 0 ? Math.round((reprovadas / totalInspecoes) * 1000) / 10 : 0;

    let totalNC = 0;
    let ncCriticas = 0;
    const porArea = new Map<string, number>();
    const porItem = new Map<string, number>();
    const porVeiculoItem = new Map<string, number>();

    for (const insp of lista) {
      for (const item of insp.itens) {
        if (item.status !== "NAO_CONFORME") continue;
        totalNC += 1;
        if (item.criticidade === "CRITICA") ncCriticas += 1;

        const areaLabel = obterInfoCategoria(item.categoria).label;
        porArea.set(areaLabel, (porArea.get(areaLabel) ?? 0) + 1);
        porItem.set(item.label, (porItem.get(item.label) ?? 0) + 1);

        const chaveVI = `${insp.prefixo}::${item.label}`;
        porVeiculoItem.set(chaveVI, (porVeiculoItem.get(chaveVI) ?? 0) + 1);
      }
    }

    const mediaNcPorInspecao = totalInspecoes > 0 ? Math.round((totalNC / totalInspecoes) * 100) / 100 : 0;

    const areaTop = Array.from(porArea.entries()).sort((a, b) => b[1] - a[1])[0];
    const principalArea: AreaOfensora | null = areaTop
      ? { categoria: areaTop[0], label: areaTop[0], ocorrencias: areaTop[1] }
      : null;

    const itemTop = Array.from(porItem.entries()).sort((a, b) => b[1] - a[1])[0];
    const principalItem: ItemOfensor | null = itemTop
      ? { label: itemTop[0], ocorrencias: itemTop[1] }
      : null;

    const reincidencias = Array.from(porVeiculoItem.values()).filter((c) => c >= 2).length;

    // Turno mais crítico = maior TAXA de reprovação entre os turnos com
    // inspeções nesta unidade (não apenas o maior volume).
    const porTurno = new Map<Turno, { total: number; reprovadas: number }>();
    for (const insp of lista) {
      const atual = porTurno.get(insp.turno) ?? { total: 0, reprovadas: 0 };
      atual.total += 1;
      if (insp.resumo.resultado === "REPROVADO") atual.reprovadas += 1;
      porTurno.set(insp.turno, atual);
    }
    let turnoMaisCritico: TurnoCritico | null = null;
    for (const [turno, v] of porTurno.entries()) {
      const taxa = v.total > 0 ? Math.round((v.reprovadas / v.total) * 1000) / 10 : 0;
      if (
        !turnoMaisCritico ||
        taxa > turnoMaisCritico.taxaReprovacao ||
        (taxa === turnoMaisCritico.taxaReprovacao && v.reprovadas > turnoMaisCritico.reprovadas)
      ) {
        turnoMaisCritico = { turno, taxaReprovacao: taxa, totalInspecoes: v.total, reprovadas: v.reprovadas };
      }
    }

    const porEquipe = new Map<string, number>();
    for (const insp of lista) {
      if (insp.resumo.resultado !== "REPROVADO") continue;
      porEquipe.set(insp.equipe, (porEquipe.get(insp.equipe) ?? 0) + 1);
    }
    const equipeTop = Array.from(porEquipe.entries()).sort((a, b) => b[1] - a[1])[0];
    const equipeMaisRelacionada: EquipeRelacionada | null = equipeTop
      ? { equipe: equipeTop[0], reprovadas: equipeTop[1] }
      : null;

    const { ranking } = calcularParetoNC(lista);

    resultado.push({
      unidade,
      totalInspecoes,
      aprovadas,
      reprovadas,
      taxaAprovacao,
      taxaReprovacao,
      totalNC,
      ncCriticas,
      mediaNcPorInspecao,
      principalArea,
      principalItem,
      turnoMaisCritico,
      equipeMaisRelacionada,
      reincidencias,
      topNaoConformidades: ranking,
      evolucaoPorPeriodo: calcularEvolucao(lista),
    });
  }

  return resultado;
}

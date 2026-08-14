import { ItemResultado, ResumoInspecao } from "@/types/inspection";

export function calcularResumo(itens: ItemResultado[]): ResumoInspecao {
  const totalItens = itens.length;
  const conformes = itens.filter((i) => i.status === "CONFORME").length;
  const naoConformes = itens.filter((i) => i.status === "NAO_CONFORME").length;
  const naCount = itens.filter((i) => i.status === "NA").length;
  const ncCriticas = itens.filter(
    (i) => i.status === "NAO_CONFORME" && i.criticidade === "CRITICA"
  ).length;

  const avaliaveis = conformes + naoConformes;
  const percentualConformidade =
    avaliaveis > 0 ? Math.round((conformes / avaliaveis) * 1000) / 10 : 100;

  const resultado = ncCriticas > 0 ? "REPROVADO" : "APROVADO";

  return {
    totalItens,
    conformes,
    naoConformes,
    naCount,
    percentualConformidade,
    ncCriticas,
    resultado,
  };
}

import type { ClassificacaoEvidencia, Situacao } from "./types";

/**
 * Sugere classificações para uma situação recém-registrada, olhando a
 * autoavaliação de coerência e o histórico recente do mesmo princípio.
 * É só um ponto de partida — o usuário sempre pode revisar depois
 * (nunca vira julgamento definitivo de identidade, ver seção 5 do
 * briefing do produto).
 */
export function sugerirClassificacoes(
  situacaoNova: Pick<Situacao, "coerente" | "valorId" | "principioId">,
  situacoesAnterioresMesmoPrincipio: Pick<Situacao, "coerente" | "data">[],
): ClassificacaoEvidencia[] {
  const classificacoes: ClassificacaoEvidencia[] = [];

  if (situacaoNova.coerente === true) {
    if (situacaoNova.principioId) classificacoes.push("EVIDENCIA_PRINCIPIO");
    if (situacaoNova.valorId) classificacoes.push("EVIDENCIA_VALOR");
  } else if (situacaoNova.coerente === false) {
    classificacoes.push("CONTRADICAO");
  }

  // Padrão: mesmo resultado de coerência nas últimas 3 situações (incluindo esta).
  const ultimasTres = [{ coerente: situacaoNova.coerente }, ...situacoesAnterioresMesmoPrincipio].slice(0, 3);
  if (
    ultimasTres.length === 3 &&
    situacaoNova.coerente !== null &&
    ultimasTres.every((s) => s.coerente === situacaoNova.coerente)
  ) {
    classificacoes.push("PADRAO");
  }

  // Evolução: virou coerente depois de ao menos uma contradição recente.
  const houveContradicaoRecente = situacoesAnterioresMesmoPrincipio
    .slice(0, 3)
    .some((s) => s.coerente === false);
  if (situacaoNova.coerente === true && houveContradicaoRecente) {
    classificacoes.push("EVOLUCAO");
  }

  return classificacoes;
}

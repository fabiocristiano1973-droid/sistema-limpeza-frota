import { describe, expect, it } from "vitest";
import { avaliarAvancoParaEstagio, calcularEstatisticas } from "../maturidade";
import type { Situacao } from "../types";

function situacao(parcial: Partial<Situacao>): Situacao {
  return {
    id: "id",
    data: "2026-09-01T00:00:00.000Z",
    fato: "",
    emocao: "",
    valorId: null,
    principioId: "p1",
    decisao: "",
    acao: "",
    resultado: "",
    aprendizado: "",
    correcao: "",
    ambiente: "",
    coerente: true,
    classificacoes: [],
    criadoEm: "",
    atualizadoEm: "",
    ...parcial,
  };
}

describe("calcularEstatisticas", () => {
  it("conta coerentes e contradições corretamente", () => {
    const situacoes = [
      situacao({ coerente: true }),
      situacao({ coerente: true }),
      situacao({ coerente: false }),
    ];
    const stats = calcularEstatisticas(situacoes);
    expect(stats.totalSituacoes).toBe(3);
    expect(stats.coerentes).toBe(2);
    expect(stats.contradicoes).toBe(1);
  });

  it("retorna a data mais recente", () => {
    const situacoes = [
      situacao({ data: "2026-01-01T00:00:00.000Z" }),
      situacao({ data: "2026-05-01T00:00:00.000Z" }),
      situacao({ data: "2026-03-01T00:00:00.000Z" }),
    ];
    expect(calcularEstatisticas(situacoes).ultimaSituacaoData).toBe("2026-05-01T00:00:00.000Z");
  });
});

describe("avaliarAvancoParaEstagio", () => {
  it("libera estágios intermediários sem exigir evidência", () => {
    expect(avaliarAvancoParaEstagio("DEFINIR", calcularEstatisticas([])).podeAvancar).toBe(true);
    expect(avaliarAvancoParaEstagio("PRATICAR", calcularEstatisticas([])).podeAvancar).toBe(true);
  });

  it("bloqueia INCORPORAR sem o mínimo de situações", () => {
    const stats = calcularEstatisticas([situacao({}), situacao({})]);
    const avaliacao = avaliarAvancoParaEstagio("INCORPORAR", stats);
    expect(avaliacao.podeAvancar).toBe(false);
    expect(avaliacao.motivo).toMatch(/Faltam/);
  });

  it("bloqueia INCORPORAR se a maioria das situações forem contradições", () => {
    const stats = calcularEstatisticas([
      situacao({ coerente: false }),
      situacao({ coerente: false }),
      situacao({ coerente: false }),
      situacao({ coerente: true }),
      situacao({ coerente: true }),
    ]);
    const avaliacao = avaliarAvancoParaEstagio("INCORPORAR", stats);
    expect(avaliacao.podeAvancar).toBe(false);
    expect(avaliacao.motivo).toMatch(/coerentes/);
  });

  it("libera INCORPORAR com evidências suficientes e coerência majoritária", () => {
    const stats = calcularEstatisticas([
      situacao({ coerente: true }),
      situacao({ coerente: true }),
      situacao({ coerente: true }),
      situacao({ coerente: true }),
      situacao({ coerente: false }),
    ]);
    expect(avaliarAvancoParaEstagio("INCORPORAR", stats).podeAvancar).toBe(true);
  });
});

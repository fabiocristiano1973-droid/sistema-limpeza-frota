import { describe, expect, it } from "vitest";
import { sugerirClassificacoes } from "../classificacao";

describe("sugerirClassificacoes", () => {
  it("classifica como evidência de princípio e valor quando coerente", () => {
    const resultado = sugerirClassificacoes(
      { coerente: true, valorId: "v1", principioId: "p1" },
      [],
    );
    expect(resultado).toContain("EVIDENCIA_PRINCIPIO");
    expect(resultado).toContain("EVIDENCIA_VALOR");
  });

  it("classifica como contradição quando não coerente", () => {
    const resultado = sugerirClassificacoes({ coerente: false, valorId: "v1", principioId: "p1" }, []);
    expect(resultado).toEqual(["CONTRADICAO"]);
  });

  it("identifica padrão quando as últimas 3 situações têm o mesmo resultado", () => {
    const resultado = sugerirClassificacoes(
      { coerente: true, valorId: null, principioId: "p1" },
      [
        { coerente: true, data: "2026-09-01T00:00:00.000Z" },
        { coerente: true, data: "2026-08-25T00:00:00.000Z" },
      ],
    );
    expect(resultado).toContain("PADRAO");
  });

  it("identifica evolução quando supera contradição recente", () => {
    const resultado = sugerirClassificacoes(
      { coerente: true, valorId: null, principioId: "p1" },
      [{ coerente: false, data: "2026-09-01T00:00:00.000Z" }],
    );
    expect(resultado).toContain("EVOLUCAO");
  });

  it("não sugere nada quando não há autoavaliação", () => {
    const resultado = sugerirClassificacoes({ coerente: null, valorId: null, principioId: null }, []);
    expect(resultado).toEqual([]);
  });
});

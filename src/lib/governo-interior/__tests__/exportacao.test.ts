import { describe, expect, it } from "vitest";
import { ArquivoImportacaoInvalido, montarPayloadExportacao, validarPayloadImportacao } from "../exportacao";
import { CONFIGURACAO_LEMBRETES_PADRAO } from "../types";

function dadosVazios() {
  return {
    valores: [],
    principios: [],
    situacoes: [],
    conflitos: [],
    selecoesSemanais: [],
    revisoesSemanais: [],
    configuracaoLembretes: CONFIGURACAO_LEMBRETES_PADRAO,
  };
}

describe("montarPayloadExportacao", () => {
  it("inclui versão e carimbo de data/hora", () => {
    const payload = montarPayloadExportacao(dadosVazios());
    expect(payload.versao).toBe(1);
    expect(payload.exportadoEm).toBeTruthy();
  });
});

describe("validarPayloadImportacao", () => {
  it("aceita um payload válido", () => {
    const payload = montarPayloadExportacao(dadosVazios());
    expect(() => validarPayloadImportacao(payload)).not.toThrow();
  });

  it("rejeita JSON que não é objeto", () => {
    expect(() => validarPayloadImportacao("texto")).toThrow(ArquivoImportacaoInvalido);
  });

  it("rejeita objeto sem campo obrigatório", () => {
    const payload = montarPayloadExportacao(dadosVazios()) as unknown as Record<string, unknown>;
    delete payload.situacoes;
    expect(() => validarPayloadImportacao(payload)).toThrow(/situacoes/);
  });

  it("rejeita quando um campo de lista não é array", () => {
    const payload = montarPayloadExportacao(dadosVazios()) as unknown as Record<string, unknown>;
    payload.valores = "não é lista";
    expect(() => validarPayloadImportacao(payload)).toThrow(ArquivoImportacaoInvalido);
  });
});

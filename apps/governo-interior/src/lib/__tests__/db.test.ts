import { beforeEach, describe, expect, it, vi } from "vitest";
import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";

// Cada teste precisa de um IndexedDB limpo e o módulo db.ts recarregado do
// zero — ele guarda a conexão (dbPromise) em cache a nível de módulo, então
// reaproveitar o mesmo import entre testes vazaria estado de um teste pro
// outro.
beforeEach(() => {
  indexedDB = new IDBFactory();
  vi.resetModules();
});

async function carregarDb() {
  const mod = await import("../db");
  return mod;
}

describe("db governo-interior", () => {
  it("semeia os 5 valores candidatos em EM_VALIDACAO na primeira abertura", async () => {
    const { listarValores } = await carregarDb();
    const valores = await listarValores();
    expect(valores).toHaveLength(5);
    expect(valores.every((v) => v.status === "EM_VALIDACAO")).toBe(true);
    expect(valores.map((v) => v.nome).sort()).toEqual(
      ["Dignidade Humana", "Evolução", "Fé", "Família", "Integridade"].sort(),
    );
  });

  it("cria e recupera um princípio", async () => {
    const { criarPrincipio, obterPrincipio } = await carregarDb();
    const criado = await criarPrincipio({
      nome: "Verdade em primeiro lugar",
      fraseCentral: "Prefiro a verdade desconfortável à mentira confortável.",
      icone: "🧭",
      cor: "#0ea5e9",
      pilar: "NO_QUE_EU_ACREDITO",
      valorSustentaId: null,
      significado: "",
      comportamentosQueFortalecem: [],
      comportamentosQueViolam: [],
      ambienteQuePrecisoConstruir: "",
      limites: "",
      regraDecisao: "",
      acaoPratica: "",
    });
    expect(criado.estagio).toBe("DESCOBRIR");
    const recuperado = await obterPrincipio(criado.id);
    expect(recuperado?.nome).toBe("Verdade em primeiro lugar");
  });

  it("cria situações e filtra por princípio", async () => {
    const { criarPrincipio, criarSituacao, listarSituacoesPorPrincipio } = await carregarDb();
    const principio = await criarPrincipio({
      nome: "Teste",
      fraseCentral: "",
      icone: "⭐",
      cor: "#000",
      pilar: "COMO_EU_ME_COMPORTO",
      valorSustentaId: null,
      significado: "",
      comportamentosQueFortalecem: [],
      comportamentosQueViolam: [],
      ambienteQuePrecisoConstruir: "",
      limites: "",
      regraDecisao: "",
      acaoPratica: "",
    });
    await criarSituacao({
      data: new Date().toISOString(),
      fato: "Fato",
      emocao: "Emoção",
      valorId: null,
      principioId: principio.id,
      decisao: "",
      acao: "",
      resultado: "",
      aprendizado: "",
      correcao: "",
      ambiente: "",
      coerente: true,
      classificacoes: ["EVIDENCIA_PRINCIPIO"],
    });
    const situacoes = await listarSituacoesPorPrincipio(principio.id);
    expect(situacoes).toHaveLength(1);
  });

  it("exporta e reimporta todos os dados preservando contagens", async () => {
    const { criarValor, exportarTudo, importarTudo, listarValores } = await carregarDb();
    await criarValor({
      nome: "Valor extra",
      objetivo: "",
      status: "EM_VALIDACAO",
      comportamentosQueDemonstram: [],
      comportamentosQueContradizem: [],
      conflitosComOutrosValores: "",
      aprendizados: "",
    });
    const exportado = await exportarTudo();
    expect(exportado.valores).toHaveLength(6);

    await importarTudo(exportado);
    const valoresAposImportar = await listarValores();
    expect(valoresAposImportar).toHaveLength(6);
  });
});

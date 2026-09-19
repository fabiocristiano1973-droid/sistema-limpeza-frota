import { describe, expect, it } from "vitest";
import {
  dataInputParaIso,
  formatarDataBR,
  formatarIntervaloSemana,
  inicioDaSemana,
  isoParaDataInput,
  mesmaSemana,
  nomeDiaSemana,
} from "../date";

describe("formatarDataBR", () => {
  it("formata como DD/MM/AAAA, nunca AAAA-MM-DD", () => {
    const data = new Date(2026, 8, 19); // 19/09/2026
    expect(formatarDataBR(data)).toBe("19/09/2026");
  });

  it("aceita string ISO", () => {
    expect(formatarDataBR("2026-01-05T12:00:00.000Z")).toMatch(/^\d{2}\/\d{2}\/2026$/);
  });

  it("retorna vazio para data inválida", () => {
    expect(formatarDataBR("não é data")).toBe("");
  });
});

describe("dataInputParaIso / isoParaDataInput", () => {
  it("faz ida e volta preservando o dia", () => {
    const iso = dataInputParaIso("2026-03-10");
    expect(isoParaDataInput(iso)).toBe("2026-03-10");
  });
});

describe("inicioDaSemana", () => {
  it("volta para a segunda-feira da mesma semana", () => {
    const quinta = new Date(2026, 8, 24); // 24/09/2026 é uma quinta
    const inicio = inicioDaSemana(quinta);
    expect(inicio.getDay()).toBe(1);
    expect(formatarDataBR(inicio)).toBe("21/09/2026");
  });

  it("trata domingo como fim da semana anterior (segunda-feira anterior)", () => {
    const domingo = new Date(2026, 8, 27); // 27/09/2026 é domingo
    const inicio = inicioDaSemana(domingo);
    expect(formatarDataBR(inicio)).toBe("21/09/2026");
  });
});

describe("mesmaSemana", () => {
  it("reconhece duas datas na mesma semana", () => {
    expect(mesmaSemana(new Date(2026, 8, 21), new Date(2026, 8, 25))).toBe(true);
  });

  it("reconhece datas em semanas diferentes", () => {
    expect(mesmaSemana(new Date(2026, 8, 21), new Date(2026, 8, 28))).toBe(false);
  });
});

describe("nomeDiaSemana / formatarIntervaloSemana", () => {
  it("retorna nome em português", () => {
    expect(nomeDiaSemana(0)).toBe("Domingo");
  });

  it("formata intervalo segunda a domingo em DD/MM/AAAA", () => {
    const inicio = new Date(2026, 8, 21).toISOString();
    expect(formatarIntervaloSemana(inicio)).toBe("21/09/2026 a 27/09/2026");
  });
});

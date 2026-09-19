import { describe, expect, it } from "vitest";
import { gerarICS } from "../ics";
import { CONFIGURACAO_LEMBRETES_PADRAO } from "../types";

describe("gerarICS", () => {
  it("gera um VCALENDAR válido com os três lembretes padrão", () => {
    const ics = gerarICS(CONFIGURACAO_LEMBRETES_PADRAO);
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("END:VCALENDAR");
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(3);
    expect(ics).toContain("Princípio do dia");
    expect(ics).toContain("Check-in noturno");
    expect(ics).toContain("Revisão semanal");
    expect(ics).toContain("FREQ=DAILY");
    expect(ics).toContain("FREQ=WEEKLY;BYDAY=SU");
  });

  it("omite lembretes desativados", () => {
    const ics = gerarICS({ ...CONFIGURACAO_LEMBRETES_PADRAO, noiteAtivo: false });
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics).not.toContain("Check-in noturno");
  });

  it("gera calendário vazio quando tudo está desativado", () => {
    const ics = gerarICS({
      ...CONFIGURACAO_LEMBRETES_PADRAO,
      manhaAtivo: false,
      noiteAtivo: false,
      semanalAtivo: false,
    });
    expect(ics).not.toContain("BEGIN:VEVENT");
  });
});

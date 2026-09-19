import type { ConfiguracaoLembretes } from "./types";

// Notificações agendadas diretamente pela PWA (Notification API sem push
// real) não são confiáveis no Android com o app fechado — o navegador pode
// suspender o timer a qualquer momento. Por isso a via confiável desta
// primeira versão é gerar um arquivo .ics com lembretes recorrentes
// (RRULE) que o usuário importa no calendário do próprio Android/Google.
// Uma versão futura com push real precisa de service worker + Push API +
// um backend que dispare o push (ver README).

interface LembreteDefinicao {
  uid: string;
  titulo: string;
  descricao: string;
  horario: string; // HH:mm
  diaSemanaICS?: string; // BYDAY (MO,TU,...) — omitido = todo dia
}

const DIA_ICS: Record<number, string> = {
  0: "SU",
  1: "MO",
  2: "TU",
  3: "WE",
  4: "TH",
  5: "FR",
  6: "SA",
};

function montarLembretes(config: ConfiguracaoLembretes): LembreteDefinicao[] {
  const lembretes: LembreteDefinicao[] = [];
  if (config.manhaAtivo) {
    lembretes.push({
      uid: "governo-interior-manha",
      titulo: "Governo Interior — Princípio do dia",
      descricao: "Qual princípio vai governar Fábio hoje?",
      horario: config.manhaHorario,
    });
  }
  if (config.noiteAtivo) {
    lembretes.push({
      uid: "governo-interior-noite",
      titulo: "Governo Interior — Check-in noturno",
      descricao: "Suas decisões de hoje revelaram quais princípios?",
      horario: config.noiteHorario,
    });
  }
  if (config.semanalAtivo) {
    lembretes.push({
      uid: "governo-interior-semanal",
      titulo: "Governo Interior — Revisão semanal",
      descricao: "É hora de revisar suas evidências da semana.",
      horario: config.semanalHorario,
      diaSemanaICS: DIA_ICS[config.semanalDiaSemana],
    });
  }
  return lembretes;
}

function formatarDataHoraICS(data: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${data.getFullYear()}${pad(data.getMonth() + 1)}${pad(data.getDate())}` +
    `T${pad(data.getHours())}${pad(data.getMinutes())}00`
  );
}

function proximaOcorrencia(horario: string, diaSemanaICS?: string): Date {
  const [h, m] = horario.split(":").map(Number);
  const agora = new Date();
  const alvo = new Date();
  alvo.setHours(h ?? 7, m ?? 0, 0, 0);

  if (diaSemanaICS) {
    const alvoIndice = Object.entries(DIA_ICS).find(([, v]) => v === diaSemanaICS)?.[0];
    const diaAlvo = alvoIndice ? Number(alvoIndice) : 0;
    while (alvo.getDay() !== diaAlvo || alvo <= agora) {
      alvo.setDate(alvo.getDate() + 1);
    }
    return alvo;
  }

  if (alvo <= agora) alvo.setDate(alvo.getDate() + 1);
  return alvo;
}

function escaparTextoICS(texto: string): string {
  return texto.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function gerarICS(config: ConfiguracaoLembretes): string {
  const lembretes = montarLembretes(config);
  const agoraStamp = formatarDataHoraICS(new Date());

  const eventos = lembretes.map((lembrete) => {
    const inicio = proximaOcorrencia(lembrete.horario, lembrete.diaSemanaICS);
    const fim = new Date(inicio.getTime() + 15 * 60 * 1000);
    const rrule = lembrete.diaSemanaICS ? `FREQ=WEEKLY;BYDAY=${lembrete.diaSemanaICS}` : "FREQ=DAILY";
    return [
      "BEGIN:VEVENT",
      `UID:${lembrete.uid}@governo-interior.local`,
      `DTSTAMP:${agoraStamp}`,
      `DTSTART:${formatarDataHoraICS(inicio)}`,
      `DTEND:${formatarDataHoraICS(fim)}`,
      `RRULE:${rrule}`,
      `SUMMARY:${escaparTextoICS(lembrete.titulo)}`,
      `DESCRIPTION:${escaparTextoICS(lembrete.descricao)}`,
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escaparTextoICS(lembrete.titulo)}`,
      "TRIGGER:PT0M",
      "END:VALARM",
      "END:VEVENT",
    ].join("\r\n");
  });

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Governo Interior//Principios em Acao//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...eventos,
    "END:VCALENDAR",
  ].join("\r\n");
}

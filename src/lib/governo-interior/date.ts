// Utilitários de data — o app SEMPRE mostra datas em DD/MM/AAAA para o
// usuário; ISO só circula internamente (armazenamento, ordenação).

export function formatarDataBR(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "";
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const ano = d.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

export function formatarDataHoraBR(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "";
  const hora = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${formatarDataBR(d)} ${hora}:${min}`;
}

/** Converte um valor digitado em input type="date" (AAAA-MM-DD) para ISO completo. */
export function dataInputParaIso(valor: string): string {
  if (!valor) return new Date().toISOString();
  const [ano, mes, dia] = valor.split("-").map(Number);
  return new Date(ano, (mes ?? 1) - 1, dia ?? 1, 12, 0, 0).toISOString();
}

/** Converte ISO para o formato aceito por input type="date" (AAAA-MM-DD). */
export function isoParaDataInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

/** Início (segunda-feira, 00:00 local) da semana que contém a data informada. */
export function inicioDaSemana(data: Date = new Date()): Date {
  const d = new Date(data);
  d.setHours(0, 0, 0, 0);
  const diaSemana = d.getDay(); // 0=domingo
  const deslocamento = diaSemana === 0 ? -6 : 1 - diaSemana; // volta até segunda
  d.setDate(d.getDate() + deslocamento);
  return d;
}

export function mesmaSemana(a: Date, b: Date): boolean {
  return inicioDaSemana(a).getTime() === inicioDaSemana(b).getTime();
}

const DIAS_SEMANA_PT = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

export function nomeDiaSemana(diaSemana: number): string {
  return DIAS_SEMANA_PT[diaSemana] ?? "";
}

export function formatarIntervaloSemana(inicioSemanaIso: string): string {
  const inicio = new Date(inicioSemanaIso);
  const fim = new Date(inicio);
  fim.setDate(fim.getDate() + 6);
  return `${formatarDataBR(inicio)} a ${formatarDataBR(fim)}`;
}

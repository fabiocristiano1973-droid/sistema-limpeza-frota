/** Data no calendário local (YYYY-MM-DD), evitando o desvio de fuso horário
 * que ocorre ao usar `.toISOString().slice(0, 10)` (que usa UTC). */
export function dataLocalISO(isoString: string): string {
  const d = new Date(isoString);
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

/** Formata uma data local YYYY-MM-DD (produzida por dataLocalISO) como DD/MM,
 * sem passar por Date/UTC — evita o mesmo problema de fuso ao exibir. */
export function formatarDiaMes(dataLocalYYYYMMDD: string): string {
  const [, mes, dia] = dataLocalYYYYMMDD.split("-");
  return `${dia}/${mes}`;
}

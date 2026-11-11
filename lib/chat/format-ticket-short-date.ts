/** Formata data no estilo do protótipo: "16 out". */
export function formatTicketShortDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const formatted = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "short",
  }).format(date);

  return formatted
    .replace(/\./g, "")
    .replace(/\s+de\s+/i, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

function toValidDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

/** Formata data no estilo do protótipo: "16 out". */
export function formatTicketShortDate(value: string | Date) {
  const date = toValidDate(value);
  if (!date) return "";

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

/** Aberto em no estilo do status card: "16 de out, 14:20". */
export function formatTicketOpenedAt(value: string | Date) {
  const date = toValidDate(value);
  if (!date) return "";

  const dayMonth = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "short",
  })
    .format(date)
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("pt-BR");

  const time = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  return `${dayMonth}, ${time}`;
}

/** Relativo pt-BR: "há 5 dias". */
export function formatTicketRelativeUpdate(
  value: string | Date,
  now = new Date(),
) {
  const date = toValidDate(value);
  if (!date) return "";

  const diffMs = date.getTime() - now.getTime();
  const absMs = Math.abs(diffMs);
  const rtf = new Intl.RelativeTimeFormat("pt-BR", { numeric: "always" });

  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (absMs < minute) return "agora";
  if (absMs < hour) return rtf.format(Math.round(diffMs / minute), "minute");
  if (absMs < day) return rtf.format(Math.round(diffMs / hour), "hour");
  return rtf.format(Math.round(diffMs / day), "day");
}

/** Última atualização no status card: "há 5 dias - prazo vencido". */
export function formatTicketLastUpdateLabel(
  value: string | Date,
  options?: { isOverdue?: boolean; now?: Date },
) {
  const relative = formatTicketRelativeUpdate(value, options?.now);
  if (!relative) return "";
  if (options?.isOverdue) return `${relative} - prazo vencido`;
  return relative;
}

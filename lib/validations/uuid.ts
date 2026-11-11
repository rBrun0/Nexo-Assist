const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function asOptionalTicketId(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed && UUID_RE.test(trimmed) ? trimmed : undefined;
}

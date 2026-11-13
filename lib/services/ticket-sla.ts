import { Priority } from "@prisma/client";

const WORKDAY_START_HOUR = 8;
const WORKDAY_END_HOUR = 18;
const SAO_PAULO_UTC_OFFSET_MS = 3 * 60 * 60 * 1000;

function moveToNextWorkday(date: Date) {
  date.setUTCDate(date.getUTCDate() + 1);
  date.setUTCHours(WORKDAY_START_HOUR, 0, 0, 0);

  while (date.getUTCDay() === 0 || date.getUTCDay() === 6) {
    date.setUTCDate(date.getUTCDate() + 1);
  }
}

function moveToBusinessHours(date: Date) {
  while (date.getUTCDay() === 0 || date.getUTCDay() === 6) {
    moveToNextWorkday(date);
  }

  if (date.getUTCHours() < WORKDAY_START_HOUR) {
    date.setUTCHours(WORKDAY_START_HOUR, 0, 0, 0);
  } else if (date.getUTCHours() >= WORKDAY_END_HOUR) {
    moveToNextWorkday(date);
  }
}

function addBusinessHours(start: Date, hoursToAdd: number) {
  const deadline = new Date(start);
  let remainingHours = hoursToAdd;

  while (remainingHours > 0) {
    moveToBusinessHours(deadline);

    const endOfWorkday = new Date(deadline);
    endOfWorkday.setUTCHours(WORKDAY_END_HOUR, 0, 0, 0);
    const availableHours =
      (endOfWorkday.getTime() - deadline.getTime()) / (60 * 60 * 1000);
    const hoursForCurrentDay = Math.min(remainingHours, availableHours);

    deadline.setTime(deadline.getTime() + hoursForCurrentDay * 60 * 60 * 1000);
    remainingHours -= hoursForCurrentDay;

    if (remainingHours > 0) moveToNextWorkday(deadline);
  }

  return deadline;
}

export function calculateSlaDeadline(
  priority: Priority,
  start = new Date()
) {
  if (priority === Priority.CRITICAL) {
    return new Date(start.getTime() + 60 * 60 * 1000);
  }

  const businessHoursByPriority: Partial<Record<Priority, number>> = {
    [Priority.HIGH]: 4,
    [Priority.MEDIUM]: 30,
    [Priority.LOW]: 50,
  };
  const businessHours = businessHoursByPriority[priority];

  if (businessHours === undefined) {
    throw new Error(`Prioridade sem SLA configurado: ${priority}`);
  }

  const saoPauloLocalDate = new Date(
    start.getTime() - SAO_PAULO_UTC_OFFSET_MS
  );
  const deadline = addBusinessHours(saoPauloLocalDate, businessHours);

  return new Date(deadline.getTime() + SAO_PAULO_UTC_OFFSET_MS);
}

/** Dias corridos de atraso. Zero quando o prazo ainda não venceu. */
export function daysPastDeadline(
  slaDeadline: Date | string | null | undefined,
  now = new Date(),
) {
  if (!slaDeadline) return 0;
  const deadline =
    slaDeadline instanceof Date ? slaDeadline : new Date(slaDeadline);
  if (Number.isNaN(deadline.getTime())) return 0;
  const elapsed = now.getTime() - deadline.getTime();
  if (elapsed <= 0) return 0;
  return Math.max(1, Math.ceil(elapsed / (24 * 60 * 60 * 1000)));
}

/** Overdue on-read: usa o flag persistido ou o prazo já vencido. */
export function isTicketOverdue(
  slaDeadline: Date | string | null | undefined,
  isOverdueFlag: boolean,
  now = new Date(),
) {
  if (isOverdueFlag) return true;
  if (!slaDeadline) return false;
  const deadline =
    slaDeadline instanceof Date ? slaDeadline : new Date(slaDeadline);
  if (Number.isNaN(deadline.getTime())) return false;
  return deadline.getTime() < now.getTime();
}

export function formatSlaArrivalLabel(iso: string, now = new Date()) {
  const deadline = new Date(iso);
  if (Number.isNaN(deadline.getTime())) return "";

  const time = deadline.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const sameCalendarDay =
    deadline.toLocaleDateString("pt-BR") === now.toLocaleDateString("pt-BR");

  if (sameCalendarDay) {
    return `A resposta chega até ${time}`;
  }

  const date = deadline.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
  return `A resposta chega até ${date}, ${time}`;
}

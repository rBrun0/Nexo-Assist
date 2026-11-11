import { describe, expect, it } from "@jest/globals";

import { Priority } from "@prisma/client";

import {
  calculateSlaDeadline,
  formatSlaArrivalLabel,
  isTicketOverdue,
} from "./ticket-sla";

describe("calculateSlaDeadline", () => {
  it("calcula uma hora corrida para prioridade crítica", () => {
    const start = new Date("2026-11-09T12:00:00.000Z");
    expect(calculateSlaDeadline(Priority.CRITICAL, start).toISOString()).toBe(
      "2026-11-09T13:00:00.000Z"
    );
  });

  it("calcula quatro horas úteis para prioridade alta", () => {
    const mondayAtNineSaoPaulo = new Date("2026-11-09T12:00:00.000Z");
    expect(
      calculateSlaDeadline(Priority.HIGH, mondayAtNineSaoPaulo).toISOString()
    ).toBe("2026-11-09T16:00:00.000Z");
  });

  it("pula o fim de semana ao calcular horas úteis", () => {
    const fridayAtFourSaoPaulo = new Date("2026-11-06T19:00:00.000Z");
    expect(
      calculateSlaDeadline(Priority.HIGH, fridayAtFourSaoPaulo).toISOString()
    ).toBe("2026-11-09T13:00:00.000Z");
  });

  it("converte três dias úteis de prazo médio", () => {
    const mondayAtNineSaoPaulo = new Date("2026-11-09T12:00:00.000Z");
    expect(
      calculateSlaDeadline(Priority.MEDIUM, mondayAtNineSaoPaulo).toISOString()
    ).toBe("2026-11-12T12:00:00.000Z");
  });

  it("converte cinco dias úteis de prazo baixo", () => {
    const mondayAtNineSaoPaulo = new Date("2026-11-09T12:00:00.000Z");
    expect(
      calculateSlaDeadline(Priority.LOW, mondayAtNineSaoPaulo).toISOString()
    ).toBe("2026-11-16T12:00:00.000Z");
  });
});

describe("isTicketOverdue", () => {
  it("respeita o flag persistido e o prazo vencido", () => {
    const now = new Date("2026-11-09T12:00:00.000Z");
    expect(isTicketOverdue(null, true, now)).toBe(true);
    expect(
      isTicketOverdue(new Date("2026-11-09T11:00:00.000Z"), false, now),
    ).toBe(true);
    expect(
      isTicketOverdue(new Date("2026-11-09T13:00:00.000Z"), false, now),
    ).toBe(false);
  });
});

describe("formatSlaArrivalLabel", () => {
  it("usa só o horário quando o prazo é no mesmo dia", () => {
    const iso = "2026-11-09T16:00:00.000Z";
    const now = new Date("2026-11-09T12:00:00.000Z");
    const label = formatSlaArrivalLabel(iso, now);
    expect(label.startsWith("A resposta chega até ")).toBe(true);
    expect(label).not.toMatch(/\d{2}\/\d{2}/);
  });

  it("inclui data quando o prazo é em outro dia", () => {
    const iso = "2026-11-12T12:00:00.000Z";
    const now = new Date("2026-11-09T12:00:00.000Z");
    expect(formatSlaArrivalLabel(iso, now)).toMatch(
      /^A resposta chega até \d{2}\/\d{2}, \d{2}:\d{2}$/
    );
  });
});

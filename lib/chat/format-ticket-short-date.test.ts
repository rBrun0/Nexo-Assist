import { describe, expect, it } from "@jest/globals";

import {
  formatTicketLastUpdateLabel,
  formatTicketOpenedAt,
  formatTicketRelativeUpdate,
  formatTicketShortDate,
} from "./format-ticket-short-date";

describe("formatTicketShortDate", () => {
  it("formata no estilo compacto pt-BR (16 out)", () => {
    expect(formatTicketShortDate("2026-10-16T15:00:00.000Z")).toMatch(
      /^16\s+out$/,
    );
  });

  it("aceita Date e ignora inválidos", () => {
    expect(formatTicketShortDate(new Date("2026-01-05T12:00:00.000Z"))).toMatch(
      /^5\s+jan$/,
    );
    expect(formatTicketShortDate("não-é-data")).toBe("");
  });
});

describe("formatTicketOpenedAt", () => {
  it('formata no estilo "16 de out, 14:20"', () => {
    expect(formatTicketOpenedAt("2026-10-16T17:20:00.000Z")).toMatch(
      /^16 de out, \d{2}:\d{2}$/,
    );
  });

  it("ignora inválidos", () => {
    expect(formatTicketOpenedAt("não-é-data")).toBe("");
  });
});

describe("formatTicketLastUpdateLabel", () => {
  const now = new Date("2026-10-21T15:00:00.000Z");

  it("mostra relativo em dias", () => {
    expect(
      formatTicketRelativeUpdate("2026-10-16T15:00:00.000Z", now),
    ).toBe("há 5 dias");
  });

  it("anexa prazo vencido quando overdue", () => {
    expect(
      formatTicketLastUpdateLabel("2026-10-16T15:00:00.000Z", {
        isOverdue: true,
        now,
      }),
    ).toBe("há 5 dias - prazo vencido");
  });

  it("não anexa prazo quando no prazo", () => {
    expect(
      formatTicketLastUpdateLabel("2026-10-16T15:00:00.000Z", {
        isOverdue: false,
        now,
      }),
    ).toBe("há 5 dias");
  });
});

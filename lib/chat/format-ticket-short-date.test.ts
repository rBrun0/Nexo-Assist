import { describe, expect, it } from "@jest/globals";

import { formatTicketShortDate } from "./format-ticket-short-date";

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

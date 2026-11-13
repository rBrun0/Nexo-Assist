import { describe, expect, it } from "@jest/globals";

import {
  HANDOFF_FIRST_CONTACT_MS,
  formatHandoffUntil,
} from "./format-handoff-until";

const handoffAt = "2026-11-13T12:00:00.000Z";
const start = new Date(handoffAt).getTime();

describe("formatHandoffUntil", () => {
  it("mostra a janela cheia de 2 h no instante do transbordo", () => {
    expect(formatHandoffUntil(handoffAt, start)).toBe("2 h");
  });

  it("mostra horas e minutos restantes", () => {
    expect(formatHandoffUntil(handoffAt, start + 40 * 60_000)).toBe(
      "1 h 20 min",
    );
  });

  it("mostra só minutos quando falta menos de 1 h", () => {
    expect(formatHandoffUntil(handoffAt, start + 75 * 60_000)).toBe("45 min");
  });

  it("marca prazo vencido no fim da janela", () => {
    expect(
      formatHandoffUntil(handoffAt, start + HANDOFF_FIRST_CONTACT_MS),
    ).toBe("prazo vencido");
    expect(
      formatHandoffUntil(handoffAt, start + HANDOFF_FIRST_CONTACT_MS + 60_000),
    ).toBe("prazo vencido");
  });

  it("ignora ausente ou inválido", () => {
    expect(formatHandoffUntil(null)).toBeNull();
    expect(formatHandoffUntil("não-é-data")).toBeNull();
  });
});

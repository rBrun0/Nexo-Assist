import { describe, expect, it } from "@jest/globals";

import { formatQueueTime } from "./format-queue-time";

describe("formatQueueTime", () => {
  const now = new Date("2026-11-12T15:00:00.000Z").getTime();

  it("mostra agora para menos de 1 minuto", () => {
    expect(
      formatQueueTime(new Date(now - 30_000).toISOString(), now),
    ).toBe("agora");
  });

  it("mostra horário no mesmo dia", () => {
    const iso = new Date(now - 5 * 60_000).toISOString();
    const label = formatQueueTime(iso, now);
    expect(label).not.toBe("agora");
    expect(label).not.toBe("ontem");
    expect(label).toMatch(/\d{2}:\d{2}/);
  });

  it("mostra ontem", () => {
    const yesterday = new Date(now - 24 * 60 * 60_000);
    expect(formatQueueTime(yesterday.toISOString(), now)).toBe("ontem");
  });

  it("mostra dd/MM para dias anteriores", () => {
    const older = new Date("2026-11-01T12:00:00.000Z");
    expect(formatQueueTime(older.toISOString(), now)).toMatch(/\d{2}\/\d{2}/);
  });
});

import { describe, expect, it } from "@jest/globals";

import {
  clampConfidenceScore,
  confidenceBarFillClass,
  resolveConfidenceBarTone,
} from "./confidence-bar";

describe("resolveConfidenceBarTone", () => {
  it("prioriza a banda explícita", () => {
    expect(resolveConfidenceBarTone({ band: "high", score: 10 })).toBe("high");
    expect(resolveConfidenceBarTone({ band: "low", score: 99 })).toBe("low");
  });

  it("deriva a banda do score", () => {
    expect(resolveConfidenceBarTone({ score: 40 })).toBe("low");
    expect(resolveConfidenceBarTone({ score: 65 })).toBe("medium");
    expect(resolveConfidenceBarTone({ score: 88 })).toBe("high");
  });
});

describe("confidenceBarFillClass", () => {
  it("mapeia cores por tom", () => {
    expect(confidenceBarFillClass("high")).toContain("emerald");
    expect(confidenceBarFillClass("medium")).toContain("amber");
    expect(confidenceBarFillClass("low")).toContain("rose");
  });
});

describe("clampConfidenceScore", () => {
  it("limita entre 0 e 100", () => {
    expect(clampConfidenceScore(-5)).toBe(0);
    expect(clampConfidenceScore(140)).toBe(100);
    expect(clampConfidenceScore(72.6)).toBe(73);
  });
});

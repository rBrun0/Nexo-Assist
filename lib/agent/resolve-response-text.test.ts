import { describe, expect, it } from "@jest/globals";

import {
  HONEST_EMPTY_AGENT_REPLY,
  pickAssistantResponseText,
  shouldRetryWithoutTools,
} from "./resolve-response-text";

describe("shouldRetryWithoutTools", () => {
  it("repete sem tools quando não houve texto nem ações", () => {
    expect(shouldRetryWithoutTools("", 0)).toBe(true);
    expect(shouldRetryWithoutTools("   ", 0)).toBe(true);
  });

  it("não repete se já há texto ou tools executadas", () => {
    expect(shouldRetryWithoutTools("Olá", 0)).toBe(false);
    expect(shouldRetryWithoutTools("", 1)).toBe(false);
  });
});

describe("pickAssistantResponseText", () => {
  it("prioriza o texto da primeira passagem", () => {
    expect(
      pickAssistantResponseText({
        primaryText: " Posso ajudar com TI. ",
        retryText: "retry",
      })
    ).toEqual({ text: "Posso ajudar com TI.", source: "primary" });
  });

  it("usa o retry quando a primeira passagem veio vazia", () => {
    expect(
      pickAssistantResponseText({
        primaryText: "",
        retryText: " Olá! Em que posso ajudar? ",
      })
    ).toEqual({ text: "Olá! Em que posso ajudar?", source: "retry" });
  });

  it("usa mensagem honesta quando primary e retry falham", () => {
    expect(pickAssistantResponseText({ primaryText: "" })).toEqual({
      text: HONEST_EMPTY_AGENT_REPLY,
      source: "fallback",
    });
    expect(
      pickAssistantResponseText({ primaryText: "  ", retryText: "   " })
    ).toEqual({
      text: HONEST_EMPTY_AGENT_REPLY,
      source: "fallback",
    });
  });
});

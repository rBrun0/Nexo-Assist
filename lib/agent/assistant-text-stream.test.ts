import { describe, expect, it } from "@jest/globals";

import {
  ASSISTANT_TEXT_PART_ID,
  classifyAgentChunk,
  createAssistantTextEncoder,
  forwardAgentChunk,
} from "@/lib/agent/assistant-text-stream";

describe("texto do stream do agente", () => {
  it("abre, envia e fecha o texto com o mesmo id", () => {
    const encoder = createAssistantTextEncoder();

    encoder.push("Olá");
    encoder.sync("Olá. Encaminhei a conversa para um analista.");

    expect(encoder.drain()).toEqual([
      { type: "text-start", id: ASSISTANT_TEXT_PART_ID },
      { type: "text-delta", id: ASSISTANT_TEXT_PART_ID, delta: "Olá" },
      {
        type: "text-delta",
        id: ASSISTANT_TEXT_PART_ID,
        delta: ". Encaminhei a conversa para um analista.",
      },
      { type: "text-end", id: ASSISTANT_TEXT_PART_ID },
    ]);
  });

  it("escreve o fallback inteiro quando o modelo não mandou texto", () => {
    const encoder = createAssistantTextEncoder();

    encoder.sync("Não consegui gerar uma resposta agora. Tente de novo.");

    expect(encoder.drain().map((chunk) => chunk.type)).toEqual([
      "text-start",
      "text-delta",
      "text-end",
    ]);
  });

  it("descarta chunk inválido e não reescreve o texto cru do modelo", () => {
    const invalidToolChunk = { type: "tool-input-start", id: "call-1" };

    expect(classifyAgentChunk(invalidToolChunk)).toBe("forward");
    expect(forwardAgentChunk(invalidToolChunk, false)).toBeNull();
    expect(
      forwardAgentChunk({ type: "text-delta", id: "m1", delta: "Oi" }, true),
    ).toBeNull();
    expect(
      forwardAgentChunk(
        {
          type: "data-progress",
          data: { message: "Consultando seus chamados..." },
          transient: true,
        },
        true,
      ),
    ).toEqual({
      type: "data-progress",
      data: { message: "Consultando seus chamados..." },
      transient: true,
    });
  });
});

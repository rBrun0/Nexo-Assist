import { describe, expect, it } from "@jest/globals";

import {
  analystConversationActionSchema,
  employeeConversationActionSchema,
  employeeMessageSchema,
} from "./conversation";

describe("employeeMessageSchema", () => {
  it("normaliza uma mensagem válida e aceita ticket selecionado", () => {
    const result = employeeMessageSchema.safeParse({
      message: "  Meu notebook não liga.  ",
      selectedTicketId: "a7f33a32-0370-4b79-bc5f-3fbc1df4176e",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.message).toBe("Meu notebook não liga.");
    }
  });

  it.each(["", "   "])("rejeita mensagem vazia (%j)", (message) => {
    expect(employeeMessageSchema.safeParse({ message }).success).toBe(false);
  });

  it("rejeita mensagens acima do limite", () => {
    expect(
      employeeMessageSchema.safeParse({ message: "x".repeat(4001) }).success
    ).toBe(false);
  });

  it("rejeita identificador de chamado que não seja UUID", () => {
    expect(
      employeeMessageSchema.safeParse({
        message: "Preciso de ajuda.",
        selectedTicketId: "ticket-invalido",
      }).success
    ).toBe(false);
  });
});

describe("employeeConversationActionSchema", () => {
  it("aceita encerrar a conversa pelo funcionário", () => {
    expect(
      employeeConversationActionSchema.safeParse({
        action: "end_conversation",
      }).success,
    ).toBe(true);
  });

  it("aceita solicitação de analista", () => {
    expect(
      employeeConversationActionSchema.safeParse({
        action: "request_analyst",
      }).success,
    ).toBe(true);
    expect(
      employeeConversationActionSchema.safeParse({
        action: "request_analyst",
        reason: "Limite de mensagens atingido.",
      }).success,
    ).toBe(true);
  });
});

describe("analystConversationActionSchema", () => {
  it.each(["claim", "return_to_bot", "close"] as const)(
    "aceita a ação %s sem campos extras",
    (action) => {
      expect(analystConversationActionSchema.safeParse({ action }).success).toBe(
        true
      );
    }
  );

  it("aceita envio de mensagem preenchido", () => {
    expect(
      analystConversationActionSchema.safeParse({
        action: "send_message",
        message: "Estou verificando o chamado.",
      }).success
    ).toBe(true);
  });

  it("rejeita mensagem vazia, longa ou ação desconhecida", () => {
    expect(
      analystConversationActionSchema.safeParse({
        action: "send_message",
        message: " ",
      }).success
    ).toBe(false);
    expect(
      analystConversationActionSchema.safeParse({
        action: "send_message",
        message: "x".repeat(4001),
      }).success
    ).toBe(false);
    expect(
      analystConversationActionSchema.safeParse({ action: "transfer" }).success
    ).toBe(false);
  });
});

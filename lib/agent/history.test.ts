import { describe, expect, it } from "@jest/globals";
import { MessageSender } from "@prisma/client";

import { mapConversationHistory } from "./history";

describe("mapConversationHistory", () => {
  it("preserva mensagens do funcionário, agente e analista na ordem", () => {
    expect(
      mapConversationHistory([
        { sender: MessageSender.EMPLOYEE, content: "Não consigo acessar." },
        { sender: MessageSender.ASSISTANT, content: "Vou verificar." },
        { sender: MessageSender.ANALYST, content: "Reiniciei seu acesso." },
        { sender: MessageSender.EMPLOYEE, content: "Agora funcionou." },
      ])
    ).toEqual([
      { role: "user", content: "Não consigo acessar." },
      { role: "assistant", content: "Vou verificar." },
      { role: "assistant", content: "Reiniciei seu acesso." },
      { role: "user", content: "Agora funcionou." },
    ]);
  });

  it("não inclui mensagens de sistema no contexto do modelo", () => {
    expect(
      mapConversationHistory([
        { sender: MessageSender.SYSTEM, content: "Evento de sistema." },
      ])
    ).toEqual([]);
  });
});

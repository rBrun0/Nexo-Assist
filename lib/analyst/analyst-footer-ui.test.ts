import { describe, expect, it } from "@jest/globals";

import { getAnalystFooterUi } from "./analyst-footer-ui";

const me = "analyst-me";
const other = "analyst-other";

describe("getAnalystFooterUi", () => {
  it("na fila: Assumir e Devolver; sem composer", () => {
    const ui = getAnalystFooterUi({
      status: "Aguardando",
      assignedAnalystId: null,
      currentAnalystId: me,
    });

    expect(ui.showWaitingBanner).toBe(true);
    expect(ui.showClaimAction).toBe(true);
    expect(ui.showReturnAction).toBe(true);
    expect(ui.showAssignedToolbar).toBe(false);
    expect(ui.canCompose).toBe(false);
    expect(ui.placeholder).toBe("Assuma a conversa para responder");
  });

  it("em atendimento meu: devolver e composer; sem Assumir", () => {
    const ui = getAnalystFooterUi({
      status: "Em atendimento",
      assignedAnalystId: me,
      currentAnalystId: me,
    });

    expect(ui.showWaitingBanner).toBe(false);
    expect(ui.showClaimAction).toBe(false);
    expect(ui.showReturnAction).toBe(true);
    expect(ui.showAssignedToolbar).toBe(true);
    expect(ui.canCompose).toBe(true);
    expect(ui.placeholder).toBe("Escreva sua resposta...");
  });

  it("em atendimento de outro analista: nem devolver nem composer", () => {
    const ui = getAnalystFooterUi({
      status: "Em atendimento",
      assignedAnalystId: other,
      currentAnalystId: me,
    });

    expect(ui.showClaimAction).toBe(false);
    expect(ui.showReturnAction).toBe(false);
    expect(ui.showAssignedToolbar).toBe(false);
    expect(ui.canCompose).toBe(false);
    expect(ui.placeholder).toBe("Somente o analista atribuído pode responder.");
  });

  it("com o agente: não sugere assumir no placeholder", () => {
    const ui = getAnalystFooterUi({
      status: "Com o agente",
      assignedAnalystId: null,
      currentAnalystId: me,
    });

    expect(ui.showClaimAction).toBe(false);
    expect(ui.showReturnAction).toBe(false);
    expect(ui.canCompose).toBe(false);
    expect(ui.placeholder).toBe("O Nexo Assist ainda está atendendo.");
  });
});

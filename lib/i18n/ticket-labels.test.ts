import {
  formatTicketCategoryLabel,
  formatTicketPriorityLabel,
  formatTicketStatusLabel,
  formatTicketTypeLabel,
  getTicketStatusTone,
} from "@/lib/i18n/ticket-labels";

describe("ticket labels", () => {
  it("traduz enums para portugues", () => {
    expect(formatTicketStatusLabel("APPROVED")).toBe("Aprovado");
    expect(formatTicketStatusLabel("WAITING_ANALYST")).toBe(
      "Aguardando analista",
    );
    expect(formatTicketPriorityLabel("LOW")).toBe("Baixa");
    expect(formatTicketPriorityLabel("CRITICAL", { withSla: true })).toContain(
      "Crítica",
    );
    expect(formatTicketCategoryLabel("NETWORK_VPN")).toBe("Rede e VPN");
    expect(formatTicketTypeLabel("REQUEST")).toBe("Requisição (REQ)");
  });

  it("mapeia status para tom semantico", () => {
    expect(getTicketStatusTone("OPEN")).toBe("primary");
    expect(getTicketStatusTone("IN_PROGRESS")).toBe("primary");
    expect(getTicketStatusTone("WAITING_ANALYST")).toBe("warning");
    expect(getTicketStatusTone("RESOLVED")).toBe("success");
    expect(getTicketStatusTone("APPROVED")).toBe("success");
  });
});

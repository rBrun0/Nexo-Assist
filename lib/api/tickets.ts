import { getJson, patchJson } from "@/lib/api/http";
import type { EmployeeTicket } from "@/lib/types/employee-conversation";

export async function listMyTickets() {
  const result = await getJson<{ tickets: EmployeeTicket[] }>("/api/tickets", {
    fallbackError: "Não foi possível carregar os chamados.",
  });
  return result.tickets ?? [];
}

export async function updateTicketStatus(ticketId: string, status: string) {
  await patchJson(
    `/api/tickets/${ticketId}`,
    { status },
    { fallbackError: "Não foi possível atualizar o chamado." },
  );
}

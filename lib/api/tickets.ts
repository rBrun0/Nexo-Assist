import { AppErrors, ok, type Result } from "@/lib/errors";
import { getJson, patchJson } from "@/lib/api/http";
import type { EmployeeTicket } from "@/lib/types/employee-conversation";

export async function listMyTickets(): Promise<Result<EmployeeTicket[]>> {
  const result = await getJson<{ tickets: EmployeeTicket[] }>("/api/tickets", {
    fallbackError: AppErrors.loadTicketsFailed,
  });

  if (!result.success) {
    return result;
  }

  return ok(result.data.tickets ?? []);
}

export async function updateTicketStatus(
  ticketId: string,
  status: string,
): Promise<Result<unknown>> {
  return patchJson(
    `/api/tickets/${ticketId}`,
    { status },
    { fallbackError: AppErrors.updateTicketFailed },
  );
}

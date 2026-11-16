import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { unstable_rethrow } from "next/navigation";
import { NextResponse } from "next/server";

import type { ServiceDeskUIMessage } from "@/lib/agent/run-service-desk-agent";
import { runServiceDeskAgent } from "@/lib/agent/run-service-desk-agent";
import { requireUser } from "@/lib/auth/session";
import { AppErrors, jsonError } from "@/lib/errors";
import {
  cancelTicketDraft,
  createEmployeeMessage,
  createTicketFromDraft,
  endEmployeeConversation,
  getEmployeeConversation,
  requestAnalystHandoff,
} from "@/lib/services/conversations";
import {
  employeeConversationActionSchema,
  employeeMessageSchema,
} from "@/lib/validations/conversation";

export async function GET() {
  try {
    const userResult = await requireUser("EMPLOYEE");
    if (!userResult.success) {
      return jsonError(userResult.error);
    }

    return NextResponse.json({
      conversation: await getEmployeeConversation(userResult.data.id),
    });
  } catch (error) {
    unstable_rethrow(error);
    console.error("Falha ao carregar conversa do funcionário:", error);
    return jsonError(AppErrors.loadConversationFailed);
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(AppErrors.invalidRequestBody);
  }

  try {
    const userResult = await requireUser("EMPLOYEE");
    if (!userResult.success) {
      return jsonError(userResult.error);
    }
    const user = userResult.data;

    if (typeof body === "object" && body !== null && "action" in body) {
      try {
        const action = employeeConversationActionSchema.safeParse(body);
        if (!action.success) {
          return jsonError(AppErrors.invalidConversationAction);
        }

        if (action.data.action === "request_analyst") {
          const handoff = await requestAnalystHandoff(
            user.id,
            action.data.reason ??
              "Funcionário solicitou atendimento humano pelo limite da conversa.",
          );
          if (!handoff.success) {
            return jsonError(handoff.error);
          }
          return NextResponse.json({ conversation: handoff.data });
        }

        if (action.data.action === "end_conversation") {
          const ended = await endEmployeeConversation(user.id);
          if (!ended.success) {
            return jsonError(ended.error);
          }
          return NextResponse.json({ conversation: null });
        }

        if (action.data.action === "cancel_ticket") {
          const cancelled = await cancelTicketDraft(user.id, action.data.draftMessageId);
          if (!cancelled.success) {
            return jsonError(cancelled.error);
          }
        } else {
          const confirmed = await createTicketFromDraft(user.id, action.data.draftMessageId);
          if (!confirmed.success) {
            return jsonError(confirmed.error);
          }
        }
        const conversation = await getEmployeeConversation(user.id);
        if (!conversation) {
          return jsonError(AppErrors.conversationNotFound);
        }
        return NextResponse.json({ conversation });
      } catch (error) {
        unstable_rethrow(error);
        console.error("Falha ao executar ação da conversa:", error);
        const actionName =
          typeof body === "object" &&
          body !== null &&
          "action" in body &&
          typeof body.action === "string"
            ? body.action
            : "";
        if (actionName === "confirm_ticket") {
          return jsonError(AppErrors.confirmTicketFailed);
        }
        if (actionName === "cancel_ticket") {
          return jsonError(AppErrors.cancelDraftFailed);
        }
        if (actionName === "request_analyst") {
          return jsonError(AppErrors.requestAnalystFailed);
        }
        if (actionName === "end_conversation") {
          return jsonError(AppErrors.endConversationFailed);
        }
        return jsonError(AppErrors.confirmTicketFailed);
      }
    }

    const parsed = employeeMessageSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(AppErrors.invalidMessage, {
        issues: parsed.error.issues,
      });
    }

    const created = await createEmployeeMessage(
      user.id,
      parsed.data.message,
      parsed.data.selectedTicketId,
    );
    if (!created.success) {
      return jsonError(created.error);
    }
    const { session, shouldRunAgent } = created.data;

    console.info("[conversa] POST mensagem", {
      conversationId: session.id,
      status: session.status,
      shouldRunAgent,
    });

    if (shouldRunAgent) {
      const agentResponse = await runServiceDeskAgent({
        userId: user.id,
        userEmail: user.email,
        conversationId: session.id,
        selectedTicketId: parsed.data.selectedTicketId,
      });
      if (agentResponse) return agentResponse;
      console.info("[conversa] agente não gerou stream", {
        conversationId: session.id,
        status: session.status,
        motivo: "runServiceDeskAgent retornou null (sessão não está BOT_ACTIVE)",
      });
    } else {
      console.info("[conversa] agente pulado", {
        conversationId: session.id,
        status: session.status,
        motivo:
          session.status === "BOT_ACTIVE" ? "shouldRunAgent falso" : `status ${session.status}`,
      });
    }

    const stream = createUIMessageStream<ServiceDeskUIMessage>({
      execute: ({ writer }) => {
        writer.write({ type: "start" });
        writer.write({
          type: "data-progress",
          data: {
            message: "Sua mensagem foi recebida pela conversa.",
            phase: "complete",
          },
          transient: true,
        });
        writer.write({ type: "finish" });
        writer.setOutcome({ status: "completed" });
      },
    });
    return createUIMessageStreamResponse({ stream });
  } catch (error) {
    unstable_rethrow(error);
    console.error("Falha ao processar mensagem da conversa:", error);
    return jsonError(AppErrors.agentProcessingFailed);
  }
}

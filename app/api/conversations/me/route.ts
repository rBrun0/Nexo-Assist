import { NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
} from "ai";

import type { ServiceDeskUIMessage } from "@/lib/agent/run-service-desk-agent";
import { runServiceDeskAgent } from "@/lib/agent/run-service-desk-agent";
import { AuthSessionError, requireUser } from "@/lib/auth/session";
import {
  ConversationError,
  createEmployeeMessage,
  cancelTicketDraft,
  createTicketFromDraft,
  endEmployeeConversation,
  getEmployeeConversation,
  requestAnalystHandoff,
} from "@/lib/services/conversations";
import { employeeMessageSchema, employeeConversationActionSchema } from "@/lib/validations/conversation";

export async function GET() {
  try {
    const user = await requireUser("EMPLOYEE");
    return NextResponse.json({
      conversation: await getEmployeeConversation(user.id),
    });
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof AuthSessionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("Falha ao carregar conversa do funcionário:", error);
    return NextResponse.json({ error: "Não foi possível carregar a conversa." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  try {
    const user = await requireUser("EMPLOYEE");

    if (
      typeof body === "object" &&
      body !== null &&
      "action" in body
    ) {
      const action = employeeConversationActionSchema.safeParse(body);
      if (!action.success) {
        return NextResponse.json({ error: "Ação de conversa inválida." }, { status: 400 });
      }

      if (action.data.action === "request_analyst") {
        return NextResponse.json({
          conversation: await requestAnalystHandoff(
            user.id,
            action.data.reason ??
              "Funcionário solicitou atendimento humano pelo limite da conversa.",
          ),
        });
      }

      if (action.data.action === "end_conversation") {
        await endEmployeeConversation(user.id);
        return NextResponse.json({ conversation: null });
      }

      if (action.data.action === "cancel_ticket") {
        await cancelTicketDraft(user.id, action.data.draftMessageId);
      } else {
        await createTicketFromDraft(user.id, action.data.draftMessageId);
      }
      const conversation = await getEmployeeConversation(user.id);
      if (!conversation) {
        return NextResponse.json(
          { error: "Conversa não encontrada." },
          { status: 404 },
        );
      }
      return NextResponse.json({ conversation });
    }

    const parsed = employeeMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "A mensagem é inválida.", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { session, shouldRunAgent } = await createEmployeeMessage(
      user.id,
      parsed.data.message,
      parsed.data.selectedTicketId
    );

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
          session.status === "BOT_ACTIVE"
            ? "shouldRunAgent falso"
            : `status ${session.status}`,
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
    if (error instanceof AuthSessionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    if (error instanceof ConversationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error("Falha ao processar mensagem da conversa:", error);
    return NextResponse.json(
      { error: "Sua mensagem foi recebida, mas o agente não conseguiu processá-la. Tente novamente." },
      { status: 503 }
    );
  }
}

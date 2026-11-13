"use server";

import { AuthSessionError, requireUser } from "@/lib/auth/session";
import {
  AgentFeedbackError,
  submitAgentFeedback,
} from "@/lib/services/agent-feedback";
import { submitAgentFeedbackSchema } from "@/lib/validations/agent-feedback";

export async function submitAgentFeedbackAction(input: unknown) {
  const parsed = submitAgentFeedbackSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "Informe uma mensagem válida para o feedback.",
    };
  }

  try {
    const user = await requireUser();
    const feedback = await submitAgentFeedback({
      userId: user.id,
      role: user.role,
      messageId: parsed.data.messageId,
      note: parsed.data.note,
    });
    return {
      success: true as const,
      feedback: {
        id: feedback.id,
        createdAt: feedback.createdAt.toISOString(),
      },
    };
  } catch (error) {
    if (error instanceof AuthSessionError) {
      return { success: false as const, error: error.message };
    }
    if (error instanceof AgentFeedbackError) {
      return { success: false as const, error: error.message };
    }

    console.error("Falha ao registrar feedback do agente:", error);
    return {
      success: false as const,
      error: "Não foi possível registrar o feedback.",
    };
  }
}

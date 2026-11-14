"use server";

import { requireUser } from "@/lib/auth/session";
import { AppErrors } from "@/lib/errors";
import { submitAgentFeedback } from "@/lib/services/agent-feedback";
import { submitAgentFeedbackSchema } from "@/lib/validations/agent-feedback";

export async function submitAgentFeedbackAction(input: unknown) {
  const parsed = submitAgentFeedbackSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: AppErrors.invalidAgentFeedbackInput.message,
    };
  }

  try {
    const userResult = await requireUser();
    if (!userResult.success) {
      return { success: false as const, error: userResult.error.message };
    }
    const user = userResult.data;

    const feedbackResult = await submitAgentFeedback({
      userId: user.id,
      role: user.role,
      messageId: parsed.data.messageId,
      note: parsed.data.note,
    });
    if (!feedbackResult.success) {
      return { success: false as const, error: feedbackResult.error.message };
    }

    return {
      success: true as const,
      feedback: {
        id: feedbackResult.data.id,
        createdAt: feedbackResult.data.createdAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("Falha ao registrar feedback do agente:", error);
    return {
      success: false as const,
      error: AppErrors.agentFeedbackFailed.message,
    };
  }
}

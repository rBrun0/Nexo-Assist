import "server-only";

import { RequestContext } from "@mastra/core/request-context";
import { toAISdkStream } from "@mastra/ai-sdk";
import { ChatStatus, Prisma } from "@prisma/client";
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  uiMessageChunkSchema,
  type UIMessage,
} from "ai";

import {
  classifyAgentChunk,
  createAssistantTextEncoder,
  readAgentTextDelta,
  type AssistantTextEncoder,
} from "@/lib/agent/assistant-text-stream";
import { buildAssistantMetadata } from "@/lib/agent/build-assistant-metadata";
import {
  buildPublicRationale,
  LOW_CONFIDENCE_THRESHOLD,
  recordReplyWithoutTools,
} from "@/lib/agent/confidence";
import {
  formatAgentError,
  logAgentError,
} from "@/lib/agent/format-agent-error";
import { mapConversationHistory } from "@/lib/agent/history";
import {
  pickAssistantResponseText,
  shouldRetryWithoutTools,
} from "@/lib/agent/resolve-response-text";
import type { AgentAssessment, ToolAction } from "@/lib/agent/tools";
import type { AgentProgressPayload } from "@/lib/agent/activity";
import { getMastra } from "@/lib/mastra/instance";
import { classifyTurnAgent } from "@/lib/mastra/agents/classify-turn";
import {
  serviceDeskAgent,
  serviceDeskModelId,
} from "@/lib/mastra/agents/service-desk";
import {
  actionFromToolOutput,
  applyToolEvidence,
  runningLabelForTool,
} from "@/lib/mastra/apply-tool-result";
import { handoffReasonForTurn } from "@/lib/mastra/handoff-from-step";
import {
  confidenceBand,
  fallbackDecision,
  reconcileConfidence,
} from "@/lib/mastra/reconcile-decision";
import { agentDecisionSchema } from "@/lib/mastra/schemas/decision";
import {
  getEmployeeTicketsForAgent,
  markSessionWaitingHuman,
  saveAssistantMessage,
} from "@/lib/services/conversations";
import { prisma } from "@/lib/prisma";
import { isTicketOverdue } from "@/lib/services/ticket-sla";

export type ServiceDeskUIMessage = UIMessage<
  never,
  {
    progress: {
      id?: string;
      message: string;
      label?: string;
      status?: "running" | "done" | "complete";
      phase?: "working" | "complete";
    };
  }
>;

const GOOGLE_PROVIDER_OPTIONS = {
  google: {
    thinkingConfig: {
      thinkingLevel: "low" as const,
    },
  },
};

const AGENT_STREAM_TIMEOUT_MS = 75_000;

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  onTimeout: () => Error,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(onTimeout()), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function isAcceptedUiChunk(chunk: unknown) {
  try {
    const schema = uiMessageChunkSchema();
    if (!schema.validate) return false;
    const result = await schema.validate(chunk);
    return result.success;
  } catch (error) {
    console.error("[agente] falha ao validar chunk de UI", error);
    return false;
  }
}

function writeEncodedText(
  textEncoder: AssistantTextEncoder,
  write: (part: unknown) => void,
) {
  for (const chunk of textEncoder.drain()) write(chunk);
}

async function pipeAgentStream(
  stream: { text: Promise<string> },
  write: (part: unknown) => void,
  textEncoder: AssistantTextEncoder,
) {
  const uiStream = toAISdkStream(stream as never, {
    from: "agent",
    version: "v7",
    sendStart: false,
    sendFinish: false,
  });
  const reader = uiStream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const kind = classifyAgentChunk(value);
      if (kind === "text-delta") {
        textEncoder.push(readAgentTextDelta(value));
        writeEncodedText(textEncoder, write);
        continue;
      }
      if (kind === "drop") continue;
      if (!(await isAcceptedUiChunk(value))) {
        const type =
          value && typeof value === "object" && "type" in value
            ? value.type
            : "unknown";
        console.error("[agente] chunk de UI ignorado", { type });
        continue;
      }
      write(value);
    }
  } finally {
    reader.releaseLock();
  }
  return (await stream.text).trim();
}

function readToolCall(chunk: unknown) {
  if (!chunk || typeof chunk !== "object" || !("type" in chunk)) return null;
  if (chunk.type !== "tool-call" || !("payload" in chunk)) return null;
  const payload = chunk.payload;
  if (!payload || typeof payload !== "object" || !("toolName" in payload)) {
    return null;
  }
  const toolName = String(payload.toolName);
  const args = "args" in payload ? payload.args : undefined;
  return { toolName, args };
}

export async function runServiceDeskAgent({
  userId,
  userEmail,
  conversationId,
  selectedTicketId,
}: {
  userId: string;
  userEmail: string;
  conversationId: string;
  selectedTicketId?: string;
}) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY não está configurada.");
  }
  getMastra();

  const current = await prisma.chatSession.findFirst({
    where: { id: conversationId, userId },
    select: { id: true, status: true },
  });
  if (!current) {
    console.info("[agente] sessão não encontrada", { conversationId, userId });
    return null;
  }
  if (current.status !== ChatStatus.BOT_ACTIVE) {
    console.info("[agente] pulado: sessão não está BOT_ACTIVE", {
      conversationId,
      status: current.status,
    });
    return null;
  }

  const session = await prisma.chatSession.findFirst({
    where: { id: conversationId, userId, status: ChatStatus.BOT_ACTIVE },
    select: {
      id: true,
      ticket: {
        select: {
          code: true,
          priority: true,
          slaDeadline: true,
          isOverdue: true,
        },
      },
    },
  });
  if (!session) {
    console.info("[agente] pulado: BOT_ACTIVE mudou antes do stream", {
      conversationId,
    });
    return null;
  }

  const history = await prisma.chatMessage.findMany({
    where: { chatSessionId: conversationId },
    orderBy: { createdAt: "asc" },
    take: 30,
    select: { sender: true, content: true, metadata: true },
  });
  const selectedTicket = selectedTicketId
    ? (await getEmployeeTicketsForAgent(userId)).find(
        (ticket) => ticket.id === selectedTicketId,
      )
    : undefined;
  const actions: ToolAction[] = [];
  const assessment: AgentAssessment = { confidenceScore: 100 };
  const model = serviceDeskModelId();
  const messages = mapConversationHistory(history);
  const requestContext = new RequestContext();
  requestContext.set("userId", userId);
  requestContext.set("userEmail", userEmail);
  requestContext.set("conversationId", conversationId);
  requestContext.set(
    "selectedTicketContext",
    selectedTicket
      ? `Chamado selecionado pelo funcionário: ${selectedTicket.code} — ${selectedTicket.title}. Contexto: ${selectedTicket.description}. Status: ${selectedTicket.status}.`
      : "",
  );

  const lastUserMessage = [...history]
    .reverse()
    .find((message) => message.sender === "EMPLOYEE")?.content;
  const linkedTicket = session.ticket;
  const linkedOverdue = linkedTicket
    ? isTicketOverdue(linkedTicket.slaDeadline, linkedTicket.isOverdue)
    : false;

  console.info("[agente] iniciando geração", {
    model,
    conversationId,
    messageCount: messages.length,
    framework: "mastra",
  });

  const stream = createUIMessageStream<ServiceDeskUIMessage>({
    execute: async ({ writer }) => {
      const reportProgress = (payload: AgentProgressPayload) => {
        writer.write({
          type: "data-progress",
          data: {
            ...payload,
            message: payload.message || payload.label || "",
            label: payload.label ?? payload.message,
          },
          transient: true,
        });
      };
      let handoffStarted = false;
      const ensureHandoff = async (reason: string) => {
        if (handoffStarted) return;
        handoffStarted = true;
        await markSessionWaitingHuman(conversationId, userId, reason);
      };
      const absorbToolStep = async (step: {
        toolResults?: Array<{
          payload?: { toolName?: string; result?: unknown; isError?: boolean };
        }>;
      }) => {
        for (const toolResult of step.toolResults ?? []) {
          const payload = toolResult.payload;
          if (!payload?.toolName || payload.isError) continue;
          const action = actionFromToolOutput(payload.toolName, payload.result);
          if (!action) continue;
          actions.push(action);
          applyToolEvidence(assessment, action);
          reportProgress({
            id: action.name,
            message: action.label,
            label: action.label,
            status: "done",
            phase: "working",
          });
        }
        const reason = handoffReasonForTurn({
          employeeMessage: lastUserMessage,
          actions,
          linkedPriority: linkedTicket?.priority,
          linkedOverdue,
        });
        if (reason) await ensureHandoff(reason);
      };

      writer.write({ type: "start" });
      reportProgress({
        id: "analyze",
        message: "Analisando sua solicitação...",
        label: "Analisando sua solicitação...",
        status: "running",
        phase: "working",
      });

      let primaryText = "";
      let retryText: string | undefined;
      let primaryCallError: unknown;
      const textEncoder = createAssistantTextEncoder();
      const writePart = (part: unknown) => {
        writer.write(part as never);
      };

      const streamOptions = {
        requestContext,
        maxSteps: 5,
        modelSettings: {
          temperature: 0.2,
          maxOutputTokens: 700,
        },
        providerOptions: GOOGLE_PROVIDER_OPTIONS,
        onChunk: (chunk: unknown) => {
          const call = readToolCall(chunk);
          if (!call) return;
          const label = runningLabelForTool(call.toolName, call.args);
          reportProgress({
            id: call.toolName,
            message: label,
            label,
            status: "running",
            phase: "working",
          });
        },
        onStepFinish: absorbToolStep,
        onError: ({ error }: { error: unknown }) => {
          logAgentError("Mastra onError (primary):", error, {
            phase: "primary",
            model,
          });
        },
      };

      try {
        const primaryResult = await serviceDeskAgent.stream(messages, streamOptions);
        primaryText = await withTimeout(
          pipeAgentStream(primaryResult, writePart, textEncoder),
          AGENT_STREAM_TIMEOUT_MS,
          () =>
            new Error(
              `Tempo esgotado ao gerar a resposta do agente (primary, ${AGENT_STREAM_TIMEOUT_MS}ms).`,
            ),
        );
        if (!primaryText) primaryText = textEncoder.sent.trim();
      } catch (error) {
        primaryCallError = error;
        logAgentError("Falha na passagem principal do agente:", error, {
          phase: "primary",
          model,
        });
        if (!primaryText) primaryText = textEncoder.sent.trim();
        if (!shouldRetryWithoutTools(primaryText, actions.length)) {
          throw new Error(
            formatAgentError(error, { phase: "primary", model }),
          );
        }
      }

      if (shouldRetryWithoutTools(primaryText, actions.length)) {
        console.info("[agente] retry sem tools", {
          conversationId,
          model,
          primaryChars: primaryText.length,
        });
        reportProgress({
          id: "retry",
          message: "Tentando novamente...",
          label: "Tentando novamente...",
          status: "running",
          phase: "working",
        });
        try {
          const retryResult = await serviceDeskAgent.stream(messages, {
            ...streamOptions,
            maxSteps: 1,
            toolChoice: "none",
            onError: ({ error }: { error: unknown }) => {
              logAgentError("Mastra onError (retry):", error, {
                phase: "retry",
                model,
              });
            },
          });
          retryText = await withTimeout(
            pipeAgentStream(retryResult, writePart, textEncoder),
            AGENT_STREAM_TIMEOUT_MS,
            () =>
              new Error(
                `Tempo esgotado ao gerar a resposta do agente (retry, ${AGENT_STREAM_TIMEOUT_MS}ms).`,
              ),
          );
          if (!retryText) {
            const shown = textEncoder.sent.trim();
            retryText = shown.startsWith(primaryText)
              ? shown.slice(primaryText.length).trim()
              : shown;
          }
        } catch (error) {
          logAgentError("Falha no retry sem tools do agente:", error, {
            phase: "retry",
            model,
          });
          throw new Error(formatAgentError(error, { phase: "retry", model }));
        }
      } else if (primaryCallError && !primaryText) {
        throw new Error(
          formatAgentError(primaryCallError, { phase: "primary", model }),
        );
      }

      const picked = pickAssistantResponseText({ primaryText, retryText });
      let responseText = picked.text;
      if (picked.source === "fallback") {
        console.info("[agente] resposta de fallback", {
          conversationId,
          model,
          chars: responseText.length,
        });
      }

      const alreadyRequestedAnalyst = actions.some(
        (action) => action.name === "request_helpdesk_analyst",
      );
      if (!alreadyRequestedAnalyst && actions.length === 0) {
        const mandatoryReason = handoffReasonForTurn({
          employeeMessage: lastUserMessage,
          actions,
          linkedPriority: linkedTicket?.priority,
          linkedOverdue,
        });
        if (!mandatoryReason) recordReplyWithoutTools(assessment);
      }

      const mandatoryReason = handoffReasonForTurn({
        employeeMessage: lastUserMessage,
        actions,
        linkedPriority: linkedTicket?.priority,
        linkedOverdue,
      });
      if (mandatoryReason && !alreadyRequestedAnalyst) {
        assessment.handoffReason = mandatoryReason;
        actions.push({
          name: "request_helpdesk_analyst",
          label: "Solicitou atendimento de um analista",
          summary: mandatoryReason,
        });
        responseText += `\n\n${mandatoryReason} Encaminhei a conversa para um analista e pauso o atendimento automático.`;
        await ensureHandoff(mandatoryReason);
      }
      const requestedHuman = actions.some(
        (action) => action.name === "request_helpdesk_analyst",
      );
      const evidenceScore = assessment.confidenceScore;
      const handoffSummaryForRationale = actions.find(
        (action) => action.name === "request_helpdesk_analyst",
      )?.summary;
      const publicRationale = buildPublicRationale({
        actions,
        confidenceScore: evidenceScore,
        requestedHuman,
        handoffReason: assessment.handoffReason ?? handoffSummaryForRationale,
        usedFallback: picked.source === "fallback",
      });
      const draftPriority = actions.find(
        (action) => action.name === "create_ticket",
      )?.draft?.priority;
      const fallback = fallbackDecision({
        actions,
        evidenceScore,
        rationale: publicRationale,
        priority: draftPriority ?? linkedTicket?.priority ?? null,
      });

      let classified = fallback;
      try {
        const generated = await classifyTurnAgent.generate(
          [
            `Mensagem do funcionário: ${lastUserMessage ?? ""}`,
            `Resposta pública: ${responseText.slice(0, 700)}`,
            `Ações executadas: ${actions.map((action) => action.label).join("; ") || "nenhuma"}`,
            `Confiança por evidência das tools: ${evidenceScore}`,
            `Prioridade já classificada: ${fallback.priority ?? "nenhuma"}`,
            "Não aumente a confiança acima da evidência.",
          ].join("\n"),
          {
            structuredOutput: {
              schema: agentDecisionSchema,
              errorStrategy: "fallback",
              fallbackValue: fallback,
            },
            modelSettings: { temperature: 0, maxOutputTokens: 300 },
            maxSteps: 1,
          },
        );
        const parsed = agentDecisionSchema.safeParse(generated.object);
        classified =
          generated.usedFallbackValue || !parsed.success ? fallback : parsed.data;
      } catch (error) {
        logAgentError("Falha ao classificar o turno:", error, {
          phase: "primary",
          model,
        });
      }

      const confidenceScore = reconcileConfidence(
        classified.confidenceScore,
        evidenceScore,
      );
      if (
        confidenceScore < LOW_CONFIDENCE_THRESHOLD &&
        !actions.some((action) => action.name === "request_helpdesk_analyst")
      ) {
        const summary =
          assessment.handoffReason ??
          "A IA não encontrou evidências suficientes para responder com segurança.";
        assessment.handoffReason = summary;
        actions.push({
          name: "request_helpdesk_analyst",
          label: `Solicitou atendimento humano com confiança de ${confidenceScore}%`,
          summary,
        });
        responseText +=
          "\n\nNão encontrei uma orientação confiável na Central de Ajuda e encaminhei sua conversa para um analista.";
        classified = {
          ...classified,
          intent: "transbordo",
          rationale: buildPublicRationale({
            actions,
            confidenceScore,
            requestedHuman: true,
            handoffReason: summary,
            usedFallback: picked.source === "fallback",
          }),
        };
        await ensureHandoff(summary);
      }
      const handoffSummary = actions.find(
        (action) => action.name === "request_helpdesk_analyst",
      )?.summary;
      textEncoder.sync(responseText);
      writeEncodedText(textEncoder, writePart);
      console.info("[agente] turno concluído", {
        model,
        conversationId,
        source: picked.source,
        hadText: responseText.trim().length > 0,
        chars: responseText.length,
        ...(primaryCallError
          ? {
              error: formatAgentError(primaryCallError, {
                phase: "primary",
                model,
              }),
            }
          : {}),
      });
      const decision = {
        actions: actions.map(({ name, label }) => ({ name, label })),
        confidence: confidenceBand(confidenceScore),
        confidenceScore,
        rationale: classified.rationale || publicRationale,
        intent: classified.intent,
        priority: classified.priority,
      } satisfies Prisma.InputJsonObject;
      const metadata = buildAssistantMetadata({
        actions,
        lastUserMessage,
        selectedTicketId,
      });

      await saveAssistantMessage(
        conversationId,
        responseText,
        decision,
        metadata,
        {
          confidenceScore,
          handoffSummary,
          handoffReason: assessment.handoffReason ?? handoffSummary,
        },
      );
      reportProgress({
        id: "complete",
        message: "Resposta pronta.",
        label: "Resposta pronta.",
        status: "complete",
        phase: "complete",
      });
      writer.write({ type: "finish" });
    },
    onError: (error) => {
      logAgentError("Falha durante a geração da resposta do agente:", error, {
        phase: "stream",
        model,
      });
      return formatAgentError(error, { phase: "stream", model });
    },
  });

      return createUIMessageStreamResponse({ stream });
}

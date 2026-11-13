import { Mastra } from "@mastra/core/mastra";
import { PostgresStore } from "@mastra/pg";

import { classifyTurnAgent } from "@/lib/mastra/agents/classify-turn";
import { serviceDeskAgent } from "@/lib/mastra/agents/service-desk";
import { registerOpenTicketRunner } from "@/lib/mastra/registry";
import { openTicketSuspendSchema, openTicketResultSchema, openTicketWorkflow } from "@/lib/mastra/workflows/open-ticket";

let mastra: Mastra | undefined;
let ready: Promise<void> | undefined;
let initError: unknown;

function readSuspendPayload(result: {
  suspendPayload?: unknown;
  steps?: unknown;
}) {
  const direct = openTicketSuspendSchema.safeParse(result.suspendPayload);
  if (direct.success) return direct.data;
  if (result.steps && typeof result.steps === "object") {
    const steps = result.steps as Record<string, { suspendPayload?: unknown }>;
    const nested = openTicketSuspendSchema.safeParse(
      steps["request-confirmation"]?.suspendPayload,
    );
    if (nested.success) return nested.data;
  }
  return openTicketSuspendSchema.parse(result.suspendPayload);
}

export function getMastra() {
  if (!mastra) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "DATABASE_URL não está configurada para o workflow do Mastra.",
      );
    }
    const storage = new PostgresStore({
      id: "nexo-assist",
      connectionString,
      schemaName: "mastra",
    });
    const instance = new Mastra({
      agents: { serviceDeskAgent, classifyTurnAgent },
      workflows: { openTicketWorkflow },
      storage,
    });
    mastra = instance;
    ready = storage.init().catch((error: unknown) => {
      initError = error;
      console.error("Falha ao iniciar o storage do Mastra:", error);
    });
    registerOpenTicketRunner({
      async startDraft(input) {
        await ready;
        if (initError) throw initError;
        const workflow = instance.getWorkflow("openTicketWorkflow");
        const run = await workflow.createRun();
        const result = await run.start({ inputData: input });
        if (result.status !== "suspended") {
          throw new Error(
            "O rascunho de chamado não ficou aguardando confirmação.",
          );
        }
        const payload = readSuspendPayload(result);
        return {
          requiresConfirmation: true as const,
          draft: payload.draft,
          workflowRunId: run.runId,
          duplicateMatch: payload.duplicate.match,
          ...(payload.duplicate.code
            ? { duplicateCode: payload.duplicate.code }
            : {}),
          message: payload.message,
        };
      },
      async resume(runId, confirmed) {
        await ready;
        if (initError) throw initError;
        const workflow = instance.getWorkflow("openTicketWorkflow");
        const run = await workflow.createRun({ runId });
        const result = await run.resume({
          step: "request-confirmation",
          resumeData: { confirmed },
        });
        if (result.status !== "success") {
          throw new Error("Não foi possível concluir o rascunho do chamado.");
        }
        const parsed = openTicketResultSchema.parse(result.result);
        if (!confirmed || parsed.cancelled) return { cancelled: true as const };
        if (!parsed.persisted || parsed.persistentError || !parsed.outcome) {
          throw new Error("Não foi possível gravar o chamado.");
        }
        return {
          cancelled: false as const,
          outcome: parsed.outcome,
          ticket: parsed.ticket,
        };
      },
    });
  }
  return mastra;
}

export async function whenMastraReady() {
  getMastra();
  await ready;
}

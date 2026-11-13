import "server-only";

import { getMastra, whenMastraReady } from "@/lib/mastra/instance";
import { getOpenTicketRunner } from "@/lib/mastra/registry";

export async function resumeOpenTicketRun(runId: string, confirmed: boolean) {
  getMastra();
  await whenMastraReady();
  return getOpenTicketRunner().resume(runId, confirmed);
}

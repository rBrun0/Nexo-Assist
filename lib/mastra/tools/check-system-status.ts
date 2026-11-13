import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import { checkSystemStatus } from "@/lib/services/system-status";
import { systemStatusOutputSchema } from "@/lib/mastra/schemas/tool-outputs";

export const checkSystemStatusTool = createTool({
  id: "check_system_status",
  description:
    "Verifica se há uma integração configurada para status operacional de VPN, e-mail, servidores e Wi-Fi. Se o status não estiver integrado, informe claramente que não foi possível verificar em tempo real; nunca deduza ou invente disponibilidade.",
  inputSchema: z.object({
    serviceName: z.string().trim().min(1).max(80).optional(),
  }),
  outputSchema: systemStatusOutputSchema,
  execute: async ({ serviceName }) => checkSystemStatus(serviceName),
});

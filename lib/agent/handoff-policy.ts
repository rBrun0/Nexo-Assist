const ANALYST_REQUEST =
  /\b(falar com (um |uma )?(analista|atendente|pessoa)|quero (um |uma )?(analista|atendente)|chamar (um |uma )?(analista|atendente)|atendimento humano|passar para (um |o )?analista|transferir para (um |o )?analista)\b/;

export function employeeAskedForAnalyst(message: string | undefined) {
  if (!message) return false;
  const normalized = message
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR");
  return ANALYST_REQUEST.test(normalized);
}

export function mandatoryHandoffReason(input: {
  employeeMessage?: string;
  draftPriority?: string | null;
  linkedPriority?: string | null;
  linkedOverdue?: boolean;
}) {
  if (employeeAskedForAnalyst(input.employeeMessage)) {
    return "Você pediu para falar com um analista.";
  }
  if (input.linkedOverdue) {
    return "O chamado vinculado está com o prazo vencido.";
  }
  if (input.draftPriority?.toUpperCase() === "CRITICAL") {
    return "O caso foi classificado como crítico.";
  }
  if (input.linkedPriority?.toUpperCase() === "CRITICAL") {
    return "O chamado vinculado é crítico.";
  }
  return null;
}

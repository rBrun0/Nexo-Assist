/** Contas criadas pelo seed. Em desenvolvimento aceitam qualquer senha. */
export const DEMO_ACCOUNT_EMAILS = [
  "carlos.silva@nexo.com.br",
  "ana.souza@nexo.com.br",
  "bruno.lima@nexo.com.br",
  "diana.costa@nexo.com.br",
  "eduardo.ramos@nexo.com.br",
  "fernanda.alves@nexo.com.br",
  "analista.ti@nexo.com.br",
  "suporte.n1.n2@nexo.com.br",
] as const;

const DEMO_EMAIL_SET = new Set<string>(DEMO_ACCOUNT_EMAILS);

export function isDemoAccountEmail(email: string) {
  return DEMO_EMAIL_SET.has(email.trim().toLowerCase());
}

/** O PRD pede que as contas de exemplo aceitem qualquer senha fora de produção. */
export function acceptsDemoPassword(
  email: string,
  password: string,
  nodeEnv = process.env.NODE_ENV,
) {
  return (
    nodeEnv !== "production" &&
    password.trim().length > 0 &&
    isDemoAccountEmail(email)
  );
}

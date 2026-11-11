# Nexo Assist — contexto e regras do projeto

## Objetivo

Construir o app fullstack de Service Desk de TI do desafio Beyond the Bytes. Prioridade do produto: transparência de ações do agente, sem revelar cadeia privada de pensamento. Mantenha README preciso sobre funcionalidades implementadas e pendentes.

## Stack

- Next.js App Router, TypeScript estrito e Tailwind/Shadcn UI.
- Autenticação local (senha com hash no Prisma + cookie HTTP-only assinado). Supabase fornece PostgreSQL e, no futuro com JWT customizado, Realtime autenticado.
- Prisma 7 e PostgreSQL do Supabase; `prisma/schema.prisma` é a fonte de dados do produto.
- Vercel AI SDK + Google Gemini para o agente/tool calling, salvo decisão explícita posterior.
- Zod para validar entradas no servidor; React Hook Form + resolvers para formulários.

## Organização por camada

- `app/`: páginas, Server Actions e API Routes. Autenticar, autorizar, validar e delegar.
- `lib/auth/`: sessão local, senha e helpers `getCurrentUser` / `requireUser`.
- `lib/supabase/`: cliente browser singleton e helpers (ex.: Presence em canal público por sessão). Realtime com conteúdo de chat só após JWT customizado.
- `lib/validations/`: contratos Zod compartilhados.
- `lib/services/`: regras de negócio/persistência com Prisma, sem UI.
- `lib/agent/`: prompts reutilizáveis, tools server-side e execução do modelo.
- `lib/prisma.ts`: único Prisma client e pool PostgreSQL.
- `prisma/`: schema, migrations e seed idempotente. Nunca apagar dados no seed.

Não duplicar regras entre Server Actions e rotas. Nunca confiar em `userId`, papel, conteúdo de ticket ou vínculo de analista enviado pelo browser. Verificar propriedade/role no servidor em toda operação. Use `requireUser(role)` nos adapters.

## Regras do domínio

- Tipos: `INCIDENT` e `REQUEST`; categorias: `ACCESS`, `NETWORK_VPN`, `HARDWARE`, `SOFTWARE`, `EMAIL`, `OTHER`.
- Prioridade combina impacto e urgência: `CRITICAL` (equipe/empresa parada, 1h corrida), `HIGH` (4h úteis), `MEDIUM` (3 dias úteis), `LOW` (5 dias úteis).
- Não persistir rascunho de chamado até confirmação explícita verificada no servidor.
- Não duplicar chamado ativo compatível; resolvido em até 7 dias pode reabrir.
- Funcionário consulta somente tickets próprios (criados ou em que é afetado) e sua conversa; analista consulta fila autorizada e só envia mensagens quando assumiu a conversa.
- Funcionário mantém no máximo uma conversa não encerrada. Handoff pausa o agente até o analista devolver ou encerrar.
- Mensagens registram `sender` e `senderUserId`/`senderUser`, além de `readAtByEmployee` e `readAtByAnalyst`; definir remetente no servidor e manter contagens de não lidas no backend.
- O histórico é carregado por Server Action e cacheado no TanStack Query; atualização da UI por polling/refetch autorizado. `ChatSession`/`ChatMessage` têm RLS negando roles Supabase até JWT customizado.
- Limite de 30 mensagens por conversa. Agente só atua em assuntos de TI.
- Em `thoughtProcess`, persistir somente resumo público de ações, confiança estimada e justificativa; não armazenar chain-of-thought.

## Qualidade e segurança

- Validar com Zod no limite do servidor; erros explícitos sem expor stack/segredo.
- Nunca enviar `DATABASE_URL`, tokens admin ou chave Gemini ao browser.
- Respeitar privacidade por proprietário nas queries, comments e ferramentas do agente.
- Self-service de tickets força `affectedUserIds = [usuário autenticado]` no servidor.
- Fazer alterações pequenas, tipadas e compatíveis com padrões existentes.
- Validar com typecheck, lint, testes focados e build.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

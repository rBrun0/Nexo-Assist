# Nexo Assist

Aplicação fullstack de Service Desk de TI para o desafio Beyond the Bytes.

## Stack e arquitetura

- **Next.js 16 App Router + TypeScript**: páginas protegidas por papel, API Routes e UI.
- **Autenticação local**: login e senha com hash no Prisma e cookie HTTP-only assinado.
- **Prisma 7 + PostgreSQL do Supabase**: persistência de perfil, tickets, conversas e mensagens. `prisma/schema.prisma` é a fonte de schema da aplicação.
- **Vercel AI SDK (`@ai-sdk/react` `useChat` + `streamText`) + Google Gemini**: escolhido no lugar de Mastra/LangGraph.js para integrar streaming UI, tool calling e App Router com menos camada intermediária, mantendo o agente server-side em `lib/agent/`. O padrão é `gemini-3.8-flash` (o Google descontinuou `gemini-2.5-flash` para contas novas). Sobrescreva com `GEMINI_MODEL` se necessário.
- **Zod** valida entradas server-side; React Hook Form continua disponível para formulários.

As camadas estão separadas: `app/` autentica/autorizada e delega; `lib/validations/` contém schemas; `lib/services/` contém regras e persistência; `lib/agent/` concentra prompts e tools; `lib/prisma.ts` é o único client do banco.

## Configuração local

Requisitos: Node.js 20+ e um projeto Supabase com PostgreSQL habilitado.

1. Instale pacotes: `npm install`.
2. Copie `.env.example` para `.env` e preencha `DATABASE_URL`, `SESSION_SECRET` (segredo aleatório de pelo menos 32 caracteres), as chaves públicas do Supabase para recursos Realtime, e `GOOGLE_GENERATIVE_AI_API_KEY`. Em desenvolvimento, `DEMO_USER_PASSWORD` é opcional e o seed usa `123456`; em produção, configure uma senha exclusiva com pelo menos 12 caracteres.
3. Configure o projeto Supabase e sua publication Realtime conforme as instruções das migrations. O login da aplicação não usa Supabase Auth.
4. Sincronize o schema e carregue os dados de demonstração:

   ```bash
   npm run db:push
   npm run db:generate
   npm run db:seed
   ```

   O schema pode ser sincronizado com `db:push`; revise as alterações propostas antes de confirmar quando o banco já possuir dados. As migrations presentes são incrementais e não contêm uma migration inicial completa. Em banco preexistente sem baseline do Prisma, `migrate deploy` pode retornar `P3005`; não aplique migrations sobre esse banco sem antes revisar e definir o baseline.

   A migration `20261108141000_one_active_chat_per_employee` cria o índice parcial de uma conversa ativa por funcionário. A migration `20261108140000_harden_chat_rls` nega acesso Supabase `anon`/`authenticated` a `ChatSession`/`ChatMessage`. Se sincronizar só por `db:push`, aplique essas migrations SQL no banco.

5. Inicie o Next.js com `npm run dev`.

O seed cria/sincroniza no Prisma as contas `carlos.silva@nexo.com.br`, `ana.souza@nexo.com.br` e `analista.ti@nexo.com.br`, ~10 artigos da Central de Ajuda e chamados de exemplo do Anexo B (`INC-20311` vencido, `REQ-10442` aprovado, `INC-20150` resolvido de outro funcionário, mais um aberto da Ana). Em desenvolvimento, a senha padrão é `123456` (ou `DEMO_USER_PASSWORD` se configurada) e é armazenada como hash; cada execução do seed redefine as senhas dessas contas de demonstração. A tela de login só exibe essas credenciais fora de produção. A role é definida pelo registro `User` do Prisma; nunca é aceita do navegador.

## Autenticação, dados e permissões

- Login valida o hash de senha no Prisma e assina um cookie HTTP-only, Secure em produção, SameSite=Lax com os dados essenciais da sessão. Configure `SESSION_SECRET` em cada ambiente; alterá-lo invalida as sessões existentes.
- Só usuários provisionados em `User` podem acessar o app. Empregados acessam apenas seu perfil, tickets próprios e conversa própria. Analistas podem consultar a fila da empresa e só responder conversas que assumiram.
- As rotas protegidas recarregam usuário e role do banco. Senhas são derivadas com scrypt; não são armazenadas em texto puro. A redefinição por e-mail não está disponível na autenticação local.
- Conversas encerradas ficam no histórico do banco, mas **não** entram na fila do analista (só ativas com pelo menos uma mensagem). O índice parcial e o serviço garantem uma única conversa não encerrada por funcionário. A `ChatSession` do funcionário só é criada na **primeira mensagem** (abrir o chat sem falar não polui a fila).
- Cada mensagem possui `readAtByEmployee`, `readAtByAnalyst`, `sender` e `senderUserId`/relação `senderUser`; assim ficam registrados o tipo de remetente e a pessoa específica que enviou cada mensagem. O histórico completo é carregado por Server Action e cacheado no TanStack Query. O serviço confere ownership/atribuição e estado humano antes de gravar. A UI atualiza por polling/refetch autorizado (TanStack Query), não por payload de Realtime.
- A autenticação local não gera identidade Supabase Auth. Por isso `ChatSession`/`ChatMessage` têm RLS negando `anon`/`authenticated` (migration `20261108140000_harden_chat_rls`): o browser não lê conversas pela anon key. O Prisma segue via `DATABASE_URL`. Realtime com conteúdo de chat só deve voltar após JWT customizado no Supabase alinhado ao `User.id`.
- A confiança de resposta começa em 100; uma busca na Central de Ajuda com resultados registra 85, e uma busca sem resultados registra 40 e encaminha a conversa para um analista. Confiança, motivo e início do handoff ficam em `ChatSession`; a fila do analista exibe esses dados e o tempo aguardando.
- Presença online (`use-online-presence`) usa Supabase Realtime Presence em canal público por conversa (`presence:session:{sessionId}`), só com metadados efêmeros (`id`, `name`, `role`). Não lê `ChatSession`/`ChatMessage`. Realtime com conteúdo de chat continua dependendo de JWT customizado.

## Chat e ferramentas do agente

`POST /api/conversations/me` salva a mensagem do funcionário e, quando a conversa está em `BOT_ACTIVE`, chama o agente. Em `WAITING_HUMAN` ou `HUMAN_ACTIVE`, o bot não responde. O limite é de **30 mensagens** por conversa (`CONVERSATION_MESSAGE_LIMIT`); eventos `SYSTEM` (transferência, assume, devolução, encerramento) não contam. A UI bloqueia o composer no limite e oferece CTA `request_analyst` para handoff sem precisar de novas mensagens de turno.

Tools em `lib/agent/tools.ts`:

- `search_knowledge_base`: busca a Central de Ajuda.
- `check_system_status`: informa que VPN, e-mail, servidores e Wi-Fi estão sem integração de monitoramento, retornando `UNKNOWN` em vez de inventar um status operacional.
- `list_my_tickets`: consulta apenas tickets do funcionário autenticado.
- `ask_ticket_impact`: pergunta guiada de impacto (“quem está sendo afetado?”) para classificar prioridade.
- `create_ticket`: produz um rascunho com a taxonomia existente no Prisma; a gravação só acontece depois do botão de confirmação, que valida novamente o rascunho salvo (`CRITICAL` é a prioridade urgente e `category` é um enum, não `categoryId`).
- `add_ticket_comment`: adiciona complemento apenas a chamado aberto pelo próprio funcionário.
- `request_helpdesk_analyst`: altera o estado para `WAITING_HUMAN` e guarda o resumo para a fila.

O system prompt reutilizável está em `lib/agent/prompts/service-desk.ts` e segue as regras do service desk do desafio (Anexo A): tipos INC/REQ, categorias, prioridade/SLA, rascunho com confirmação, sem duplicidade, handoff e privacidade por dono. `search_knowledge_base` prioriza resultados por relevância de título, palavras-chave e conteúdo; `useChat` recebe a resposta em streaming e exibe estados públicos como “Consultando seus chamados...” enquanto as tools executam; o texto final também aparece progressivamente. As mensagens do assistente armazenam `thoughtProcess` como resumo legível de ações, confiança estimada e justificativa pública — **não transmitimos nem armazenamos cadeia privada de pensamento**. Tool calls são limitadas a cinco passos por resposta; respostas do Gemini ficam limitadas a 700 tokens. O chip “Falar com um analista” só entra no metadata quando há chamado vencido/CRITICAL; o handoff real usa `request_helpdesk_analyst` (pedido do usuário, crítico/vencido ou baixa confiança).

### Blocos interativos do chat

O metadata da mensagem do assistente é montado no servidor (`lib/agent/build-assistant-metadata.ts`) a partir das tools — não a partir de JSON inventado pelo modelo. A UI em `components/chat/` renderiza:

- `ticket_choice`: lista selecionável quando há vários chamados (ex.: “qual o status?”); o clique define o chamado de contexto e envia uma mensagem automática.
- `ticket_status`: card de detalhe quando há um único chamado relevante.
- `ticket_draft`: rascunho com confirmação explícita antes de gravar.
- `system_status`: serviços consultados sem inventar disponibilidade.
- `article_refs`: atalhos para artigos da Central de Ajuda.
- `options`: chips de ação (padrão ou complementares).

Só a última mensagem do assistente permanece interativa.

## Tickets e SLAs

A API/Server Action reutilizam `lib/services/tickets.ts`. A criação exige confirmação, associa o funcionário da sessão como afetado, atualiza duplicata exata de título/tipo/categoria e reabre ticket resolvido há até sete dias. Ao vincular outro funcionário, não retorna detalhes do ticket preexistente. A busca de duplicidade ainda é textual exata, não semântica. No handoff, o chamado vinculado à conversa passa a `WAITING_ANALYST`; ao assumir a conversa, o analista move o chamado para `IN_PROGRESS` e pode atualizar o status (`PATCH /api/tickets/[id]`). Eventos `SYSTEM` no chat usam o texto “Transferida para suporte N2” (com horário no divisor).

Impacto de mais de um funcionário eleva a prioridade a `CRITICAL` (uma hora corrida). Alta, média e baixa correspondem a 4 horas, 3 dias úteis e 5 dias úteis no horário comercial de São Paulo (8h–18h).

## Scripts e validação

```bash
npm run db:migrate:dev
npm run db:generate
npm run db:seed
npm run typecheck
npm run lint
npm run test:logic
npm run build
```

Os testes automatizados rodam com `npm test` (Jest); `npm run test:watch` inicia o modo de observação. A suíte cobre SLA, validações, histórico contextual e transições/permissões do ciclo de conversas.

O console do analista atualiza a fila e o chat por **polling autorizado** (foco/intervalo), permite assumir/devolver/encerrar conversa e enviar mensagens identificadas pelo analista atribuído. A timeline mostra divisores `SYSTEM` de transferência, assume, devolução e encerramento; o histórico é refetchado após qualquer ação. O aside de chamados mostra preview e o botão “Ver todos os chamados...” quando há mais do que o recorte. Detalhes de confiança/justificativa ficam no bloco expandível “Detalhes” acima das respostas do agent. Testes automatizados de integração com PostgreSQL/Supabase, deploy e revisão de configuração para produção ainda são próximos passos. Nunca use credenciais demo de produção, não exponha chaves de serviço e limite o consumo do endpoint Gemini no deploy.

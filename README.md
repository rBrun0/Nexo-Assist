# Nexo Assist

Aplicação fullstack de Service Desk de TI para o desafio Beyond the Bytes.

## Stack e arquitetura

- **Next.js 16 App Router + TypeScript**: páginas protegidas por papel, API Routes e UI.
- **Autenticação local**: login e senha com hash no Prisma e cookie HTTP-only assinado.
- **Prisma 7 + PostgreSQL do Supabase**: persistência de perfil, tickets, conversas e mensagens. `prisma/schema.prisma` é a fonte de schema da aplicação.
- **Mastra + Google Gemini**: o agente e o workflow de abertura rodam no servidor com `@mastra/core`. A UI continua no Vercel AI SDK (`@ai-sdk/react` `useChat`); `@mastra/ai-sdk` converte o stream para o mesmo formato. O modelo padrão é `gemini-3.8-flash` (o Google descontinuou `gemini-2.5-flash` para contas novas). Sobrescreva com `GEMINI_MODEL` se necessário. Snapshots do workflow suspenso ficam no schema `mastra` do mesmo Postgres; chat e chamados continuam no Prisma.
- **Zod** valida entradas server-side; React Hook Form continua disponível para formulários.

As camadas estão separadas: `app/` autentica/autoriza e delega; `lib/validations/` contém schemas; `lib/services/` contém regras e persistência; `lib/agent/` concentra prompt, trilha e metadata; `lib/mastra/` registra o agente, as tools e o workflow de abertura; `lib/prisma.ts` é o único client do banco.

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

O seed cria/sincroniza no Prisma as contas `carlos.silva@nexo.com.br`, `ana.souza@nexo.com.br`, `analista.ti@nexo.com.br` e as demais contas de `lib/auth/demo-accounts.ts`, ~10 artigos da Central de Ajuda e chamados de exemplo do Anexo B (`INC-20311` vencido, `REQ-10442` aprovado, `INC-20150` resolvido de outro funcionário, mais um aberto da Ana). Fora de produção, essas contas aceitam qualquer senha não vazia (o PRD pede isso para os dados de exemplo) e a tela de login lista os três e-mails principais. A senha gravada no seed continua `123456`, ou `DEMO_USER_PASSWORD` se configurada, sempre como hash; cada execução do seed redefine esse hash. Em produção o atalho de qualquer senha fica desligado e o seed exige `DEMO_USER_PASSWORD` com pelo menos 12 caracteres. A role vem do registro `User` do Prisma; nunca é aceita do navegador.

## Autenticação, dados e permissões

- Login valida o hash de senha no Prisma e assina um cookie HTTP-only, Secure em produção, SameSite=Lax com os dados essenciais da sessão. Configure `SESSION_SECRET` em cada ambiente; alterá-lo invalida as sessões existentes.
- Só usuários provisionados em `User` podem acessar o app. Empregados acessam apenas seu perfil, tickets próprios e conversa própria. Analistas podem consultar a fila da empresa e só responder conversas que assumiram.
- As rotas protegidas recarregam usuário e role do banco. Senhas são derivadas com scrypt; não são armazenadas em texto puro. A redefinição por e-mail não está disponível na autenticação local.
- Cada conversa é um **episódio de atendimento**, não a pessoa. O funcionário tem no máximo uma conversa não encerrada; a próxima demanda só abre sessão nova depois de `CLOSED`. Encerradas permanecem no banco e aparecem na fila do analista apenas no filtro “Todas”, com o detalhe de quem resolveu. Os outros filtros mostram só conversas ativas. A `ChatSession` do funcionário só é criada na **primeira mensagem** (abrir o chat sem falar não polui a fila). Com o assistente em `BOT_ACTIVE`, o funcionário pode encerrar (`end_conversation`, chip “Isso resolveu meu problema”) para zerar o `0/30`; em atendimento humano quem encerra é o analista. Encerrar a conversa **não** resolve o chamado — o analista segue atualizando status no painel.
- Cada mensagem possui `readAtByEmployee`, `readAtByAnalyst`, `sender` e `senderUserId`/relação `senderUser`; assim ficam registrados o tipo de remetente e a pessoa específica que enviou cada mensagem. O histórico completo é carregado por Server Action e cacheado no TanStack Query. O serviço confere ownership/atribuição e estado humano antes de gravar. A UI atualiza por polling/refetch autorizado (TanStack Query), não por payload de Realtime.
- A autenticação local não gera identidade Supabase Auth. Por isso `ChatSession`/`ChatMessage` têm RLS negando `anon`/`authenticated` (migration `20261108140000_harden_chat_rls`): o browser não lê conversas pela anon key. O Prisma segue via `DATABASE_URL`. Realtime com conteúdo de chat só deve voltar após JWT customizado no Supabase alinhado ao `User.id`.
- A confiança começa em 100 e só cai com evidência de tool, nunca sobe depois de uma busca sem artigos. Central de Ajuda com resultados: 85. Sem resultados: 40, e a conversa é encaminhada. Lista de chamados do próprio funcionário: 88, ou 72 se não houver aberto. Status operacional sem integração: no máximo 60. Rascunho comum: 84; rascunho crítico: 70. Resposta sem nenhuma tool: 62. Abaixo de 50 o servidor encaminha mesmo que o modelo não chame a tool. Uma classificação Mastra com schema Zod devolve intenção, prioridade, confiança e justificativa; o número exibido é o menor entre essa confiança e a evidência das tools. Confiança, motivo e início do handoff ficam em `ChatSession`; a fila do analista exibe esses dados e o tempo aguardando. Acima de cada resposta do agente, a trilha mostra as ações (“consultou seus chamados”) e o bloco “Decisão do agente” abre confiança e justificativa pública. Não há cadeia privada de pensamento nesse bloco.
- Presença online (`use-online-presence`) usa Supabase Realtime Presence em canal público por conversa (`presence:session:{sessionId}`), só com metadados efêmeros (`id`, `name`, `role`). Não lê `ChatSession`/`ChatMessage`. O lobby `presence:analysts` marca analistas com a aba do console aberta e alimenta a contagem pública no login; o login só observa o canal (sem `track`). Realtime com conteúdo de chat continua dependendo de JWT customizado.
- No login, “Resolvidos sem fila” é a % de `ChatSession` `CLOSED` com `handoffAt` nulo; “Primeira resposta, em média” permanece estática por enquanto.

## Chat e ferramentas do agente

`POST /api/conversations/me` salva a mensagem do funcionário e, quando a conversa está em `BOT_ACTIVE`, chama o agente. Em `WAITING_HUMAN` ou `HUMAN_ACTIVE`, o bot não responde. O limite é de **30 mensagens por conversa** (`CONVERSATION_MESSAGE_LIMIT`); eventos `SYSTEM` não contam. Não há quota diária de IA por usuário (o teto do desafio é o episódio). No limite, a UI bloqueia o composer e oferece `request_analyst` ou `end_conversation` para começar outra sessão.

Tools em `lib/mastra/tools`, com `inputSchema` e `outputSchema` Zod. O `userId` vem do contexto do request, não do modelo:

- `search_knowledge_base`: busca a Central de Ajuda.
- `check_system_status`: informa que VPN, e-mail, servidores e Wi-Fi estão sem integração de monitoramento, retornando `UNKNOWN` em vez de inventar um status operacional.
- `list_my_tickets`: consulta apenas tickets do funcionário autenticado.
- `ask_ticket_impact`: pergunta guiada de impacto (“quem está sendo afetado?”) para classificar prioridade.
- `create_ticket`: dispara o workflow de abertura (extrair dados, checar duplicidade, suspender até a confirmação). A gravação só acontece depois do botão de confirmação, que retoma o workflow e valida de novo o rascunho (`CRITICAL` é a prioridade urgente e `category` é um enum, não `categoryId`). Falha transitória de banco tenta de novo até três vezes; se persistir, a conversa vai para `WAITING_HUMAN`.
- `add_ticket_comment`: adiciona complemento apenas a chamado aberto pelo próprio funcionário.
- `request_helpdesk_analyst`: sinaliza o transbordo. O servidor marca `WAITING_HUMAN` no `onStepFinish`, antes do fim do stream, e guarda o resumo para a fila.

O system prompt reutilizável está em `lib/agent/prompts/service-desk.ts` e segue as regras do service desk do desafio (Anexo A): tipos INC/REQ, categorias, prioridade/SLA, rascunho com confirmação, sem duplicidade, handoff e privacidade por dono. `search_knowledge_base` prioriza resultados por relevância de título, palavras-chave e conteúdo; `useChat` recebe a resposta em streaming e exibe estados públicos como “Consultando seus chamados...” enquanto as tools executam; o texto final também aparece progressivamente. As mensagens do assistente armazenam `thoughtProcess` como resumo legível de ações, confiança estimada e justificativa pública — **não transmitimos nem armazenamos cadeia privada de pensamento**. Tool calls são limitadas a cinco passos por resposta; respostas do Gemini ficam limitadas a 700 tokens. O chip “Falar com um analista” entra no metadata quando há chamado vencido ou `CRITICAL` ainda em consulta. O handoff em si não depende só do modelo: `lib/agent/handoff-policy.ts`, chamado no `onStepFinish` do Mastra, força a transferência quando a pessoa pede analista, quando o rascunho ou o chamado já vinculado é `CRITICAL`, ou quando o chamado vinculado está vencido. Confiança abaixo de 50 também transfere. A confirmação de um rascunho crítico encaminha a conversa se ela ainda estiver com o agente e marca o chamado como aguardando analista.

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

Os testes automatizados rodam com `npm test` (Jest); `npm run test:watch` inicia o modo de observação. A suíte cobre SLA, validações, histórico contextual, confiança, handoff obrigatório, senha de demonstração e transições/permissões do ciclo de conversas.

## Como o agente decide

A cada mensagem do funcionário, com a conversa em `BOT_ACTIVE`, o servidor chama o agente Mastra com o histórico do Prisma e as tools. O modelo escolhe a tool; o servidor executa e monta os cards a partir do `outputSchema`, não de JSON livre. A abertura de chamado é um workflow determinístico: extrair, checar duplicidade, pedir confirmação e só então persistir. Rascunho não grava chamado. Confirmação, comentário e transferência passam por `lib/services/`. Se a conversa está `WAITING_HUMAN` ou `HUMAN_ACTIVE`, o agente não responde.

Depois das tools, o servidor aplica a política de handoff e grava `thoughtProcess` com as ações, o nível de confiança e uma justificativa curta. A interface mostra a trilha acima da bolha e o detalhe em “Decisão do agente”, no chat do funcionário e no console do analista. O resumo do transbordo fica no topo da conversa transferida. O painel de chamados do analista mostra descrição e prioridade.

## Qualidade das decisões

As regras que não podem depender do modelo estão no servidor e têm teste: SLA e atraso, duplicata ativa e reabertura em 7 dias, confirmação do rascunho, `affectedUserIds` forçado ao usuário da sessão, limite de 30 mensagens, pausa do agente fora de `BOT_ACTIVE`, handoff em pedido explícito / crítico / chamado vinculado vencido, e a escala de confiança. O prompt cobre o que ainda é conversa (perguntar o que falta, não inventar status, ficar em TI). Assunto fora de TI (RH, financeiro, facilities) continua orientado pelo prompt, sem um classificador à parte.

## Trade-offs

- **Mastra para o agente e o workflow de abertura, AI SDK só na UI.** O PRD pede um framework de agente. O Mastra executa tools, a classificação com schema e o fluxo de rascunho. O `useChat` permanece para o streaming que a tela já consome.
- **Polling de 15s no outro lado da conversa, streaming na resposta do agente.** Payload de chat no Supabase Realtime espera JWT customizado; hoje a anon key não lê `ChatSession`/`ChatMessage`.
- **Duplicata por título, tipo e categoria exatos.** Evita o segundo chamado idêntico. Não detecta o mesmo problema escrito de outro jeito.
- **Confiança por evidência de tool, com teto sobre o número do modelo.** A classificação estruturada sugere a nota; o servidor não deixa ela passar da evidência. Dá para explicar e testar. Não mede nuance (“entendi pela metade”).
- **Serviço de chamados no mesmo Postgres, com retry só para falha transitória de conexão.** A separação é de camada (`lib/services` / `lib/mastra`). `check_system_status` devolve `UNKNOWN` porque não há monitoramento, e isso não simula o chamado legado fora do ar.
- **Login de exemplo aceita qualquer senha só fora de produção.** Em produção vale o hash.

## Com mais tempo

Testes de integração com PostgreSQL, duplicata semântica, guarda de assunto fora de TI antes de abrir chamado, e deploy com cota no Gemini para limitar custo. A ausência de deploy não faz parte do critério mínimo do desafio.

O console do analista atualiza a fila e o chat por **polling autorizado** (foco/intervalo), permite assumir/devolver/encerrar conversa e enviar mensagens identificadas pelo analista atribuído. A timeline mostra divisores `SYSTEM` de transferência, assume, devolução e encerramento; o histórico é refetchado após qualquer ação. O aside de chamados mostra descrição, prioridade, preview e o botão “Ver todos os chamados...” quando há mais do que o recorte. Detalhes de confiança e justificativa ficam no bloco “Decisão do agente”, acima das respostas. Nunca use credenciais demo de produção, não exponha chaves de serviço e limite o consumo do endpoint Gemini no deploy.

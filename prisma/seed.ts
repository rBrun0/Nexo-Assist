import "dotenv/config";

import {
  ChatStatus,
  MessageSender,
  PrismaClient,
  Priority,
  Role,
  TicketCategory,
  TicketStatus,
  TicketType,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { ANALYST_LEVELS } from "../lib/constants";
import { hashPassword } from "../lib/auth/password";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL não está configurada.");
}

function getDemoPassword(): string {
  const password =
    process.env.DEMO_USER_PASSWORD ??
    (process.env.NODE_ENV === "production" ? undefined : "123456");
  if (!password) {
    throw new Error(
      "Defina DEMO_USER_PASSWORD antes de executar o seed em produção.",
    );
  }
  if (process.env.NODE_ENV === "production" && password.length < 12) {
    throw new Error(
      "DEMO_USER_PASSWORD deve ter pelo menos 12 caracteres em produção.",
    );
  }
  return password;
}
const demoPassword = getDemoPassword();

const pool = new Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

/** IDs fixos para upsert idempotente (nunca apaga dados). */
const SEED_IDS = {
  sessions: {
    carlosWaiting: "a1000000-0000-4000-8000-000000000001",
    anaBot: "a1000000-0000-4000-8000-000000000002",
    brunoHuman: "a1000000-0000-4000-8000-000000000003",
    dianaWaitingLow: "a1000000-0000-4000-8000-000000000004",
    eduardoHumanOther: "a1000000-0000-4000-8000-000000000005",
    carlosClosed: "a1000000-0000-4000-8000-000000000006",
    fernandaWaitingTimer: "a1000000-0000-4000-8000-000000000007",
    anaClosedByAnalyst: "a1000000-0000-4000-8000-000000000008",
  },
  messages: {
    carlos1: "b1000000-0000-4000-8000-000000000001",
    carlos2: "b1000000-0000-4000-8000-000000000002",
    carlos3: "b1000000-0000-4000-8000-000000000003",
    carlos4: "b1000000-0000-4000-8000-000000000004",
    ana1: "b1000000-0000-4000-8000-000000000011",
    ana2: "b1000000-0000-4000-8000-000000000012",
    ana3: "b1000000-0000-4000-8000-000000000013",
    bruno1: "b1000000-0000-4000-8000-000000000021",
    bruno2: "b1000000-0000-4000-8000-000000000022",
    bruno3: "b1000000-0000-4000-8000-000000000023",
    bruno4: "b1000000-0000-4000-8000-000000000024",
    diana1: "b1000000-0000-4000-8000-000000000031",
    diana2: "b1000000-0000-4000-8000-000000000032",
    diana3: "b1000000-0000-4000-8000-000000000033",
    eduardo1: "b1000000-0000-4000-8000-000000000041",
    eduardo2: "b1000000-0000-4000-8000-000000000042",
    eduardo3: "b1000000-0000-4000-8000-000000000043",
    closed1: "b1000000-0000-4000-8000-000000000051",
    closed2: "b1000000-0000-4000-8000-000000000052",
    closed3: "b1000000-0000-4000-8000-000000000053",
    fernanda1: "b1000000-0000-4000-8000-000000000061",
    fernanda2: "b1000000-0000-4000-8000-000000000062",
    fernanda3: "b1000000-0000-4000-8000-000000000063",
    anaClosed1: "b1000000-0000-4000-8000-000000000071",
    anaClosed2: "b1000000-0000-4000-8000-000000000072",
    anaClosed3: "b1000000-0000-4000-8000-000000000073",
  },
} as const;

const demoAccounts = [
  {
    email: "carlos.silva@nexo.com.br",
    name: "Carlos Silva",
    job: "Financeiro",
    role: Role.EMPLOYEE,
  },
  {
    email: "ana.souza@nexo.com.br",
    name: "Ana Souza",
    job: "Financeiro",
    role: Role.EMPLOYEE,
  },
  {
    email: "bruno.lima@nexo.com.br",
    name: "Bruno Lima",
    job: "Operações",
    role: Role.EMPLOYEE,
  },
  {
    email: "diana.costa@nexo.com.br",
    name: "Diana Costa",
    job: "RH",
    role: Role.EMPLOYEE,
  },
  {
    email: "eduardo.ramos@nexo.com.br",
    name: "Eduardo Ramos",
    job: "Comercial",
    role: Role.EMPLOYEE,
  },
  {
    email: "fernanda.alves@nexo.com.br",
    name: "Fernanda Alves",
    job: "Marketing",
    role: Role.EMPLOYEE,
  },
  {
    email: "analista.ti@nexo.com.br",
    name: "Suporte N1/N2",
    job: ANALYST_LEVELS.N1,
    role: Role.ANALYST,
  },
  {
    email: "suporte.n1.n2@nexo.com.br",
    name: "Suporte N1 e N2",
    job: ANALYST_LEVELS.N2,
    role: Role.ANALYST,
  },
] as const;

async function main() {
  const password = hashPassword(demoPassword);
  const [
    employee1,
    employee2,
    employee3,
    employee4,
    employee5,
    employee6,
    analyst,
    analyst2,
  ] = await Promise.all(
    demoAccounts.map((account) =>
      prisma.user.upsert({
        where: { email: account.email },
        update: {
          name: account.name,
          job: account.job,
          role: account.role,
          password,
        },
        create: {
          email: account.email,
          name: account.name,
          job: account.job,
          role: account.role,
          password,
        },
      }),
    ),
  );

  const articles = [
    {
      title: "VPN com erro 809",
      content:
        "Reinstale o cliente de VPN pelo portal de softwares e reinicie o computador. Vale apenas para Windows 10; no Windows 11, abra um chamado.",
      category: TicketCategory.NETWORK_VPN,
      keywords: "vpn, erro 809, windows 10, conexao",
    },
    {
      title: "Horário do Service Desk e plantão",
      content:
        "Horário do service desk: de segunda a sexta, das 8h às 18h. Chamados críticos têm plantão 24 horas.",
      category: TicketCategory.OTHER,
      keywords: "horario, atendimento, plantao, suporte",
    },
    {
      title: "Solicitação de acesso ao SAP",
      content:
        "Para solicitar acesso ao SAP, inclua a aprovação formal do gestor direto no chamado.",
      category: TicketCategory.ACCESS,
      keywords: "sap, acesso, senha, permissao",
    },
    {
      title: "Configuração de e-mail no celular",
      content:
        "Configure o Outlook Mobile com seu e-mail corporativo e aprove o acesso pelo aplicativo de MFA.",
      category: TicketCategory.EMAIL,
      keywords: "email, outlook, celular, mfa",
    },
    {
      title: "Redefinição de senha corporativa",
      content:
        "Use o portal de identidade da Nexo para redefinir sua senha. Se a conta estiver bloqueada, abra um chamado de acesso.",
      category: TicketCategory.ACCESS,
      keywords: "senha, redefinir, conta, bloqueio",
    },
    {
      title: "Impressora sem conexão",
      content:
        "Confira se a impressora está ligada e conectada à rede corporativa. Se continuar offline, informe o nome ou patrimônio do equipamento ao suporte.",
      category: TicketCategory.HARDWARE,
      keywords: "impressora, offline, hardware, rede",
    },
    {
      title: "Acesso ao Wi-Fi corporativo",
      content:
        "Conecte-se à rede Nexo-Corp usando suas credenciais corporativas. Para dispositivos novos, solicite o cadastro ao Service Desk.",
      category: TicketCategory.NETWORK_VPN,
      keywords: "wifi, wi-fi, rede, acesso",
    },
    {
      title: "Instalação de software aprovado",
      content:
        "Softwares da lista homologada podem ser instalados pelo portal de softwares. Pedidos fora da lista exigem chamado de SOFTWARE com justificativa do gestor.",
      category: TicketCategory.SOFTWARE,
      keywords: "software, instalacao, portal, homologado",
    },
    {
      title: "Notebook lento após atualização",
      content:
        "Após atualizações grandes do Windows, execute a limpeza de disco e reinicie. Se o desempenho não voltar em 24 horas, abra um chamado de HARDWARE informando a build instalada.",
      category: TicketCategory.HARDWARE,
      keywords: "notebook, lento, windows, atualizacao, hardware",
    },
    {
      title: "Caixa de e-mail cheia",
      content:
        "Arquive ou exclua mensagens antigas no Outlook. Se a cota continuar estourada, abra um chamado de EMAIL solicitando aumento temporário de caixa.",
      category: TicketCategory.EMAIL,
      keywords: "email, cota, outlook, caixa cheia",
    },
  ];

  for (const article of articles) {
    const existing = await prisma.knowledgeBase.findFirst({
      where: { title: article.title },
    });

    if (existing) {
      await prisma.knowledgeBase.update({
        where: { id: existing.id },
        data: article,
      });
    } else {
      await prisma.knowledgeBase.create({ data: article });
    }
  }

  const now = new Date();
  const minutesAgo = (m: number) => new Date(now.getTime() - m * 60_000);
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60_000);
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60_000);
  const sixDaysAgo = daysAgo(6);
  const fourDaysAgo = daysAgo(4);
  const oneWeekAgo = daysAgo(7);
  const twoWeeksAgo = daysAgo(14);

  const [
    ticketCarlosOverdue,
    ,
    ,
    ,
    ticketBrunoInProgress,
    ,
    ,
    ,
    ticketEduardo,
  ] = await Promise.all([
    prisma.ticket.upsert({
      where: { code: "INC-20311" },
      update: {
        title: "Notebook lento após atualização do Windows",
        status: TicketStatus.WAITING_ANALYST,
        priority: Priority.MEDIUM,
        category: TicketCategory.HARDWARE,
        slaDeadline: sixDaysAgo,
        isOverdue: true,
        updatedAt: sixDaysAgo,
      },
      create: {
        code: "INC-20311",
        title: "Notebook lento após atualização do Windows",
        description:
          "Após a última atualização do Windows 11, o notebook leva 15 minutos para inicializar e os programas travam constantemente.",
        type: TicketType.INCIDENT,
        category: TicketCategory.HARDWARE,
        priority: Priority.MEDIUM,
        status: TicketStatus.WAITING_ANALYST,
        slaDeadline: sixDaysAgo,
        isOverdue: true,
        createdAt: sixDaysAgo,
        updatedAt: sixDaysAgo,
        createdById: employee1.id,
        affectedUsers: { connect: [{ id: employee1.id }] },
      },
    }),
    prisma.ticket.upsert({
      where: { code: "REQ-10442" },
      update: {
        title: "Segundo monitor para home office",
        status: TicketStatus.APPROVED,
        priority: Priority.LOW,
        category: TicketCategory.HARDWARE,
        updatedAt: oneWeekAgo,
      },
      create: {
        code: "REQ-10442",
        title: "Segundo monitor para home office",
        description:
          "Solicitação de monitor adicional de 24 polegadas para setup de trabalho remoto.",
        type: TicketType.REQUEST,
        category: TicketCategory.HARDWARE,
        priority: Priority.LOW,
        status: TicketStatus.APPROVED,
        slaDeadline: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        createdAt: oneWeekAgo,
        updatedAt: oneWeekAgo,
        createdById: employee1.id,
        affectedUsers: { connect: [{ id: employee1.id }] },
      },
    }),
    prisma.ticket.upsert({
      where: { code: "INC-20150" },
      update: {
        title: "Senha do SAP bloqueada",
        status: TicketStatus.RESOLVED,
        priority: Priority.MEDIUM,
        category: TicketCategory.ACCESS,
        updatedAt: fourDaysAgo,
      },
      create: {
        code: "INC-20150",
        title: "Senha do SAP bloqueada",
        description:
          "Tentativas incorretas de senha causaram o bloqueio do usuário no ambiente de produção.",
        type: TicketType.INCIDENT,
        category: TicketCategory.ACCESS,
        priority: Priority.MEDIUM,
        status: TicketStatus.RESOLVED,
        slaDeadline: fourDaysAgo,
        createdAt: fourDaysAgo,
        updatedAt: fourDaysAgo,
        createdById: employee2.id,
        affectedUsers: { connect: [{ id: employee2.id }] },
      },
    }),
    prisma.ticket.upsert({
      where: { code: "INC-19880" },
      update: {
        title: "Outlook não sincroniza no notebook",
        status: TicketStatus.OPEN,
        updatedAt: now,
      },
      create: {
        code: "INC-19880",
        title: "Outlook não sincroniza no notebook",
        description:
          "O Outlook da Ana fica offline intermitentemente desde a migração de tenant.",
        type: TicketType.INCIDENT,
        category: TicketCategory.EMAIL,
        priority: Priority.HIGH,
        status: TicketStatus.OPEN,
        slaDeadline: new Date(now.getTime() + 4 * 60 * 60 * 1000),
        isOverdue: false,
        createdById: employee2.id,
        affectedUsers: { connect: [{ id: employee2.id }] },
      },
    }),
    // Bruno — chamado em andamento (conversa HUMAN_ACTIVE)
    prisma.ticket.upsert({
      where: { code: "INC-20510" },
      update: {
        title: "Impressora do setor offline",
        status: TicketStatus.IN_PROGRESS,
        priority: Priority.HIGH,
        category: TicketCategory.HARDWARE,
        updatedAt: hoursAgo(2),
      },
      create: {
        code: "INC-20510",
        title: "Impressora do setor offline",
        description:
          "A impressora HP do andar de Operações não aparece na rede desde ontem.",
        type: TicketType.INCIDENT,
        category: TicketCategory.HARDWARE,
        priority: Priority.HIGH,
        status: TicketStatus.IN_PROGRESS,
        slaDeadline: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        isOverdue: false,
        createdAt: hoursAgo(5),
        updatedAt: hoursAgo(2),
        createdById: employee3.id,
        affectedUsers: { connect: [{ id: employee3.id }] },
      },
    }),
    // Carlos — extras para “Ver todos…” no aside (>2 outros)
    prisma.ticket.upsert({
      where: { code: "REQ-10501" },
      update: {
        title: "Instalação do Adobe Acrobat",
        status: TicketStatus.OPEN,
        priority: Priority.LOW,
        category: TicketCategory.SOFTWARE,
        updatedAt: daysAgo(2),
      },
      create: {
        code: "REQ-10501",
        title: "Instalação do Adobe Acrobat",
        description:
          "Preciso do Acrobat Pro para assinar contratos do financeiro.",
        type: TicketType.REQUEST,
        category: TicketCategory.SOFTWARE,
        priority: Priority.LOW,
        status: TicketStatus.OPEN,
        slaDeadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        createdAt: daysAgo(2),
        updatedAt: daysAgo(2),
        createdById: employee1.id,
        affectedUsers: { connect: [{ id: employee1.id }] },
      },
    }),
    prisma.ticket.upsert({
      where: { code: "INC-20440" },
      update: {
        title: "VPN cai ao conectar em home office",
        status: TicketStatus.OPEN,
        priority: Priority.CRITICAL,
        category: TicketCategory.NETWORK_VPN,
        updatedAt: hoursAgo(1),
      },
      create: {
        code: "INC-20440",
        title: "VPN cai ao conectar em home office",
        description:
          "Erro 809 ao conectar na VPN; equipe financeira sem acesso aos sistemas.",
        type: TicketType.INCIDENT,
        category: TicketCategory.NETWORK_VPN,
        priority: Priority.CRITICAL,
        status: TicketStatus.OPEN,
        slaDeadline: new Date(now.getTime() + 45 * 60 * 1000),
        isOverdue: false,
        createdAt: hoursAgo(1),
        updatedAt: hoursAgo(1),
        createdById: employee1.id,
        affectedUsers: { connect: [{ id: employee1.id }] },
      },
    }),
    // Fechado — cobertura de status CLOSED / OTHER
    prisma.ticket.upsert({
      where: { code: "REQ-19001" },
      update: {
        title: "Solicitação de crachá provisório",
        status: TicketStatus.CLOSED,
        priority: Priority.LOW,
        category: TicketCategory.OTHER,
        updatedAt: twoWeeksAgo,
      },
      create: {
        code: "REQ-19001",
        title: "Solicitação de crachá provisório",
        description: "Crachá extraviado; emitido provisório e depois permanente.",
        type: TicketType.REQUEST,
        category: TicketCategory.OTHER,
        priority: Priority.LOW,
        status: TicketStatus.CLOSED,
        slaDeadline: twoWeeksAgo,
        createdAt: daysAgo(20),
        updatedAt: twoWeeksAgo,
        createdById: employee1.id,
        affectedUsers: { connect: [{ id: employee1.id }] },
      },
    }),
    // Eduardo — ticket vinculado à conversa do outro analista
    prisma.ticket.upsert({
      where: { code: "INC-20620" },
      update: {
        title: "Acesso ao CRM comercial negado",
        status: TicketStatus.IN_PROGRESS,
        priority: Priority.MEDIUM,
        category: TicketCategory.ACCESS,
        updatedAt: hoursAgo(3),
      },
      create: {
        code: "INC-20620",
        title: "Acesso ao CRM comercial negado",
        description:
          "Após troca de área, o acesso ao CRM não foi provisionado.",
        type: TicketType.INCIDENT,
        category: TicketCategory.ACCESS,
        priority: Priority.MEDIUM,
        status: TicketStatus.IN_PROGRESS,
        slaDeadline: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        createdAt: hoursAgo(8),
        updatedAt: hoursAgo(3),
        createdById: employee5.id,
        affectedUsers: { connect: [{ id: employee5.id }] },
      },
    }),
  ]);

  // --- Conversas (1 ativa por employee; CLOSED histórico do Carlos) ---

  await Promise.all([
    prisma.chatSession.upsert({
      where: { id: SEED_IDS.sessions.carlosWaiting },
      update: {
        userId: employee1.id,
        status: ChatStatus.WAITING_HUMAN,
        ticketId: ticketCarlosOverdue.id,
        assignedAnalystId: null,
        handoffSummary:
          "Notebook lento pós-atualização; colaborador já reiniciou e limpou disco sem sucesso.",
        handoffReason: "Chamado vencido exige analista humano.",
        handoffAt: minutesAgo(25),
        confidenceScore: 72,
        closedAt: null,
        updatedAt: minutesAgo(5),
      },
      create: {
        id: SEED_IDS.sessions.carlosWaiting,
        userId: employee1.id,
        status: ChatStatus.WAITING_HUMAN,
        ticketId: ticketCarlosOverdue.id,
        handoffSummary:
          "Notebook lento pós-atualização; colaborador já reiniciou e limpou disco sem sucesso.",
        handoffReason: "Chamado vencido exige analista humano.",
        handoffAt: minutesAgo(25),
        confidenceScore: 72,
        createdAt: hoursAgo(2),
        updatedAt: minutesAgo(5),
      },
    }),
    prisma.chatSession.upsert({
      where: { id: SEED_IDS.sessions.anaBot },
      update: {
        userId: employee2.id,
        status: ChatStatus.BOT_ACTIVE,
        ticketId: null,
        assignedAnalystId: null,
        handoffSummary: null,
        handoffReason: null,
        handoffAt: null,
        confidenceScore: 88,
        closedAt: null,
        updatedAt: minutesAgo(3),
      },
      create: {
        id: SEED_IDS.sessions.anaBot,
        userId: employee2.id,
        status: ChatStatus.BOT_ACTIVE,
        confidenceScore: 88,
        createdAt: hoursAgo(1),
        updatedAt: minutesAgo(3),
      },
    }),
    prisma.chatSession.upsert({
      where: { id: SEED_IDS.sessions.brunoHuman },
      update: {
        userId: employee3.id,
        status: ChatStatus.HUMAN_ACTIVE,
        ticketId: ticketBrunoInProgress.id,
        assignedAnalystId: analyst.id,
        handoffSummary: "Impressora do setor offline; precisa verificação na rede.",
        handoffReason: "Hardware local fora do alcance do agente.",
        handoffAt: hoursAgo(3),
        confidenceScore: 55,
        closedAt: null,
        updatedAt: minutesAgo(8),
      },
      create: {
        id: SEED_IDS.sessions.brunoHuman,
        userId: employee3.id,
        status: ChatStatus.HUMAN_ACTIVE,
        ticketId: ticketBrunoInProgress.id,
        assignedAnalystId: analyst.id,
        handoffSummary: "Impressora do setor offline; precisa verificação na rede.",
        handoffReason: "Hardware local fora do alcance do agente.",
        handoffAt: hoursAgo(3),
        confidenceScore: 55,
        createdAt: hoursAgo(5),
        updatedAt: minutesAgo(8),
      },
    }),
    prisma.chatSession.upsert({
      where: { id: SEED_IDS.sessions.dianaWaitingLow },
      update: {
        userId: employee4.id,
        status: ChatStatus.WAITING_HUMAN,
        ticketId: null,
        assignedAnalystId: null,
        handoffSummary:
          "Descrição ambígua sobre “sistema interno” sem logs; confiança baixa.",
        handoffReason: "Baixa confiança do agente.",
        handoffAt: minutesAgo(12),
        confidenceScore: 40,
        closedAt: null,
        updatedAt: minutesAgo(10),
      },
      create: {
        id: SEED_IDS.sessions.dianaWaitingLow,
        userId: employee4.id,
        status: ChatStatus.WAITING_HUMAN,
        handoffSummary:
          "Descrição ambígua sobre “sistema interno” sem logs; confiança baixa.",
        handoffReason: "Baixa confiança do agente.",
        handoffAt: minutesAgo(12),
        confidenceScore: 40,
        createdAt: minutesAgo(40),
        updatedAt: minutesAgo(10),
      },
    }),
    prisma.chatSession.upsert({
      where: { id: SEED_IDS.sessions.eduardoHumanOther },
      update: {
        userId: employee5.id,
        status: ChatStatus.HUMAN_ACTIVE,
        ticketId: ticketEduardo.id,
        assignedAnalystId: analyst2.id,
        handoffSummary: "Acesso ao CRM comercial após mudança de área.",
        handoffReason: "Provisionamento de acesso.",
        handoffAt: hoursAgo(4),
        confidenceScore: 60,
        closedAt: null,
        updatedAt: minutesAgo(15),
      },
      create: {
        id: SEED_IDS.sessions.eduardoHumanOther,
        userId: employee5.id,
        status: ChatStatus.HUMAN_ACTIVE,
        ticketId: ticketEduardo.id,
        assignedAnalystId: analyst2.id,
        handoffSummary: "Acesso ao CRM comercial após mudança de área.",
        handoffReason: "Provisionamento de acesso.",
        handoffAt: hoursAgo(4),
        confidenceScore: 60,
        createdAt: hoursAgo(8),
        updatedAt: minutesAgo(15),
      },
    }),
    // Fernanda — WAITING sem ticket, conf alta → "Transferência · contato em 25 min"
    prisma.chatSession.upsert({
      where: { id: SEED_IDS.sessions.fernandaWaitingTimer },
      update: {
        userId: employee6.id,
        status: ChatStatus.WAITING_HUMAN,
        ticketId: null,
        assignedAnalystId: null,
        handoffSummary:
          "Dúvida sobre liberação de ferramenta de design; handoff preventivo.",
        handoffReason: "Colaboradora pediu atendimento humano.",
        handoffAt: minutesAgo(25),
        confidenceScore: 70,
        closedAt: null,
        updatedAt: minutesAgo(20),
      },
      create: {
        id: SEED_IDS.sessions.fernandaWaitingTimer,
        userId: employee6.id,
        status: ChatStatus.WAITING_HUMAN,
        handoffSummary:
          "Dúvida sobre liberação de ferramenta de design; handoff preventivo.",
        handoffReason: "Colaboradora pediu atendimento humano.",
        handoffAt: minutesAgo(25),
        confidenceScore: 70,
        createdAt: hoursAgo(1),
        updatedAt: minutesAgo(20),
      },
    }),
    // CLOSED — Resolvida pelo agente (última msg ASSISTANT; sem assignee)
    prisma.chatSession.upsert({
      where: { id: SEED_IDS.sessions.carlosClosed },
      update: {
        userId: employee1.id,
        status: ChatStatus.CLOSED,
        ticketId: null,
        assignedAnalystId: null,
        handoffSummary: null,
        handoffReason: null,
        handoffAt: null,
        confidenceScore: 90,
        closedAt: daysAgo(10),
        updatedAt: daysAgo(10),
      },
      create: {
        id: SEED_IDS.sessions.carlosClosed,
        userId: employee1.id,
        status: ChatStatus.CLOSED,
        confidenceScore: 90,
        closedAt: daysAgo(10),
        createdAt: daysAgo(11),
        updatedAt: daysAgo(10),
      },
    }),
    // CLOSED — Resolvida pelo analista (histórico da Ana; não conflita com BOT_ACTIVE)
    prisma.chatSession.upsert({
      where: { id: SEED_IDS.sessions.anaClosedByAnalyst },
      update: {
        userId: employee2.id,
        status: ChatStatus.CLOSED,
        ticketId: null,
        assignedAnalystId: analyst.id,
        handoffSummary: "Senha SAP — atendido por analista.",
        handoffReason: "Desbloqueio manual.",
        handoffAt: daysAgo(5),
        confidenceScore: 55,
        closedAt: daysAgo(4),
        updatedAt: daysAgo(4),
      },
      create: {
        id: SEED_IDS.sessions.anaClosedByAnalyst,
        userId: employee2.id,
        status: ChatStatus.CLOSED,
        assignedAnalystId: analyst.id,
        handoffSummary: "Senha SAP — atendido por analista.",
        handoffReason: "Desbloqueio manual.",
        handoffAt: daysAgo(5),
        confidenceScore: 55,
        closedAt: daysAgo(4),
        createdAt: daysAgo(5),
        updatedAt: daysAgo(4),
      },
    }),
  ]);

  const thoughtProcessAna = {
    actions: [
      { name: "search_knowledge_base", label: "Buscou artigos de e-mail" },
      { name: "list_my_tickets", label: "Consultou chamados da Ana" },
    ],
    confidence: "high",
    rationale:
      "Há artigo de caixa cheia e chamado OPEN de Outlook; sugerir passos e status.",
  };

  const anaTicketStatusMetadata = {
    kind: "ticket_status" as const,
    ticket: {
      id: (
        await prisma.ticket.findUniqueOrThrow({ where: { code: "INC-19880" } })
      ).id,
      code: "INC-19880",
      title: "Outlook não sincroniza no notebook",
      status: "Aberto",
      priority: "Alta",
      category: "E-mail",
      description:
        "O Outlook da Ana fica offline intermitentemente desde a migração de tenant.",
      isOverdue: false,
      updatedAt: now.toISOString(),
    },
    options: [
      { label: "Não obrigado", message: "Não obrigado" },
      { label: "Falar com analista", message: "Quero falar com um analista" },
    ],
  };

  await Promise.all([
    // Carlos — WAITING_HUMAN + ticket vencido
    prisma.chatMessage.upsert({
      where: { id: SEED_IDS.messages.carlos1 },
      update: {
        chatSessionId: SEED_IDS.sessions.carlosWaiting,
        sender: MessageSender.EMPLOYEE,
        senderUserId: employee1.id,
        content:
          "Meu notebook está muito lento depois da atualização do Windows.",
        readAtByEmployee: hoursAgo(2),
        readAtByAnalyst: null,
        createdAt: hoursAgo(2),
      },
      create: {
        id: SEED_IDS.messages.carlos1,
        chatSessionId: SEED_IDS.sessions.carlosWaiting,
        sender: MessageSender.EMPLOYEE,
        senderUserId: employee1.id,
        content:
          "Meu notebook está muito lento depois da atualização do Windows.",
        readAtByEmployee: hoursAgo(2),
        createdAt: hoursAgo(2),
      },
    }),
    prisma.chatMessage.upsert({
      where: { id: SEED_IDS.messages.carlos2 },
      update: {
        chatSessionId: SEED_IDS.sessions.carlosWaiting,
        sender: MessageSender.ASSISTANT,
        senderUserId: null,
        content:
          "Encontrei o chamado INC-20311 (vencido). Vou transferir para o suporte N2.",
        thoughtProcess: {
          actions: [
            { name: "list_my_tickets", label: "Consultou INC-20311" },
            { name: "request_human_handoff", label: "Solicitou analista" },
          ],
          confidence: "medium",
          rationale: "Chamado overdue; handoff automático.",
        },
        readAtByEmployee: hoursAgo(1),
        readAtByAnalyst: null,
        createdAt: minutesAgo(30),
      },
      create: {
        id: SEED_IDS.messages.carlos2,
        chatSessionId: SEED_IDS.sessions.carlosWaiting,
        sender: MessageSender.ASSISTANT,
        content:
          "Encontrei o chamado INC-20311 (vencido). Vou transferir para o suporte N2.",
        thoughtProcess: {
          actions: [
            { name: "list_my_tickets", label: "Consultou INC-20311" },
            { name: "request_human_handoff", label: "Solicitou analista" },
          ],
          confidence: "medium",
          rationale: "Chamado overdue; handoff automático.",
        },
        readAtByEmployee: hoursAgo(1),
        createdAt: minutesAgo(30),
      },
    }),
    prisma.chatMessage.upsert({
      where: { id: SEED_IDS.messages.carlos3 },
      update: {
        chatSessionId: SEED_IDS.sessions.carlosWaiting,
        sender: MessageSender.SYSTEM,
        content: "Transferida para suporte N2",
        createdAt: minutesAgo(25),
      },
      create: {
        id: SEED_IDS.messages.carlos3,
        chatSessionId: SEED_IDS.sessions.carlosWaiting,
        sender: MessageSender.SYSTEM,
        content: "Transferida para suporte N2",
        createdAt: minutesAgo(25),
      },
    }),
    prisma.chatMessage.upsert({
      where: { id: SEED_IDS.messages.carlos4 },
      update: {
        chatSessionId: SEED_IDS.sessions.carlosWaiting,
        sender: MessageSender.EMPLOYEE,
        senderUserId: employee1.id,
        content: "Ok, aguardo. Preciso do notebook hoje à tarde.",
        readAtByEmployee: minutesAgo(5),
        readAtByAnalyst: null,
        createdAt: minutesAgo(5),
      },
      create: {
        id: SEED_IDS.messages.carlos4,
        chatSessionId: SEED_IDS.sessions.carlosWaiting,
        sender: MessageSender.EMPLOYEE,
        senderUserId: employee1.id,
        content: "Ok, aguardo. Preciso do notebook hoje à tarde.",
        readAtByEmployee: minutesAgo(5),
        createdAt: minutesAgo(5),
      },
    }),

    // Ana — BOT_ACTIVE + thoughtProcess + card
    prisma.chatMessage.upsert({
      where: { id: SEED_IDS.messages.ana1 },
      update: {
        chatSessionId: SEED_IDS.sessions.anaBot,
        sender: MessageSender.EMPLOYEE,
        senderUserId: employee2.id,
        content: "O Outlook não sincroniza e a caixa parece cheia.",
        readAtByEmployee: minutesAgo(20),
        readAtByAnalyst: minutesAgo(15),
        createdAt: minutesAgo(20),
      },
      create: {
        id: SEED_IDS.messages.ana1,
        chatSessionId: SEED_IDS.sessions.anaBot,
        sender: MessageSender.EMPLOYEE,
        senderUserId: employee2.id,
        content: "O Outlook não sincroniza e a caixa parece cheia.",
        readAtByEmployee: minutesAgo(20),
        readAtByAnalyst: minutesAgo(15),
        createdAt: minutesAgo(20),
      },
    }),
    prisma.chatMessage.upsert({
      where: { id: SEED_IDS.messages.ana2 },
      update: {
        chatSessionId: SEED_IDS.sessions.anaBot,
        sender: MessageSender.ASSISTANT,
        content:
          "Há um artigo sobre caixa cheia e o chamado INC-19880 aberto. Quer ver o status?",
        thoughtProcess: thoughtProcessAna,
        metadata: {
          kind: "article_refs",
          articles: [
            { title: "Caixa de e-mail cheia", category: "E-mail" },
            {
              title: "Configuração de e-mail no celular",
              category: "E-mail",
            },
          ],
        },
        readAtByEmployee: minutesAgo(10),
        createdAt: minutesAgo(18),
      },
      create: {
        id: SEED_IDS.messages.ana2,
        chatSessionId: SEED_IDS.sessions.anaBot,
        sender: MessageSender.ASSISTANT,
        content:
          "Há um artigo sobre caixa cheia e o chamado INC-19880 aberto. Quer ver o status?",
        thoughtProcess: thoughtProcessAna,
        metadata: {
          kind: "article_refs",
          articles: [
            { title: "Caixa de e-mail cheia", category: "E-mail" },
            {
              title: "Configuração de e-mail no celular",
              category: "E-mail",
            },
          ],
        },
        readAtByEmployee: minutesAgo(10),
        createdAt: minutesAgo(18),
      },
    }),
    prisma.chatMessage.upsert({
      where: { id: SEED_IDS.messages.ana3 },
      update: {
        chatSessionId: SEED_IDS.sessions.anaBot,
        sender: MessageSender.ASSISTANT,
        content: "Status do seu chamado de Outlook:",
        thoughtProcess: {
          actions: [{ name: "list_my_tickets", label: "Consultou INC-19880" }],
          confidence: "high",
          rationale: "Exibir status do chamado selecionado.",
        },
        metadata: anaTicketStatusMetadata,
        readAtByEmployee: minutesAgo(3),
        createdAt: minutesAgo(3),
      },
      create: {
        id: SEED_IDS.messages.ana3,
        chatSessionId: SEED_IDS.sessions.anaBot,
        sender: MessageSender.ASSISTANT,
        content: "Status do seu chamado de Outlook:",
        thoughtProcess: {
          actions: [{ name: "list_my_tickets", label: "Consultou INC-19880" }],
          confidence: "high",
          rationale: "Exibir status do chamado selecionado.",
        },
        metadata: anaTicketStatusMetadata,
        readAtByEmployee: minutesAgo(3),
        createdAt: minutesAgo(3),
      },
    }),

    // Bruno — HUMAN_ACTIVE (analista.ti)
    prisma.chatMessage.upsert({
      where: { id: SEED_IDS.messages.bruno1 },
      update: {
        chatSessionId: SEED_IDS.sessions.brunoHuman,
        sender: MessageSender.EMPLOYEE,
        senderUserId: employee3.id,
        content: "A impressora do setor sumiu da rede.",
        readAtByEmployee: hoursAgo(5),
        readAtByAnalyst: hoursAgo(3),
        createdAt: hoursAgo(5),
      },
      create: {
        id: SEED_IDS.messages.bruno1,
        chatSessionId: SEED_IDS.sessions.brunoHuman,
        sender: MessageSender.EMPLOYEE,
        senderUserId: employee3.id,
        content: "A impressora do setor sumiu da rede.",
        readAtByEmployee: hoursAgo(5),
        readAtByAnalyst: hoursAgo(3),
        createdAt: hoursAgo(5),
      },
    }),
    prisma.chatMessage.upsert({
      where: { id: SEED_IDS.messages.bruno2 },
      update: {
        chatSessionId: SEED_IDS.sessions.brunoHuman,
        sender: MessageSender.SYSTEM,
        content: "Transferida para suporte N2",
        createdAt: hoursAgo(3),
      },
      create: {
        id: SEED_IDS.messages.bruno2,
        chatSessionId: SEED_IDS.sessions.brunoHuman,
        sender: MessageSender.SYSTEM,
        content: "Transferida para suporte N2",
        createdAt: hoursAgo(3),
      },
    }),
    prisma.chatMessage.upsert({
      where: { id: SEED_IDS.messages.bruno3 },
      update: {
        chatSessionId: SEED_IDS.sessions.brunoHuman,
        sender: MessageSender.SYSTEM,
        content: `${analyst.name} assumiu — agent pausado`,
        createdAt: hoursAgo(2),
      },
      create: {
        id: SEED_IDS.messages.bruno3,
        chatSessionId: SEED_IDS.sessions.brunoHuman,
        sender: MessageSender.SYSTEM,
        content: `${analyst.name} assumiu — agent pausado`,
        createdAt: hoursAgo(2),
      },
    }),
    prisma.chatMessage.upsert({
      where: { id: SEED_IDS.messages.bruno4 },
      update: {
        chatSessionId: SEED_IDS.sessions.brunoHuman,
        sender: MessageSender.ANALYST,
        senderUserId: analyst.id,
        content:
          "Bruno, vou checar o switch do andar. A impressora é a HP LaserJet do corredor?",
        readAtByEmployee: null,
        readAtByAnalyst: minutesAgo(8),
        createdAt: minutesAgo(8),
      },
      create: {
        id: SEED_IDS.messages.bruno4,
        chatSessionId: SEED_IDS.sessions.brunoHuman,
        sender: MessageSender.ANALYST,
        senderUserId: analyst.id,
        content:
          "Bruno, vou checar o switch do andar. A impressora é a HP LaserJet do corredor?",
        readAtByAnalyst: minutesAgo(8),
        createdAt: minutesAgo(8),
      },
    }),

    // Diana — WAITING baixa confiança
    prisma.chatMessage.upsert({
      where: { id: SEED_IDS.messages.diana1 },
      update: {
        chatSessionId: SEED_IDS.sessions.dianaWaitingLow,
        sender: MessageSender.EMPLOYEE,
        senderUserId: employee4.id,
        content: "O sistema interno não abre, mas não sei o nome dele.",
        readAtByEmployee: minutesAgo(35),
        readAtByAnalyst: null,
        createdAt: minutesAgo(35),
      },
      create: {
        id: SEED_IDS.messages.diana1,
        chatSessionId: SEED_IDS.sessions.dianaWaitingLow,
        sender: MessageSender.EMPLOYEE,
        senderUserId: employee4.id,
        content: "O sistema interno não abre, mas não sei o nome dele.",
        readAtByEmployee: minutesAgo(35),
        createdAt: minutesAgo(35),
      },
    }),
    prisma.chatMessage.upsert({
      where: { id: SEED_IDS.messages.diana2 },
      update: {
        chatSessionId: SEED_IDS.sessions.dianaWaitingLow,
        sender: MessageSender.ASSISTANT,
        content:
          "Não consegui identificar o sistema com segurança. Vou pedir ajuda a um analista.",
        thoughtProcess: {
          actions: [
            { name: "search_knowledge_base", label: "Buscou na base" },
            { name: "request_human_handoff", label: "Solicitou analista" },
          ],
          confidence: "low",
          rationale: "Descrição ambígua; confiança abaixo do limiar.",
        },
        createdAt: minutesAgo(15),
      },
      create: {
        id: SEED_IDS.messages.diana2,
        chatSessionId: SEED_IDS.sessions.dianaWaitingLow,
        sender: MessageSender.ASSISTANT,
        content:
          "Não consegui identificar o sistema com segurança. Vou pedir ajuda a um analista.",
        thoughtProcess: {
          actions: [
            { name: "search_knowledge_base", label: "Buscou na base" },
            { name: "request_human_handoff", label: "Solicitou analista" },
          ],
          confidence: "low",
          rationale: "Descrição ambígua; confiança abaixo do limiar.",
        },
        createdAt: minutesAgo(15),
      },
    }),
    prisma.chatMessage.upsert({
      where: { id: SEED_IDS.messages.diana3 },
      update: {
        chatSessionId: SEED_IDS.sessions.dianaWaitingLow,
        sender: MessageSender.SYSTEM,
        content: "Transferida para suporte N2",
        createdAt: minutesAgo(12),
      },
      create: {
        id: SEED_IDS.messages.diana3,
        chatSessionId: SEED_IDS.sessions.dianaWaitingLow,
        sender: MessageSender.SYSTEM,
        content: "Transferida para suporte N2",
        createdAt: minutesAgo(12),
      },
    }),

    // Eduardo — HUMAN_ACTIVE (outro analista)
    prisma.chatMessage.upsert({
      where: { id: SEED_IDS.messages.eduardo1 },
      update: {
        chatSessionId: SEED_IDS.sessions.eduardoHumanOther,
        sender: MessageSender.EMPLOYEE,
        senderUserId: employee5.id,
        content: "Não consigo entrar no CRM depois da mudança de área.",
        readAtByEmployee: hoursAgo(8),
        readAtByAnalyst: hoursAgo(4),
        createdAt: hoursAgo(8),
      },
      create: {
        id: SEED_IDS.messages.eduardo1,
        chatSessionId: SEED_IDS.sessions.eduardoHumanOther,
        sender: MessageSender.EMPLOYEE,
        senderUserId: employee5.id,
        content: "Não consigo entrar no CRM depois da mudança de área.",
        readAtByEmployee: hoursAgo(8),
        readAtByAnalyst: hoursAgo(4),
        createdAt: hoursAgo(8),
      },
    }),
    prisma.chatMessage.upsert({
      where: { id: SEED_IDS.messages.eduardo2 },
      update: {
        chatSessionId: SEED_IDS.sessions.eduardoHumanOther,
        sender: MessageSender.SYSTEM,
        content: `${analyst2.name} assumiu — agent pausado`,
        createdAt: hoursAgo(4),
      },
      create: {
        id: SEED_IDS.messages.eduardo2,
        chatSessionId: SEED_IDS.sessions.eduardoHumanOther,
        sender: MessageSender.SYSTEM,
        content: `${analyst2.name} assumiu — agent pausado`,
        createdAt: hoursAgo(4),
      },
    }),
    prisma.chatMessage.upsert({
      where: { id: SEED_IDS.messages.eduardo3 },
      update: {
        chatSessionId: SEED_IDS.sessions.eduardoHumanOther,
        sender: MessageSender.ANALYST,
        senderUserId: analyst2.id,
        content: "Eduardo, já solicitei o perfil Comercial no IAM. Confirma em 30 min?",
        readAtByEmployee: null,
        readAtByAnalyst: minutesAgo(15),
        createdAt: minutesAgo(15),
      },
      create: {
        id: SEED_IDS.messages.eduardo3,
        chatSessionId: SEED_IDS.sessions.eduardoHumanOther,
        sender: MessageSender.ANALYST,
        senderUserId: analyst2.id,
        content: "Eduardo, já solicitei o perfil Comercial no IAM. Confirma em 30 min?",
        readAtByAnalyst: minutesAgo(15),
        createdAt: minutesAgo(15),
      },
    }),

    // CLOSED histórico Carlos
    prisma.chatMessage.upsert({
      where: { id: SEED_IDS.messages.closed1 },
      update: {
        chatSessionId: SEED_IDS.sessions.carlosClosed,
        sender: MessageSender.EMPLOYEE,
        senderUserId: employee1.id,
        content: "Como reseto a senha do Wi-Fi?",
        createdAt: daysAgo(11),
      },
      create: {
        id: SEED_IDS.messages.closed1,
        chatSessionId: SEED_IDS.sessions.carlosClosed,
        sender: MessageSender.EMPLOYEE,
        senderUserId: employee1.id,
        content: "Como reseto a senha do Wi-Fi?",
        createdAt: daysAgo(11),
      },
    }),
    prisma.chatMessage.upsert({
      where: { id: SEED_IDS.messages.closed2 },
      update: {
        chatSessionId: SEED_IDS.sessions.carlosClosed,
        sender: MessageSender.ASSISTANT,
        content:
          "Use a rede Nexo-Corp com suas credenciais. Problema resolvido pelo artigo da base.",
        thoughtProcess: {
          actions: [
            { name: "search_knowledge_base", label: "Buscou Wi-Fi corporativo" },
          ],
          confidence: "high",
          rationale: "Artigo direto resolveu sem handoff.",
        },
        createdAt: daysAgo(11),
      },
      create: {
        id: SEED_IDS.messages.closed2,
        chatSessionId: SEED_IDS.sessions.carlosClosed,
        sender: MessageSender.ASSISTANT,
        content:
          "Use a rede Nexo-Corp com suas credenciais. Problema resolvido pelo artigo da base.",
        thoughtProcess: {
          actions: [
            { name: "search_knowledge_base", label: "Buscou Wi-Fi corporativo" },
          ],
          confidence: "high",
          rationale: "Artigo direto resolveu sem handoff.",
        },
        createdAt: daysAgo(11),
      },
    }),
    // Última msg ASSISTANT → "Resolvida pelo agente" (sem SYSTEM depois)
    prisma.chatMessage.upsert({
      where: { id: SEED_IDS.messages.closed3 },
      update: {
        chatSessionId: SEED_IDS.sessions.carlosClosed,
        sender: MessageSender.ASSISTANT,
        senderUserId: null,
        content:
          "Pronto — com as credenciais corporativas a rede Nexo-Corp deve conectar. Qualquer coisa, é só chamar.",
        thoughtProcess: {
          actions: [
            { name: "search_knowledge_base", label: "Confirmou artigo Wi-Fi" },
          ],
          confidence: "high",
          rationale: "Encerramento pelo agente sem handoff.",
        },
        createdAt: daysAgo(10),
      },
      create: {
        id: SEED_IDS.messages.closed3,
        chatSessionId: SEED_IDS.sessions.carlosClosed,
        sender: MessageSender.ASSISTANT,
        content:
          "Pronto — com as credenciais corporativas a rede Nexo-Corp deve conectar. Qualquer coisa, é só chamar.",
        thoughtProcess: {
          actions: [
            { name: "search_knowledge_base", label: "Confirmou artigo Wi-Fi" },
          ],
          confidence: "high",
          rationale: "Encerramento pelo agente sem handoff.",
        },
        createdAt: daysAgo(10),
      },
    }),

    // Fernanda — timer de handoff
    prisma.chatMessage.upsert({
      where: { id: SEED_IDS.messages.fernanda1 },
      update: {
        chatSessionId: SEED_IDS.sessions.fernandaWaitingTimer,
        sender: MessageSender.EMPLOYEE,
        senderUserId: employee6.id,
        content: "Preciso liberar o Figma na minha máquina. Pode me ajudar?",
        readAtByEmployee: minutesAgo(50),
        readAtByAnalyst: null,
        createdAt: minutesAgo(50),
      },
      create: {
        id: SEED_IDS.messages.fernanda1,
        chatSessionId: SEED_IDS.sessions.fernandaWaitingTimer,
        sender: MessageSender.EMPLOYEE,
        senderUserId: employee6.id,
        content: "Preciso liberar o Figma na minha máquina. Pode me ajudar?",
        readAtByEmployee: minutesAgo(50),
        createdAt: minutesAgo(50),
      },
    }),
    prisma.chatMessage.upsert({
      where: { id: SEED_IDS.messages.fernanda2 },
      update: {
        chatSessionId: SEED_IDS.sessions.fernandaWaitingTimer,
        sender: MessageSender.ASSISTANT,
        content:
          "Vou transferir para um analista confirmar a liberação no portal de softwares.",
        thoughtProcess: {
          actions: [
            { name: "request_human_handoff", label: "Solicitou analista" },
          ],
          confidence: "medium",
          rationale: "Pedido explícito de liberação de software.",
        },
        createdAt: minutesAgo(26),
      },
      create: {
        id: SEED_IDS.messages.fernanda2,
        chatSessionId: SEED_IDS.sessions.fernandaWaitingTimer,
        sender: MessageSender.ASSISTANT,
        content:
          "Vou transferir para um analista confirmar a liberação no portal de softwares.",
        thoughtProcess: {
          actions: [
            { name: "request_human_handoff", label: "Solicitou analista" },
          ],
          confidence: "medium",
          rationale: "Pedido explícito de liberação de software.",
        },
        createdAt: minutesAgo(26),
      },
    }),
    prisma.chatMessage.upsert({
      where: { id: SEED_IDS.messages.fernanda3 },
      update: {
        chatSessionId: SEED_IDS.sessions.fernandaWaitingTimer,
        sender: MessageSender.SYSTEM,
        content: "Transferida para suporte N2",
        createdAt: minutesAgo(25),
      },
      create: {
        id: SEED_IDS.messages.fernanda3,
        chatSessionId: SEED_IDS.sessions.fernandaWaitingTimer,
        sender: MessageSender.SYSTEM,
        content: "Transferida para suporte N2",
        createdAt: minutesAgo(25),
      },
    }),

    // Ana CLOSED — Resolvida pelo analista
    prisma.chatMessage.upsert({
      where: { id: SEED_IDS.messages.anaClosed1 },
      update: {
        chatSessionId: SEED_IDS.sessions.anaClosedByAnalyst,
        sender: MessageSender.EMPLOYEE,
        senderUserId: employee2.id,
        content: "Minha senha do SAP bloqueou de novo.",
        createdAt: daysAgo(5),
      },
      create: {
        id: SEED_IDS.messages.anaClosed1,
        chatSessionId: SEED_IDS.sessions.anaClosedByAnalyst,
        sender: MessageSender.EMPLOYEE,
        senderUserId: employee2.id,
        content: "Minha senha do SAP bloqueou de novo.",
        createdAt: daysAgo(5),
      },
    }),
    prisma.chatMessage.upsert({
      where: { id: SEED_IDS.messages.anaClosed2 },
      update: {
        chatSessionId: SEED_IDS.sessions.anaClosedByAnalyst,
        sender: MessageSender.SYSTEM,
        content: `${analyst.name} assumiu — agent pausado`,
        createdAt: daysAgo(5),
      },
      create: {
        id: SEED_IDS.messages.anaClosed2,
        chatSessionId: SEED_IDS.sessions.anaClosedByAnalyst,
        sender: MessageSender.SYSTEM,
        content: `${analyst.name} assumiu — agent pausado`,
        createdAt: daysAgo(5),
      },
    }),
    prisma.chatMessage.upsert({
      where: { id: SEED_IDS.messages.anaClosed3 },
      update: {
        chatSessionId: SEED_IDS.sessions.anaClosedByAnalyst,
        sender: MessageSender.ANALYST,
        senderUserId: analyst.id,
        content: "Ana, desbloqueei sua conta no SAP. Pode testar o login agora.",
        createdAt: daysAgo(4),
      },
      create: {
        id: SEED_IDS.messages.anaClosed3,
        chatSessionId: SEED_IDS.sessions.anaClosedByAnalyst,
        sender: MessageSender.ANALYST,
        senderUserId: analyst.id,
        content: "Ana, desbloqueei sua conta no SAP. Pode testar o login agora.",
        createdAt: daysAgo(4),
      },
    }),
  ]);

  console.log(
    `Seed concluído: ${demoAccounts.length} users (incl. ${employee1.name}, ${employee2.name}, ${analyst.name}), ${articles.length} artigos, 9 chamados, 8 conversas de demonstração (fila/handoff/encerradas).`,
  );
}

main()
  .catch((error: unknown) => {
    console.error("Erro durante o seed do banco de dados:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

import "dotenv/config";

import {
  PrismaClient,
  Priority,
  Role,
  TicketCategory,
  TicketStatus,
  TicketType,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
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
    email: "analista.ti@nexo.com.br",
    name: "Suporte N1/N2",
    job: "Service Desk",
    role: Role.ANALYST,
  },
  {
    email: "suporte.n1.n2@nexo.com.br",
    name: "Suporte N1 e N2",
    job: "Service Desk",
    role: Role.ANALYST,
  },
] as const;

async function main() {
  const password = hashPassword(demoPassword);
  const [employee1, employee2, analyst] = await Promise.all(
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
  const sixDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
  const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  await Promise.all([
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
  ]);

  console.log(
    `Seed concluído: ${employee1.name}, ${employee2.name}, ${analyst.name}, ${articles.length} artigos e 4 chamados de exemplo.`,
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

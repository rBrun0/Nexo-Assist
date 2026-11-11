import "server-only";

import { Priority, TicketCategory, TicketType } from "@prisma/client";
import { tool } from "ai";
import { z } from "zod";

import type { AgentProgressPayload } from "@/lib/agent/activity";
import { prisma } from "@/lib/prisma";
import { recordKnowledgeBaseEvidence } from "@/lib/agent/confidence";
import {
  getKnowledgeSearchTerms,
  rankKnowledgeBaseArticles,
} from "@/lib/agent/knowledge-base-search";
import { getEmployeeTicketsForAgent } from "@/lib/services/conversations";
import { calculateSlaDeadline } from "@/lib/services/ticket-sla";
import { createTicketCommentForUser } from "@/lib/services/tickets";
import {
  ticketDraftPresentationSchema,
  ticketDraftSchema,
  ticketImpactSchema,
  type TicketDraftPresentation,
} from "@/lib/validations/ticket";

export type ToolTicketSummary = {
  id: string;
  code: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  category: string;
  updatedAt?: string;
  isOverdue?: boolean;
  slaDeadline?: Date | string | null;
};

export type ToolSystemService = {
  id: string;
  name: string;
  status: string;
};

export type ToolArticleRef = {
  title: string;
  category?: string;
};

export type ToolAction = {
  name: string;
  label: string;
  draft?: TicketDraftPresentation;
  summary?: string;
  tickets?: ToolTicketSummary[];
  services?: ToolSystemService[];
  systemStatusSource?: string;
  systemStatusMessage?: string;
  articles?: ToolArticleRef[];
  impactQuestion?: string;
  issueSummary?: string;
};

export type AgentAssessment = {
  confidenceScore: number;
  handoffReason?: string;
};

type ProgressReporter = (payload: AgentProgressPayload | string) => void;

function emitRunning(onProgress: ProgressReporter, id: string, label: string) {
  onProgress({
    id,
    message: label,
    label,
    status: "running",
    phase: "working",
  });
}

function emitDone(onProgress: ProgressReporter, id: string, label: string) {
  onProgress({
    id,
    message: label,
    label,
    status: "done",
    phase: "working",
  });
}

export function createServiceDeskTools({
  userId,
  userEmail,
  assessment,
  actions,
  onProgress,
}: {
  userId: string;
  userEmail: string;
  assessment: AgentAssessment;
  actions: ToolAction[];
  onProgress: ProgressReporter;
}) {
  return {
    search_knowledge_base: tool({
      description:
        "Busca e prioriza artigos da Central de Ajuda por relevância. Use antes de responder dúvidas procedimentais de TI.",
      inputSchema: z.object({
        query: z.string().min(2).max(200),
      }),
      execute: async ({ query }) => {
        emitRunning(
          onProgress,
          "search_knowledge_base",
          "Consultando a Central de Ajuda...",
        );
        const terms = getKnowledgeSearchTerms(query);
        const candidates =
          terms.length === 0
            ? []
            : await prisma.knowledgeBase.findMany({
                where: {
                  OR: terms.flatMap((term) => [
                    { title: { contains: term, mode: "insensitive" as const } },
                    {
                      content: { contains: term, mode: "insensitive" as const },
                    },
                    {
                      keywords: {
                        contains: term,
                        mode: "insensitive" as const,
                      },
                    },
                  ]),
                },
                select: {
                  title: true,
                  content: true,
                  category: true,
                  keywords: true,
                },
                take: 50,
              });
        const articles = rankKnowledgeBaseArticles(candidates, query);
        const doneLabel =
          articles.length === 1
            ? `Consultou a Central de Ajuda (${articles[0].title})`
            : `Consultou a Central de Ajuda (${articles.length} resultado(s))`;
        actions.push({
          name: "search_knowledge_base",
          label: doneLabel,
          articles: articles.map((article) => ({
            title: article.title,
            category: article.category,
          })),
        });
        recordKnowledgeBaseEvidence(assessment, articles.length);
        emitDone(onProgress, "search_knowledge_base", doneLabel);
        return articles;
      },
    }),

    check_system_status: tool({
      description:
        "Verifica se há uma integração configurada para status operacional de VPN, e-mail, servidores e Wi-Fi. Se o status não estiver integrado, informe claramente que não foi possível verificar em tempo real; nunca deduza ou invente disponibilidade.",
      inputSchema: z.object({
        serviceName: z.string().trim().min(1).max(80).optional(),
      }),
      execute: async ({ serviceName }) => {
        emitRunning(
          onProgress,
          "check_system_status",
          "Verificando status dos serviços...",
        );
        const services = [
          { id: "vpn", name: "VPN", aliases: ["vpn"] },
          { id: "email", name: "E-mail", aliases: ["email", "correio"] },
          {
            id: "servers",
            name: "Servidores",
            aliases: ["servers", "server", "servidor", "servidores"],
          },
          {
            id: "wifi",
            name: "Wi-Fi corporativo",
            aliases: ["wifi", "wireless"],
          },
        ];
        const requestedService = serviceName
          ?.normalize("NFD")
          .replace(/\p{Diacritic}/gu, "")
          .toLocaleLowerCase("pt-BR")
          .replace(/[^\p{L}\p{N}]+/gu, "");
        const selectedServices = requestedService
          ? services.filter((service) =>
              service.aliases.some((alias) => requestedService.includes(alias)),
            )
          : services;

        if (selectedServices.length === 0) {
          const doneLabel =
            "Verificou status operacional (serviço não reconhecido)";
          actions.push({
            name: "check_system_status",
            label: doneLabel,
            services: [],
            systemStatusSource: "not_integrated",
            systemStatusMessage:
              "Serviço não reconhecido. Nenhum status operacional foi consultado.",
          });
          emitDone(onProgress, "check_system_status", doneLabel);
          return {
            availableServices: services.map(({ id, name }) => ({ id, name })),
            message:
              "Serviço não reconhecido. Nenhum status operacional foi consultado.",
          };
        }

        const statusPayload = {
          checkedAt: new Date().toISOString(),
          source: "not_integrated" as const,
          services: selectedServices.map((service) => ({
            ...service,
            status: "UNKNOWN" as const,
          })),
          message:
            "Não há integração de monitoramento configurada. O status em tempo real não pode ser confirmado.",
        };
        const doneLabel =
          selectedServices.length === 1
            ? `Verificou status de ${selectedServices[0].name}`
            : `Verificou status operacional (${selectedServices.length} serviço(s))`;
        actions.push({
          name: "check_system_status",
          label: doneLabel,
          services: statusPayload.services.map(({ id, name, status }) => ({
            id,
            name,
            status,
          })),
          systemStatusSource: statusPayload.source,
          systemStatusMessage: statusPayload.message,
        });
        emitDone(onProgress, "check_system_status", doneLabel);
        return statusPayload;
      },
    }),

    list_my_tickets: tool({
      description:
        "Consulta os chamados do funcionário autenticado; nunca consulte chamados de terceiros.",
      inputSchema: z.object({
        includeClosed: z.boolean().default(false),
      }),
      execute: async ({ includeClosed }) => {
        emitRunning(
          onProgress,
          "list_my_tickets",
          "Consultando seus chamados...",
        );
        const tickets = await getEmployeeTicketsForAgent(userId);
        const visible = includeClosed
          ? tickets
          : tickets.filter(
              (ticket) => !["CLOSED", "RESOLVED"].includes(ticket.status),
            );
        const doneLabel =
          visible.length === 1
            ? `Consultou o ${visible[0].code}`
            : visible.length === 0
              ? "Consultou seus chamados (nenhum aberto)"
              : `Consultou seus chamados (${visible.length})`;
        actions.push({
          name: "list_my_tickets",
          label: doneLabel,
          tickets: visible.map((ticket) => ({
            id: ticket.id,
            code: ticket.code,
            title: ticket.title,
            description: ticket.description,
            status: ticket.status,
            priority: ticket.priority,
            category: ticket.category,
            updatedAt:
              ticket.updatedAt instanceof Date
                ? ticket.updatedAt.toISOString()
                : ticket.updatedAt
                  ? String(ticket.updatedAt)
                  : undefined,
            isOverdue: ticket.isOverdue,
            slaDeadline: ticket.slaDeadline,
          })),
        });
        emitDone(onProgress, "list_my_tickets", doneLabel);
        return visible;
      },
    }),

    ask_ticket_impact: tool({
      description:
        "Mostra a pergunta 'Quem está sendo afetado?' com opções Só eu, Minha equipe, Toda a empresa e Não sei. Use antes de create_ticket quando o impacto ainda não foi informado.",
      inputSchema: z.object({
        issueSummary: z.string().trim().min(5).max(200),
      }),
      execute: async ({ issueSummary }) => {
        emitRunning(
          onProgress,
          "ask_ticket_impact",
          "Perguntando quem está sendo afetado...",
        );
        const doneLabel = "Perguntou quem está sendo afetado";
        actions.push({
          name: "ask_ticket_impact",
          label: doneLabel,
          issueSummary,
          impactQuestion: "Quem está sendo afetado?",
        });
        emitDone(onProgress, "ask_ticket_impact", doneLabel);
        return {
          kind: "impact_choice",
          question: "Quem está sendo afetado?",
          issueSummary,
        };
      },
    }),

    create_ticket: tool({
      description:
        "Prepara um rascunho de chamado com tipo, categoria, prioridade e impacto. Não persiste o ticket; a interface pedirá confirmação. Informe impact (self/team/company/unknown) e priorityReason. O prazo de SLA é calculado no servidor.",
      inputSchema: ticketDraftSchema.omit({ affectedUserIds: true }).extend({
        impact: ticketImpactSchema.optional(),
        priorityReason: z.string().trim().max(200).optional(),
      }),
      execute: async (draftInput) => {
        emitRunning(
          onProgress,
          "create_ticket",
          "Preparando um rascunho de chamado...",
        );
        const priority =
          draftInput.impact === "team" || draftInput.impact === "company"
            ? Priority.CRITICAL
            : draftInput.priority;
        const draft = ticketDraftPresentationSchema.parse({
          ...draftInput,
          priority,
          affectedUserIds: [userId],
          slaDeadlineIso: calculateSlaDeadline(priority).toISOString(),
        });
        const doneLabel = "Classificou a prioridade e preparou o rascunho";
        actions.push({
          name: "create_ticket",
          label: doneLabel,
          draft,
        });
        emitDone(onProgress, "create_ticket", doneLabel);
        return {
          requiresConfirmation: true,
          draft,
          message:
            "O funcionário precisa confirmar este rascunho antes da gravação.",
        };
      },
    }),

    add_ticket_comment: tool({
      description:
        "Adiciona uma informação a um chamado do funcionário autenticado. Use quando ele pedir explicitamente para complementar um chamado.",
      inputSchema: z.object({
        ticketCode: z.string().min(5).max(30),
        message: z.string().trim().min(3).max(2000),
      }),
      execute: async ({ ticketCode, message }) => {
        emitRunning(
          onProgress,
          "add_ticket_comment",
          `Consultando o ${ticketCode}...`,
        );
        const comment = await createTicketCommentForUser(
          userId,
          userEmail,
          ticketCode,
          message,
        );
        const doneLabel = `Registrou informação no ${ticketCode}`;
        actions.push({
          name: "add_ticket_comment",
          label: doneLabel,
        });
        emitDone(onProgress, "add_ticket_comment", doneLabel);
        return { success: true, ticketCode: comment.ticketCode };
      },
    }),

    request_helpdesk_analyst: tool({
      description:
        "Transfere a conversa para a fila de analistas (WAITING_HUMAN) e pausa o agente. Use obrigatoriamente quando o funcionário pedir analista, em incidente CRITICAL/vencido que exija pessoa, ou sem evidência suficiente. O summary deve contextualizar o caso para o N1.",
      inputSchema: z.object({
        summary: z.string().trim().min(10).max(2000),
      }),
      execute: async ({ summary }) => {
        emitRunning(
          onProgress,
          "request_helpdesk_analyst",
          "Encaminhando para um analista...",
        );
        assessment.handoffReason = summary;
        const doneLabel = "Solicitou atendimento de um analista";
        actions.push({
          name: "request_helpdesk_analyst",
          label: doneLabel,
          summary,
        });
        emitDone(onProgress, "request_helpdesk_analyst", doneLabel);
        return { success: true, status: "HANDOFF_REQUESTED" };
      },
    }),
  };
}

export const ticketToolOptions = {
  types: Object.values(TicketType),
  categories: Object.values(TicketCategory),
  priorities: Object.values(Priority),
};

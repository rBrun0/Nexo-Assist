import { addTicketCommentTool } from "@/lib/mastra/tools/add-ticket-comment";
import { askTicketImpactTool } from "@/lib/mastra/tools/ask-ticket-impact";
import { checkSystemStatusTool } from "@/lib/mastra/tools/check-system-status";
import { createTicketTool } from "@/lib/mastra/tools/create-ticket";
import { listMyTicketsTool } from "@/lib/mastra/tools/list-my-tickets";
import { requestHelpdeskAnalystTool } from "@/lib/mastra/tools/request-helpdesk-analyst";
import { searchKnowledgeBaseTool } from "@/lib/mastra/tools/search-knowledge-base";

export const serviceDeskTools = {
  search_knowledge_base: searchKnowledgeBaseTool,
  check_system_status: checkSystemStatusTool,
  list_my_tickets: listMyTicketsTool,
  ask_ticket_impact: askTicketImpactTool,
  create_ticket: createTicketTool,
  add_ticket_comment: addTicketCommentTool,
  request_helpdesk_analyst: requestHelpdeskAnalystTool,
};

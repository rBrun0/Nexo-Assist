import { HttpStatus } from "@/lib/errors/http-status";
import type { ServiceError } from "@/lib/errors/result";

function defineError(
  message: string,
  statusCode: ServiceError["statusCode"],
): ServiceError {
  return { message, statusCode };
}

export const AppErrors = {
  // HTTP / adapter
  invalidRequestBody: defineError(
    "Corpo da requisição inválido.",
    HttpStatus.BAD_REQUEST,
  ),
  invalidBody: defineError("Corpo inválido.", HttpStatus.BAD_REQUEST),
  invalidAction: defineError("Ação inválida.", HttpStatus.BAD_REQUEST),
  invalidConversationAction: defineError(
    "Ação de conversa inválida.",
    HttpStatus.BAD_REQUEST,
  ),
  invalidMessage: defineError(
    "A mensagem é inválida.",
    HttpStatus.BAD_REQUEST,
  ),
  invalidTicketData: defineError(
    "Dados do chamado inválidos.",
    HttpStatus.BAD_REQUEST,
  ),
  invalidTicketStatus: defineError(
    "Status de chamado inválido.",
    HttpStatus.BAD_REQUEST,
  ),
  invalidLoginInput: defineError(
    "Informe um e-mail válido e uma senha.",
    HttpStatus.BAD_REQUEST,
  ),
  invalidPasswordInput: defineError(
    "A senha deve ter entre 12 e 128 caracteres.",
    HttpStatus.BAD_REQUEST,
  ),
  invalidChatSessionId: defineError(
    "Identificador de conversa inválido.",
    HttpStatus.BAD_REQUEST,
  ),
  invalidManualChatMessage: defineError(
    "Informe uma conversa válida e uma mensagem de até 4000 caracteres.",
    HttpStatus.BAD_REQUEST,
  ),
  invalidAgentFeedbackInput: defineError(
    "Informe uma mensagem válida para o feedback.",
    HttpStatus.BAD_REQUEST,
  ),
  unexpected: defineError(
    "Não foi possível completar a requisição.",
    HttpStatus.INTERNAL_SERVER_ERROR,
  ),
  invalidServerResponse: defineError(
    "Resposta inválida do servidor.",
    HttpStatus.INTERNAL_SERVER_ERROR,
  ),
  networkUnavailable: defineError(
    "Não foi possível conectar ao servidor. Tente novamente.",
    0,
  ),

  // Auth
  sessionRequired: defineError("Sessão necessária.", HttpStatus.UNAUTHORIZED),
  analystSessionRequired: defineError(
    "Sessão de analista necessária.",
    HttpStatus.UNAUTHORIZED,
  ),
  employeeSessionRequired: defineError(
    "Sessão de funcionário necessária.",
    HttpStatus.UNAUTHORIZED,
  ),
  invalidCredentials: defineError(
    "E-mail ou senha incorretos.",
    HttpStatus.UNAUTHORIZED,
  ),
  loginFailed: defineError(
    "Não foi possível iniciar a sessão.",
    HttpStatus.INTERNAL_SERVER_ERROR,
  ),
  loginConfigFailed: defineError(
    "Não foi possível iniciar a sessão. Verifique a configuração do servidor.",
    HttpStatus.INTERNAL_SERVER_ERROR,
  ),
  logoutFailed: defineError(
    "Não foi possível encerrar a sessão.",
    HttpStatus.INTERNAL_SERVER_ERROR,
  ),
  logoutFailedClient: defineError(
    "A sessão não pôde ser encerrada.",
    HttpStatus.INTERNAL_SERVER_ERROR,
  ),
  passwordUpdateFailed: defineError(
    "Não foi possível atualizar a senha.",
    HttpStatus.INTERNAL_SERVER_ERROR,
  ),

  // Conversation
  conversationNotFound: defineError(
    "Conversa não encontrada.",
    HttpStatus.NOT_FOUND,
  ),
  conversationNotFoundOrForbidden: defineError(
    "Conversa não encontrada ou sem permissão.",
    HttpStatus.NOT_FOUND,
  ),
  conversationNotFoundOrClosed: defineError(
    "Conversa não encontrada ou encerrada.",
    HttpStatus.NOT_FOUND,
  ),
  conversationNotFoundOrAlreadyClosed: defineError(
    "Conversa não encontrada ou já encerrada.",
    HttpStatus.NOT_FOUND,
  ),
  conversationClosed: defineError(
    "Esta conversa foi encerrada.",
    HttpStatus.CONFLICT,
  ),
  conversationStateChanged: defineError(
    "O estado da conversa mudou. Atualize e tente novamente.",
    HttpStatus.CONFLICT,
  ),
  conversationOwnerOrStateChanged: defineError(
    "O estado ou responsável pela conversa mudou. Atualize e tente novamente.",
    HttpStatus.CONFLICT,
  ),
  conversationUpdatedRetry: defineError(
    "A conversa foi atualizada. Atualize os dados antes de tentar novamente.",
    HttpStatus.CONFLICT,
  ),
  conversationUpdatedByOther: defineError(
    "A conversa foi atualizada por outra pessoa. Atualize os dados antes de tentar novamente.",
    HttpStatus.CONFLICT,
  ),
  conversationMessageLimitReached: defineError(
    "Esta conversa atingiu o limite de 30 mensagens.",
    HttpStatus.CONFLICT,
  ),
  conversationMessageLimitNeedAnalyst: defineError(
    "Esta conversa atingiu o limite de 30 mensagens. Solicite um analista para continuar.",
    HttpStatus.CONFLICT,
  ),
  conversationNoSpaceToConfirm: defineError(
    "Não há espaço para confirmar nesta conversa.",
    HttpStatus.CONFLICT,
  ),
  conversationNoSpaceToCancel: defineError(
    "Não há espaço para cancelar nesta conversa.",
    HttpStatus.CONFLICT,
  ),
  conversationNotWaitingOrClaimed: defineError(
    "Esta conversa não está aguardando ou já foi assumida por outro analista.",
    HttpStatus.CONFLICT,
  ),
  conversationClaimedByOther: defineError(
    "Outro analista assumiu esta conversa. Atualize a fila.",
    HttpStatus.CONFLICT,
  ),
  conversationMustBeAssigned: defineError(
    "A conversa precisa estar atribuída a você.",
    HttpStatus.FORBIDDEN,
  ),
  conversationMustBeAssignedToReply: defineError(
    "A conversa precisa estar atribuída a você para responder.",
    HttpStatus.FORBIDDEN,
  ),
  manualMessagesOnlyDuringHuman: defineError(
    "Mensagens manuais só podem ser enviadas durante o atendimento humano.",
    HttpStatus.FORBIDDEN,
  ),
  analystMustCloseConversation: defineError(
    "O analista precisa encerrar este atendimento.",
    HttpStatus.FORBIDDEN,
  ),
  endOnlyWhileBotActive: defineError(
    "Só é possível encerrar enquanto o assistente está atendendo.",
    HttpStatus.CONFLICT,
  ),
  noActiveConversationToEnd: defineError(
    "Não há conversa ativa para encerrar.",
    HttpStatus.NOT_FOUND,
  ),
  assistantSaveStateChanged: defineError(
    "A conversa mudou de estado antes da resposta do agente ser salva.",
    HttpStatus.CONFLICT,
  ),
  loadConversationFailed: defineError(
    "Não foi possível carregar a conversa.",
    HttpStatus.INTERNAL_SERVER_ERROR,
  ),
  updateConversationFailed: defineError(
    "Não foi possível atualizar a conversa.",
    HttpStatus.INTERNAL_SERVER_ERROR,
  ),
  loadQueueFailed: defineError(
    "Não foi possível carregar a fila.",
    HttpStatus.INTERNAL_SERVER_ERROR,
  ),
  refreshQueueFailed: defineError(
    "Não foi possível atualizar a fila.",
    HttpStatus.INTERNAL_SERVER_ERROR,
  ),
  openConversationFailed: defineError(
    "Não foi possível abrir a conversa.",
    HttpStatus.INTERNAL_SERVER_ERROR,
  ),
  endConversationFailed: defineError(
    "Não foi possível encerrar a conversa.",
    HttpStatus.INTERNAL_SERVER_ERROR,
  ),
  loadHistoryFailed: defineError(
    "Não foi possível carregar o histórico da conversa.",
    HttpStatus.INTERNAL_SERVER_ERROR,
  ),
  sendMessageFailed: defineError(
    "Não foi possível enviar a mensagem.",
    HttpStatus.INTERNAL_SERVER_ERROR,
  ),
  agentProcessingFailed: defineError(
    "Sua mensagem foi recebida, mas o agente não conseguiu processá-la. Tente novamente.",
    HttpStatus.SERVICE_UNAVAILABLE,
  ),
  confirmTicketFailed: defineError(
    "Não foi possível confirmar o chamado.",
    HttpStatus.INTERNAL_SERVER_ERROR,
  ),
  cancelDraftFailed: defineError(
    "Não foi possível cancelar o rascunho.",
    HttpStatus.INTERNAL_SERVER_ERROR,
  ),
  requestAnalystFailed: defineError(
    "Não foi possível solicitar um analista.",
    HttpStatus.INTERNAL_SERVER_ERROR,
  ),

  // Ticket draft
  ticketDraftNotFound: defineError(
    "Rascunho de chamado não encontrado.",
    HttpStatus.NOT_FOUND,
  ),
  ticketDraftNotInMessage: defineError(
    "Esta mensagem não contém um rascunho de chamado.",
    HttpStatus.BAD_REQUEST,
  ),
  ticketDraftAlreadyConfirmed: defineError(
    "Este rascunho já foi confirmado.",
    HttpStatus.CONFLICT,
  ),
  ticketDraftCancelled: defineError(
    "Este rascunho foi cancelado.",
    HttpStatus.CONFLICT,
  ),
  ticketDraftAlreadyCancelled: defineError(
    "Este rascunho já foi cancelado.",
    HttpStatus.CONFLICT,
  ),
  ticketDraftInvalid: defineError(
    "O rascunho não é mais válido.",
    HttpStatus.BAD_REQUEST,
  ),
  ticketPersistFailed: defineError(
    "Não foi possível gravar o chamado.",
    HttpStatus.BAD_GATEWAY,
  ),

  // Tickets
  selectedTicketNotFound: defineError(
    "Chamado selecionado não encontrado.",
    HttpStatus.NOT_FOUND,
  ),
  ticketNotFound: defineError("Chamado não encontrado.", HttpStatus.BAD_REQUEST),
  ticketNotFoundInAccount: defineError(
    "Chamado não encontrado na sua conta.",
    HttpStatus.BAD_REQUEST,
  ),
  listTicketsFailed: defineError(
    "Não foi possível consultar os chamados.",
    HttpStatus.INTERNAL_SERVER_ERROR,
  ),
  loadTicketsFailed: defineError(
    "Não foi possível carregar os chamados.",
    HttpStatus.INTERNAL_SERVER_ERROR,
  ),
  saveTicketFailed: defineError(
    "Não foi possível salvar o chamado. Tente novamente.",
    HttpStatus.INTERNAL_SERVER_ERROR,
  ),
  updateTicketFailed: defineError(
    "Não foi possível atualizar o chamado.",
    HttpStatus.INTERNAL_SERVER_ERROR,
  ),

  // Agent feedback
  agentMessageNotFound: defineError(
    "Mensagem do agente não encontrada.",
    HttpStatus.NOT_FOUND,
  ),
  agentMessageWithoutThought: defineError(
    "Esta mensagem não possui raciocínio do agente para contestar.",
    HttpStatus.BAD_REQUEST,
  ),
  agentFeedbackForbidden: defineError(
    "Sem permissão para registrar feedback nesta conversa.",
    HttpStatus.FORBIDDEN,
  ),
  agentFeedbackAlreadyExists: defineError(
    "Você já registrou feedback para esta mensagem.",
    HttpStatus.CONFLICT,
  ),
  agentFeedbackFailed: defineError(
    "Não foi possível registrar o feedback.",
    HttpStatus.INTERNAL_SERVER_ERROR,
  ),
} as const satisfies Record<string, ServiceError>;

export type AppErrorKey = keyof typeof AppErrors;

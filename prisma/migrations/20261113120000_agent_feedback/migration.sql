-- Contestação de contexto do agente (evals / governança).
CREATE TABLE IF NOT EXISTS "AgentFeedback" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chatSessionId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentFeedback_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AgentFeedback_messageId_userId_key"
  ON "AgentFeedback"("messageId", "userId");

CREATE INDEX IF NOT EXISTS "AgentFeedback_chatSessionId_createdAt_idx"
  ON "AgentFeedback"("chatSessionId", "createdAt");

CREATE INDEX IF NOT EXISTS "AgentFeedback_userId_createdAt_idx"
  ON "AgentFeedback"("userId", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AgentFeedback_messageId_fkey'
  ) THEN
    ALTER TABLE "AgentFeedback"
      ADD CONSTRAINT "AgentFeedback_messageId_fkey"
      FOREIGN KEY ("messageId") REFERENCES "ChatMessage"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AgentFeedback_userId_fkey'
  ) THEN
    ALTER TABLE "AgentFeedback"
      ADD CONSTRAINT "AgentFeedback_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

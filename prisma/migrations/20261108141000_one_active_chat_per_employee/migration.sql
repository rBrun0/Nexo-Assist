CREATE UNIQUE INDEX IF NOT EXISTS "ChatSession_one_active_per_employee_key"
ON public."ChatSession"("userId")
WHERE "status" <> 'CLOSED';

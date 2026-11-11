-- Auth local não popula auth.uid(). Negar leitura via roles Supabase
-- (anon/authenticated) em tabelas de conversa até existir JWT customizado.
-- O Prisma continua acessando com a role da DATABASE_URL.

ALTER TABLE public."ChatSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ChatMessage" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny anon ChatSession" ON public."ChatSession";
DROP POLICY IF EXISTS "Deny authenticated ChatSession" ON public."ChatSession";
DROP POLICY IF EXISTS "Deny anon ChatMessage" ON public."ChatMessage";
DROP POLICY IF EXISTS "Deny authenticated ChatMessage" ON public."ChatMessage";

CREATE POLICY "Deny anon ChatSession"
  ON public."ChatSession"
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny authenticated ChatSession"
  ON public."ChatSession"
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny anon ChatMessage"
  ON public."ChatMessage"
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny authenticated ChatMessage"
  ON public."ChatMessage"
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

REVOKE ALL ON TABLE public."ChatSession" FROM anon, authenticated;
REVOKE ALL ON TABLE public."ChatMessage" FROM anon, authenticated;

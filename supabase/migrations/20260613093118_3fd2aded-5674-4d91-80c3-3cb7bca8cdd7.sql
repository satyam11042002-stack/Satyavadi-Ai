
-- Revoke all client access; these tables are internal and only accessed by edge functions via service role
REVOKE ALL ON public.api_usage FROM anon, authenticated, PUBLIC;
REVOKE ALL ON public.search_cache FROM anon, authenticated, PUBLIC;

GRANT ALL ON public.api_usage TO service_role;
GRANT ALL ON public.search_cache TO service_role;

ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_cache ENABLE ROW LEVEL SECURITY;

-- Explicit deny policies for non-service roles (silences "RLS enabled, no policy" lint)
DROP POLICY IF EXISTS "deny all client access" ON public.api_usage;
CREATE POLICY "deny all client access" ON public.api_usage
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "deny all client access" ON public.search_cache;
CREATE POLICY "deny all client access" ON public.search_cache
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

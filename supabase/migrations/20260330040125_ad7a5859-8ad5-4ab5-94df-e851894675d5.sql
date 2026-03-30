
-- Global search cache table
CREATE TABLE public.search_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_hash TEXT NOT NULL UNIQUE,
  query_text TEXT NOT NULL,
  search_results JSONB NOT NULL DEFAULT '[]',
  trusted_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Monthly API usage counter
CREATE TABLE public.api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month_key TEXT NOT NULL UNIQUE,
  usage_count INTEGER NOT NULL DEFAULT 0,
  max_limit INTEGER NOT NULL DEFAULT 200,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- No RLS needed - these are accessed only from edge functions via service role
ALTER TABLE public.search_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

-- Create index for fast cache lookups
CREATE INDEX idx_search_cache_query_hash ON public.search_cache(query_hash);
CREATE INDEX idx_search_cache_created_at ON public.search_cache(created_at);

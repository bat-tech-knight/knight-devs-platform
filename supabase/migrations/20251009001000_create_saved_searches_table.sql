-- Create saved_searches table for candidate users
CREATE TABLE IF NOT EXISTS public.saved_searches (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  search_term VARCHAR(500) NOT NULL,
  location VARCHAR(200),
  job_type VARCHAR(100),
  is_remote BOOLEAN,
  salary_min DECIMAL(12,2),
  salary_max DECIMAL(12,2),
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

-- Create policies for saved_searches table
-- Users can only view their own saved searches
CREATE POLICY "Users can view own saved searches" ON public.saved_searches
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own saved searches
CREATE POLICY "Users can insert own saved searches" ON public.saved_searches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own saved searches
CREATE POLICY "Users can update own saved searches" ON public.saved_searches
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own saved searches
CREATE POLICY "Users can delete own saved searches" ON public.saved_searches
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE TRIGGER on_saved_searches_updated
  BEFORE UPDATE ON public.saved_searches
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON public.saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_created_at ON public.saved_searches(created_at);
CREATE INDEX IF NOT EXISTS idx_saved_searches_search_term ON public.saved_searches(search_term);

-- Add admin role to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- Create scraping_config table
CREATE TABLE IF NOT EXISTS public.scraping_config (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  search_term VARCHAR(200) NOT NULL,
  location VARCHAR(100) NOT NULL,
  sites JSONB NOT NULL,
  results_wanted INTEGER NOT NULL,
  hours_old INTEGER,
  is_remote BOOLEAN DEFAULT false,
  job_type VARCHAR(50),
  country_indeed VARCHAR(50),
  google_search_term TEXT,
  distance INTEGER,
  easy_apply BOOLEAN DEFAULT false,
  linkedin_fetch_description BOOLEAN DEFAULT false,
  linkedin_company_ids JSONB,
  enforce_annual_salary BOOLEAN DEFAULT false,
  description_format VARCHAR(20) DEFAULT 'markdown',
  page_offset INTEGER,
  log_level INTEGER DEFAULT 2,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_run TIMESTAMP(3),
  next_run TIMESTAMP(3),
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.scraping_config ENABLE ROW LEVEL SECURITY;

-- Create policies for scraping_config table - admin only access
-- Only admin users can view scraping configs
CREATE POLICY "Admin can view scraping configs" ON public.scraping_config
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admin users can insert scraping configs
CREATE POLICY "Admin can insert scraping configs" ON public.scraping_config
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admin users can update scraping configs
CREATE POLICY "Admin can update scraping configs" ON public.scraping_config
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admin users can delete scraping configs
CREATE POLICY "Admin can delete scraping configs" ON public.scraping_config
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create trigger to automatically update updated_at timestamp for scraping_config
CREATE OR REPLACE TRIGGER on_scraping_config_updated
  BEFORE UPDATE ON public.scraping_config
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scraping_config_is_active ON public.scraping_config(is_active);
CREATE INDEX IF NOT EXISTS idx_scraping_config_next_run ON public.scraping_config(next_run);
CREATE INDEX IF NOT EXISTS idx_scraping_config_created_at ON public.scraping_config(created_at);

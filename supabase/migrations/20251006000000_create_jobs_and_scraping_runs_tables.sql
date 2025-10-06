-- Create jobs table to store scraped job data
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  scraping_config_id UUID NOT NULL,
  title VARCHAR(500) NOT NULL,
  company_name VARCHAR(200),
  company_url TEXT,
  job_url TEXT NOT NULL,
  job_url_direct TEXT,
  location TEXT,
  description TEXT,
  job_type VARCHAR(100),
  compensation_min DECIMAL(12,2),
  compensation_max DECIMAL(12,2),
  compensation_currency VARCHAR(10) DEFAULT 'USD',
  compensation_interval VARCHAR(20),
  date_posted DATE,
  emails TEXT[],
  is_remote BOOLEAN,
  listing_type VARCHAR(50),
  job_level VARCHAR(50),
  company_industry VARCHAR(200),
  company_addresses TEXT,
  company_num_employees VARCHAR(100),
  company_revenue VARCHAR(100),
  company_description TEXT,
  company_logo TEXT,
  banner_photo_url TEXT,
  job_function VARCHAR(200),
  skills TEXT[],
  experience_range VARCHAR(100),
  company_rating DECIMAL(3,2),
  company_reviews_count INTEGER,
  vacancy_count INTEGER,
  work_from_home_type VARCHAR(50),
  site VARCHAR(50) NOT NULL,
  salary_source VARCHAR(50),
  scraped_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (scraping_config_id) REFERENCES public.scraping_config(id) ON DELETE CASCADE
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Create policies for jobs table - admin only access
-- Only admin users can view jobs
CREATE POLICY "Admin can view jobs" ON public.jobs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admin users can insert jobs
CREATE POLICY "Admin can insert jobs" ON public.jobs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admin users can update jobs
CREATE POLICY "Admin can update jobs" ON public.jobs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admin users can delete jobs
CREATE POLICY "Admin can delete jobs" ON public.jobs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create trigger to automatically update updated_at timestamp for jobs
CREATE OR REPLACE TRIGGER on_jobs_updated
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_scraping_config_id ON public.jobs(scraping_config_id);
CREATE INDEX IF NOT EXISTS idx_jobs_site ON public.jobs(site);
CREATE INDEX IF NOT EXISTS idx_jobs_scraped_at ON public.jobs(scraped_at);
CREATE INDEX IF NOT EXISTS idx_jobs_date_posted ON public.jobs(date_posted);
CREATE INDEX IF NOT EXISTS idx_jobs_company_name ON public.jobs(company_name);
CREATE INDEX IF NOT EXISTS idx_jobs_title ON public.jobs(title);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON public.jobs(location);
CREATE INDEX IF NOT EXISTS idx_jobs_is_remote ON public.jobs(is_remote);

-- Create scraping_runs table to track scraping execution history
CREATE TABLE IF NOT EXISTS public.scraping_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  scraping_config_id UUID NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'running', -- running, completed, failed
  jobs_found INTEGER DEFAULT 0,
  jobs_saved INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP(3),
  duration_seconds INTEGER,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (scraping_config_id) REFERENCES public.scraping_config(id) ON DELETE CASCADE
);

-- Enable Row Level Security (RLS) for scraping_runs
ALTER TABLE public.scraping_runs ENABLE ROW LEVEL SECURITY;

-- Create policies for scraping_runs table - admin only access
CREATE POLICY "Admin can view scraping runs" ON public.scraping_runs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin can insert scraping runs" ON public.scraping_runs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin can update scraping runs" ON public.scraping_runs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin can delete scraping runs" ON public.scraping_runs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create trigger to automatically update updated_at timestamp for scraping_runs
CREATE OR REPLACE TRIGGER on_scraping_runs_updated
  BEFORE UPDATE ON public.scraping_runs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for scraping_runs
CREATE INDEX IF NOT EXISTS idx_scraping_runs_config_id ON public.scraping_runs(scraping_config_id);
CREATE INDEX IF NOT EXISTS idx_scraping_runs_status ON public.scraping_runs(status);
CREATE INDEX IF NOT EXISTS idx_scraping_runs_started_at ON public.scraping_runs(started_at);
CREATE INDEX IF NOT EXISTS idx_scraping_runs_completed_at ON public.scraping_runs(completed_at);

-- Update scraping_config table to add last_run and next_run tracking
ALTER TABLE public.scraping_config ADD COLUMN IF NOT EXISTS last_run TIMESTAMP(3);
ALTER TABLE public.scraping_config ADD COLUMN IF NOT EXISTS next_run TIMESTAMP(3);

-- Create function to update last_run when scraping completes
CREATE OR REPLACE FUNCTION update_scraping_config_last_run()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the scraping_config's last_run when a scraping_run completes
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE public.scraping_config 
    SET last_run = NEW.completed_at,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.scraping_config_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update last_run
CREATE OR REPLACE TRIGGER on_scraping_run_completed
  AFTER UPDATE ON public.scraping_runs
  FOR EACH ROW EXECUTE FUNCTION update_scraping_config_last_run();

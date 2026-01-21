-- Create user_closed_jobs table to track jobs that users have closed/dismissed
CREATE TABLE IF NOT EXISTS public.user_closed_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  closed_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE (user_id, job_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_closed_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies for user_closed_jobs table
-- Users can only view their own closed jobs
CREATE POLICY "Users can view own closed jobs" ON public.user_closed_jobs
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own closed jobs
CREATE POLICY "Users can insert own closed jobs" ON public.user_closed_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own closed jobs (to reopen if needed)
CREATE POLICY "Users can delete own closed jobs" ON public.user_closed_jobs
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE TRIGGER on_user_closed_jobs_updated
  BEFORE UPDATE ON public.user_closed_jobs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_closed_jobs_user_id ON public.user_closed_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_closed_jobs_job_id ON public.user_closed_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_user_closed_jobs_user_job ON public.user_closed_jobs(user_id, job_id);

-- Add comments for documentation
COMMENT ON TABLE public.user_closed_jobs IS 'Tracks jobs that users have closed/dismissed and should not appear in their discover page';
COMMENT ON COLUMN public.user_closed_jobs.closed_at IS 'Timestamp when user closed/dismissed the job';

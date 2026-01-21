-- Create user_job_applications table to track user job application status
CREATE TABLE IF NOT EXISTS public.user_job_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'clicked', -- 'clicked', 'applied', 'not_applied'
  clicked_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  applied_at TIMESTAMP(3),
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE (user_id, job_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_job_applications ENABLE ROW LEVEL SECURITY;

-- Create policies for user_job_applications table
-- Users can only view their own applications
CREATE POLICY "Users can view own applications" ON public.user_job_applications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own applications
CREATE POLICY "Users can insert own applications" ON public.user_job_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own applications
CREATE POLICY "Users can update own applications" ON public.user_job_applications
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own applications
CREATE POLICY "Users can delete own applications" ON public.user_job_applications
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE TRIGGER on_user_job_applications_updated
  BEFORE UPDATE ON public.user_job_applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_job_applications_user_id ON public.user_job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_job_applications_job_id ON public.user_job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_user_job_applications_status ON public.user_job_applications(status);
CREATE INDEX IF NOT EXISTS idx_user_job_applications_user_status ON public.user_job_applications(user_id, status);

-- Add comments for documentation
COMMENT ON TABLE public.user_job_applications IS 'Tracks user job application status and interactions';
COMMENT ON COLUMN public.user_job_applications.status IS 'Application status: clicked (user clicked Apply Now), applied (user confirmed they applied), not_applied (user confirmed they did not apply)';
COMMENT ON COLUMN public.user_job_applications.clicked_at IS 'Timestamp when user clicked Apply Now button';
COMMENT ON COLUMN public.user_job_applications.applied_at IS 'Timestamp when user confirmed they applied to the job';

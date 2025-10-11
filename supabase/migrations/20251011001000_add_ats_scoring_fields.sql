-- Add ATS scoring fields to jobs table
-- This migration adds ATS score tracking for candidate-job matching

-- Add ATS score fields to jobs table
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS ats_score INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ats_score_breakdown JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ats_score_calculated_at TIMESTAMP(3) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ats_score_candidate_id UUID DEFAULT NULL;

-- Add indexes for ATS score queries
CREATE INDEX IF NOT EXISTS idx_jobs_ats_score ON public.jobs(ats_score DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_ats_score_candidate ON public.jobs(ats_score_candidate_id, ats_score DESC);

-- Add comments for documentation
COMMENT ON COLUMN public.jobs.ats_score IS 'ATS compatibility score (0-100) for the most recent candidate evaluation';
COMMENT ON COLUMN public.jobs.ats_score_breakdown IS 'Detailed ATS score breakdown including skills, experience, keyword, and cultural fit scores';
COMMENT ON COLUMN public.jobs.ats_score_calculated_at IS 'Timestamp when the ATS score was last calculated';
COMMENT ON COLUMN public.jobs.ats_score_candidate_id IS 'ID of the candidate for whom this ATS score was calculated';

-- Create a new table for storing ATS score history
CREATE TABLE IF NOT EXISTS public.job_candidate_ats_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,
  candidate_id UUID NOT NULL,
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  skills_match_score INTEGER NOT NULL CHECK (skills_match_score >= 0 AND skills_match_score <= 100),
  experience_match_score INTEGER NOT NULL CHECK (experience_match_score >= 0 AND experience_match_score <= 100),
  keyword_match_score INTEGER NOT NULL CHECK (keyword_match_score >= 0 AND keyword_match_score <= 100),
  cultural_fit_score INTEGER NOT NULL CHECK (cultural_fit_score >= 0 AND cultural_fit_score <= 100),
  detailed_analysis JSONB DEFAULT NULL,
  recommendations TEXT[] DEFAULT NULL,
  strengths TEXT[] DEFAULT NULL,
  weaknesses TEXT[] DEFAULT NULL,
  score_explanation TEXT DEFAULT NULL,
  calculated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (candidate_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  UNIQUE(job_id, candidate_id, calculated_at)
);

-- Enable RLS for job_candidate_ats_scores table
ALTER TABLE public.job_candidate_ats_scores ENABLE ROW LEVEL SECURITY;

-- Create policies for job_candidate_ats_scores table
-- Candidates can view their own ATS scores
CREATE POLICY "Candidates can view their own ATS scores" ON public.job_candidate_ats_scores
  FOR SELECT USING (candidate_id = auth.uid());

-- Admins can view all ATS scores
CREATE POLICY "Admins can view all ATS scores" ON public.job_candidate_ats_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can insert ATS scores
CREATE POLICY "Admins can insert ATS scores" ON public.job_candidate_ats_scores
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update ATS scores
CREATE POLICY "Admins can update ATS scores" ON public.job_candidate_ats_scores
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete ATS scores
CREATE POLICY "Admins can delete ATS scores" ON public.job_candidate_ats_scores
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_candidate_ats_scores_job_id ON public.job_candidate_ats_scores(job_id);
CREATE INDEX IF NOT EXISTS idx_job_candidate_ats_scores_candidate_id ON public.job_candidate_ats_scores(candidate_id);
CREATE INDEX IF NOT EXISTS idx_job_candidate_ats_scores_overall_score ON public.job_candidate_ats_scores(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_job_candidate_ats_scores_calculated_at ON public.job_candidate_ats_scores(calculated_at DESC);

-- Add comment for documentation
COMMENT ON TABLE public.job_candidate_ats_scores IS 'Historical ATS scores for job-candidate matches with detailed breakdowns';

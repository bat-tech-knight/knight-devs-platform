-- Create experts table and split profile data
-- This migration creates a new experts table for professional data and updates profiles table for basic info

-- First, ensure the handle_updated_at function exists
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the experts table with one-to-one relationship to profiles
CREATE TABLE IF NOT EXISTS public.experts (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Resume parsed data
  resume_url TEXT,
  resume_text TEXT,
  ai_parsed_data JSONB DEFAULT '{}'::jsonb,
  -- Professional experience
  experiences JSONB DEFAULT '[]'::jsonb,
  -- Skills and expertise
  core_skills TEXT[],
  other_skills TEXT[],
  -- Professional details
  industries TEXT[],
  positions TEXT[],
  seniority TEXT,
  headline TEXT,
  -- Work preferences
  work_eligibility TEXT,
  work_preference TEXT,
  working_timezones TEXT[],
  employment_type TEXT,
  expected_salary TEXT,
  skills_preference TEXT[],
  -- Company preferences
  funding_stages TEXT[],
  company_sizes TEXT[],
  -- Professional status
  availability TEXT,
  status TEXT,
  -- Timestamps
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE(user_id) -- One-to-one relationship
);

-- Enable RLS for experts table
ALTER TABLE public.experts ENABLE ROW LEVEL SECURITY;

-- Create policies for experts table
-- Users can view their own expert profile
CREATE POLICY "Users can view own expert profile" ON public.experts
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own expert profile
CREATE POLICY "Users can update own expert profile" ON public.experts
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can insert their own expert profile
CREATE POLICY "Users can insert own expert profile" ON public.experts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own expert profile
CREATE POLICY "Users can delete own expert profile" ON public.experts
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_experts_user_id ON public.experts(user_id);
CREATE INDEX IF NOT EXISTS idx_experts_core_skills ON public.experts USING GIN(core_skills);
CREATE INDEX IF NOT EXISTS idx_experts_industries ON public.experts USING GIN(industries);
CREATE INDEX IF NOT EXISTS idx_experts_positions ON public.experts USING GIN(positions);
CREATE INDEX IF NOT EXISTS idx_experts_created_at ON public.experts(created_at);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE TRIGGER on_experts_updated
  BEFORE UPDATE ON public.experts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Now update the profiles table structure
-- Remove expert-related columns from profiles table
-- Keep only basic profile information
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS resume_url,
DROP COLUMN IF EXISTS resume_text,
DROP COLUMN IF EXISTS ai_parsed_data,
DROP COLUMN IF EXISTS experiences,
DROP COLUMN IF EXISTS core_skills,
DROP COLUMN IF EXISTS other_skills,
DROP COLUMN IF EXISTS industries,
DROP COLUMN IF EXISTS positions,
DROP COLUMN IF EXISTS seniority,
DROP COLUMN IF EXISTS headline,
DROP COLUMN IF EXISTS work_eligibility,
DROP COLUMN IF EXISTS work_preference,
DROP COLUMN IF EXISTS working_timezones,
DROP COLUMN IF EXISTS employment_type,
DROP COLUMN IF EXISTS expected_salary,
DROP COLUMN IF EXISTS skills_preference,
DROP COLUMN IF EXISTS funding_stages,
DROP COLUMN IF EXISTS company_sizes,
DROP COLUMN IF EXISTS availability,
DROP COLUMN IF EXISTS status;

-- Add new basic profile fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS github_url TEXT,
ADD COLUMN IF NOT EXISTS twitter_url TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Drop old indexes that are no longer needed
DROP INDEX IF EXISTS idx_profiles_positions;
DROP INDEX IF EXISTS idx_profiles_core_skills;
DROP INDEX IF EXISTS idx_profiles_industries;

-- Create new indexes for basic profile fields
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed ON public.profiles(onboarding_completed);

-- Update foreign key references in other tables to point to experts instead of profiles
-- Update generated_resumes table
ALTER TABLE public.generated_resumes 
DROP CONSTRAINT IF EXISTS generated_resumes_candidate_id_fkey;

ALTER TABLE public.generated_resumes 
ADD CONSTRAINT generated_resumes_candidate_id_fkey 
FOREIGN KEY (candidate_id) REFERENCES public.experts(user_id) ON DELETE CASCADE;

-- Update job_candidate_ats_scores table
ALTER TABLE public.job_candidate_ats_scores 
DROP CONSTRAINT IF EXISTS job_candidate_ats_scores_candidate_id_fkey;

ALTER TABLE public.job_candidate_ats_scores 
ADD CONSTRAINT job_candidate_ats_scores_candidate_id_fkey 
FOREIGN KEY (candidate_id) REFERENCES public.experts(user_id) ON DELETE CASCADE;

-- Add comments for documentation
COMMENT ON TABLE public.experts IS 'Expert profiles containing professional data, skills, experience, and resume information';
COMMENT ON TABLE public.profiles IS 'Basic user profiles containing contact information and social links';
COMMENT ON COLUMN public.experts.experiences IS 'JSON array of work experience objects';
COMMENT ON COLUMN public.experts.ai_parsed_data IS 'AI-parsed data from resume for auto-filling fields';
COMMENT ON COLUMN public.experts.resume_text IS 'Extracted text from uploaded resume';
COMMENT ON COLUMN public.experts.resume_url IS 'URL to uploaded resume file';

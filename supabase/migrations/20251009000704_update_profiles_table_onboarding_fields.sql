-- Update profiles table to include all onboarding fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT,
ADD COLUMN IF NOT EXISTS headline TEXT,
ADD COLUMN IF NOT EXISTS availability TEXT,
ADD COLUMN IF NOT EXISTS status TEXT,
ADD COLUMN IF NOT EXISTS positions TEXT[],
ADD COLUMN IF NOT EXISTS seniority TEXT,
ADD COLUMN IF NOT EXISTS core_skills TEXT[],
ADD COLUMN IF NOT EXISTS other_skills TEXT[],
ADD COLUMN IF NOT EXISTS work_eligibility TEXT,
ADD COLUMN IF NOT EXISTS work_preference TEXT,
ADD COLUMN IF NOT EXISTS working_timezones TEXT[],
ADD COLUMN IF NOT EXISTS employment_type TEXT,
ADD COLUMN IF NOT EXISTS expected_salary TEXT,
ADD COLUMN IF NOT EXISTS skills_preference TEXT[],
ADD COLUMN IF NOT EXISTS industries TEXT[],
ADD COLUMN IF NOT EXISTS funding_stages TEXT[],
ADD COLUMN IF NOT EXISTS company_sizes TEXT[],
ADD COLUMN IF NOT EXISTS experiences JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS resume_url TEXT,
ADD COLUMN IF NOT EXISTS resume_text TEXT,
ADD COLUMN IF NOT EXISTS ai_parsed_data JSONB DEFAULT '{}'::jsonb;

-- Create index on onboarding_completed for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed ON public.profiles(onboarding_completed);

-- Create index on positions for job matching
CREATE INDEX IF NOT EXISTS idx_profiles_positions ON public.profiles USING GIN(positions);

-- Create index on core_skills for skill-based matching
CREATE INDEX IF NOT EXISTS idx_profiles_core_skills ON public.profiles USING GIN(core_skills);

-- Create index on industries for industry-based matching
CREATE INDEX IF NOT EXISTS idx_profiles_industries ON public.profiles USING GIN(industries);

-- Update the handle_new_user function to include new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    first_name, 
    last_name,
    onboarding_completed
  )
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'first_name', 
    NEW.raw_user_meta_data->>'last_name',
    FALSE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment to explain the table structure
COMMENT ON TABLE public.profiles IS 'User profiles with comprehensive onboarding data for job matching';
COMMENT ON COLUMN public.profiles.experiences IS 'JSON array of work experience objects';
COMMENT ON COLUMN public.profiles.ai_parsed_data IS 'AI-parsed data from resume for auto-filling fields';
COMMENT ON COLUMN public.profiles.resume_text IS 'Extracted text from uploaded resume';
COMMENT ON COLUMN public.profiles.resume_url IS 'URL to uploaded resume file';

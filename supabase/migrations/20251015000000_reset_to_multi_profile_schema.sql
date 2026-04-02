-- Reset-first multi-profile schema update
-- Assumes database reset workflow, no backward compatibility required

-- Ensure helper function exists
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Rebuild profiles table to support one user -> many profiles
DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'user',
  avatar_url TEXT,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone_number TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  twitter_url TEXT,
  location TEXT,
  timezone TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_onboarding_completed ON public.profiles(onboarding_completed);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profiles" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profiles" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profiles" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own profiles" ON public.profiles
  FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Rebuild experts table to be keyed by profile_id
DROP TABLE IF EXISTS public.experts CASCADE;

CREATE TABLE public.experts (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  resume_url TEXT,
  resume_text TEXT,
  ai_parsed_data JSONB DEFAULT '{}'::jsonb,
  experiences JSONB DEFAULT '[]'::jsonb,
  core_skills TEXT[],
  other_skills TEXT[],
  industries TEXT[],
  positions TEXT[],
  seniority TEXT,
  headline TEXT,
  work_eligibility TEXT,
  work_preference TEXT,
  working_timezones TEXT[],
  employment_type TEXT,
  expected_salary TEXT,
  skills_preference TEXT[],
  funding_stages TEXT[],
  company_sizes TEXT[],
  availability TEXT,
  status TEXT,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE(profile_id)
);

CREATE INDEX idx_experts_profile_id ON public.experts(profile_id);
CREATE INDEX idx_experts_core_skills ON public.experts USING GIN(core_skills);
CREATE INDEX idx_experts_industries ON public.experts USING GIN(industries);
CREATE INDEX idx_experts_positions ON public.experts USING GIN(positions);

ALTER TABLE public.experts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own expert profiles" ON public.experts
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = experts.profile_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own expert profiles" ON public.experts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = experts.profile_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own expert profiles" ON public.experts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = experts.profile_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own expert profiles" ON public.experts
  FOR DELETE USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = experts.profile_id AND p.user_id = auth.uid()
    )
  );

CREATE OR REPLACE TRIGGER on_experts_updated
  BEFORE UPDATE ON public.experts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Rebuild signup trigger for initial profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    first_name,
    last_name,
    email,
    onboarding_completed
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.email,
    FALSE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update ATS scores table to profile-owned candidate key
ALTER TABLE public.job_candidate_ats_scores
  DROP CONSTRAINT IF EXISTS job_candidate_ats_scores_candidate_id_fkey;

ALTER TABLE public.job_candidate_ats_scores
  RENAME COLUMN candidate_id TO candidate_profile_id;

ALTER TABLE public.job_candidate_ats_scores
  ADD CONSTRAINT job_candidate_ats_scores_candidate_profile_id_fkey
  FOREIGN KEY (candidate_profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

DROP INDEX IF EXISTS idx_job_candidate_ats_scores_candidate_id;
CREATE INDEX idx_job_candidate_ats_scores_candidate_profile_id ON public.job_candidate_ats_scores(candidate_profile_id);

ALTER TABLE public.job_candidate_ats_scores
  DROP CONSTRAINT IF EXISTS job_candidate_ats_scores_job_id_candidate_id_calculated_at_key;

ALTER TABLE public.job_candidate_ats_scores
  ADD CONSTRAINT job_candidate_ats_scores_job_id_candidate_profile_id_calculated_at_key
  UNIQUE(job_id, candidate_profile_id, calculated_at);

DROP POLICY IF EXISTS "Candidates can view their own ATS scores" ON public.job_candidate_ats_scores;
CREATE POLICY "Candidates can view their own ATS scores" ON public.job_candidate_ats_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = candidate_profile_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can view all ATS scores" ON public.job_candidate_ats_scores;
CREATE POLICY "Admins can view all ATS scores" ON public.job_candidate_ats_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can insert ATS scores" ON public.job_candidate_ats_scores;
CREATE POLICY "Admins can insert ATS scores" ON public.job_candidate_ats_scores
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update ATS scores" ON public.job_candidate_ats_scores;
CREATE POLICY "Admins can update ATS scores" ON public.job_candidate_ats_scores
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete ATS scores" ON public.job_candidate_ats_scores;
CREATE POLICY "Admins can delete ATS scores" ON public.job_candidate_ats_scores
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );

-- Update generated resumes table to profile-owned candidate key
ALTER TABLE public.generated_resumes
  DROP CONSTRAINT IF EXISTS generated_resumes_candidate_id_fkey;

ALTER TABLE public.generated_resumes
  RENAME COLUMN candidate_id TO candidate_profile_id;

ALTER TABLE public.generated_resumes
  ADD CONSTRAINT generated_resumes_candidate_profile_id_fkey
  FOREIGN KEY (candidate_profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

DROP INDEX IF EXISTS idx_generated_resumes_candidate_id;
CREATE INDEX idx_generated_resumes_candidate_profile_id ON public.generated_resumes(candidate_profile_id);

ALTER TABLE public.generated_resumes
  DROP CONSTRAINT IF EXISTS generated_resumes_candidate_id_job_id_key;

ALTER TABLE public.generated_resumes
  ADD CONSTRAINT generated_resumes_candidate_profile_id_job_id_key
  UNIQUE(candidate_profile_id, job_id);

DROP POLICY IF EXISTS "Candidates can view their own generated resumes" ON public.generated_resumes;
CREATE POLICY "Candidates can view their own generated resumes" ON public.generated_resumes
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = candidate_profile_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Candidates can insert their own generated resumes" ON public.generated_resumes;
CREATE POLICY "Candidates can insert their own generated resumes" ON public.generated_resumes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = candidate_profile_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Candidates can update their own generated resumes" ON public.generated_resumes;
CREATE POLICY "Candidates can update their own generated resumes" ON public.generated_resumes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = candidate_profile_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Candidates can delete their own generated resumes" ON public.generated_resumes;
CREATE POLICY "Candidates can delete their own generated resumes" ON public.generated_resumes
  FOR DELETE USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = candidate_profile_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can view all generated resumes" ON public.generated_resumes;
CREATE POLICY "Admins can view all generated resumes" ON public.generated_resumes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can insert generated resumes" ON public.generated_resumes;
CREATE POLICY "Admins can insert generated resumes" ON public.generated_resumes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update generated resumes" ON public.generated_resumes;
CREATE POLICY "Admins can update generated resumes" ON public.generated_resumes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete generated resumes" ON public.generated_resumes;
CREATE POLICY "Admins can delete generated resumes" ON public.generated_resumes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );

-- Create generated_resumes table
-- This table stores AI-generated resumes tailored for specific job openings

CREATE TABLE IF NOT EXISTS public.generated_resumes (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL,
  job_id UUID NOT NULL,
  ats_score INTEGER NOT NULL CHECK (ats_score >= 95), -- Only generate for high-scoring matches
  resume_title VARCHAR(255) NOT NULL,
  resume_content TEXT NOT NULL,
  resume_format VARCHAR(50) DEFAULT 'pdf', -- pdf, docx, txt
  file_url TEXT DEFAULT NULL, -- URL to generated file if stored externally
  generation_prompt TEXT DEFAULT NULL, -- Store the prompt used for generation
  generation_metadata JSONB DEFAULT NULL, -- Additional metadata about generation
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (candidate_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE,
  UNIQUE(candidate_id, job_id) -- One resume per candidate per job
);

-- Enable RLS for generated_resumes table
ALTER TABLE public.generated_resumes ENABLE ROW LEVEL SECURITY;

-- Create policies for generated_resumes table
-- Candidates can view their own generated resumes
CREATE POLICY "Candidates can view their own generated resumes" ON public.generated_resumes
  FOR SELECT USING (candidate_id = auth.uid());

-- Candidates can insert their own generated resumes
CREATE POLICY "Candidates can insert their own generated resumes" ON public.generated_resumes
  FOR INSERT WITH CHECK (candidate_id = auth.uid());

-- Candidates can update their own generated resumes
CREATE POLICY "Candidates can update their own generated resumes" ON public.generated_resumes
  FOR UPDATE USING (candidate_id = auth.uid());

-- Candidates can delete their own generated resumes
CREATE POLICY "Candidates can delete their own generated resumes" ON public.generated_resumes
  FOR DELETE USING (candidate_id = auth.uid());

-- Admins can view all generated resumes
CREATE POLICY "Admins can view all generated resumes" ON public.generated_resumes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can insert generated resumes
CREATE POLICY "Admins can insert generated resumes" ON public.generated_resumes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update generated resumes
CREATE POLICY "Admins can update generated resumes" ON public.generated_resumes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete generated resumes
CREATE POLICY "Admins can delete generated resumes" ON public.generated_resumes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_generated_resumes_candidate_id ON public.generated_resumes(candidate_id);
CREATE INDEX IF NOT EXISTS idx_generated_resumes_job_id ON public.generated_resumes(job_id);
CREATE INDEX IF NOT EXISTS idx_generated_resumes_ats_score ON public.generated_resumes(ats_score DESC);
CREATE INDEX IF NOT EXISTS idx_generated_resumes_created_at ON public.generated_resumes(created_at DESC);

-- Add comment for documentation
COMMENT ON TABLE public.generated_resumes IS 'AI-generated resumes tailored for specific job openings with high ATS scores';
COMMENT ON COLUMN public.generated_resumes.ats_score IS 'ATS score must be >= 95 to generate resume';
COMMENT ON COLUMN public.generated_resumes.resume_content IS 'Generated resume content in markdown or HTML format';
COMMENT ON COLUMN public.generated_resumes.generation_prompt IS 'The AI prompt used to generate this resume';
COMMENT ON COLUMN public.generated_resumes.generation_metadata IS 'Additional metadata about the generation process';

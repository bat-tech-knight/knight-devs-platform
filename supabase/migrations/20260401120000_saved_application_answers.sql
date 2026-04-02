-- Per-expert-profile saved answers for job application custom questions (extension + web).

CREATE TABLE public.saved_application_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_key TEXT NOT NULL,
  label_snapshot TEXT NOT NULL DEFAULT '',
  answer_text TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'generic',
  hostname TEXT,
  external_field_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id),
  UNIQUE (profile_id, question_key)
);

CREATE INDEX idx_saved_application_answers_profile_id ON public.saved_application_answers(profile_id);
CREATE INDEX idx_saved_application_answers_question_key ON public.saved_application_answers(profile_id, question_key);

ALTER TABLE public.saved_application_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved application answers"
  ON public.saved_application_answers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = saved_application_answers.profile_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own saved application answers"
  ON public.saved_application_answers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = saved_application_answers.profile_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own saved application answers"
  ON public.saved_application_answers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = saved_application_answers.profile_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own saved application answers"
  ON public.saved_application_answers
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = saved_application_answers.profile_id AND p.user_id = auth.uid()
    )
  );

CREATE OR REPLACE TRIGGER on_saved_application_answers_updated
  BEFORE UPDATE ON public.saved_application_answers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

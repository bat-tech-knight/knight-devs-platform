-- Manual "I submitted this bid" records from the Chrome extension (Option D).

CREATE TABLE public.extension_external_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  page_url TEXT NOT NULL,
  page_title TEXT NOT NULL DEFAULT '',
  hostname TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id)
);

CREATE INDEX idx_extension_external_submissions_profile_id
  ON public.extension_external_submissions(profile_id);
CREATE INDEX idx_extension_external_submissions_created_at
  ON public.extension_external_submissions(profile_id, created_at DESC);

ALTER TABLE public.extension_external_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own extension external submissions"
  ON public.extension_external_submissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = extension_external_submissions.profile_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own extension external submissions"
  ON public.extension_external_submissions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = extension_external_submissions.profile_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own extension external submissions"
  ON public.extension_external_submissions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = extension_external_submissions.profile_id AND p.user_id = auth.uid()
    )
  );

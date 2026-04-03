-- Optional per-profile defaults for common US job application questions (extension autofill).
ALTER TABLE public.experts
  ADD COLUMN IF NOT EXISTS us_work_authorized BOOLEAN,
  ADD COLUMN IF NOT EXISTS requires_visa_sponsorship BOOLEAN;

COMMENT ON COLUMN public.experts.us_work_authorized IS 'Are you legally authorized to work in the United States? (Yes/No for autofill)';
COMMENT ON COLUMN public.experts.requires_visa_sponsorship IS 'Will you require employment visa sponsorship? (Yes/No for autofill)';

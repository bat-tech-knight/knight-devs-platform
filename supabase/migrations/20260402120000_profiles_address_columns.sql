-- Structured address fields on profiles; legacy `location` remains a denormalized summary (app-maintained).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS address_line1 TEXT,
  ADD COLUMN IF NOT EXISTS address_city TEXT,
  ADD COLUMN IF NOT EXISTS address_state TEXT,
  ADD COLUMN IF NOT EXISTS address_country TEXT,
  ADD COLUMN IF NOT EXISTS address_postal_code TEXT;

UPDATE public.profiles
SET address_line1 = NULLIF(trim(location), '')
WHERE location IS NOT NULL
  AND trim(location) <> ''
  AND address_line1 IS NULL;

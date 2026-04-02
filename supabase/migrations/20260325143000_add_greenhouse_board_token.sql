-- Optional Greenhouse job board token (subdomain slug, e.g. "stripe" from boards.greenhouse.io/stripe)
ALTER TABLE public.scraping_config
  ADD COLUMN IF NOT EXISTS greenhouse_board_token TEXT;

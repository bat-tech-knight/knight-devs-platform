-- Add job_id column to jobs table and enforce uniqueness when present
-- This keeps existing rows valid (job_id nullable) while allowing upserts on job_id

begin;

alter table public.jobs
  add column if not exists job_id text;

-- Create a partial unique index so only non-null job_id values must be unique
create unique index if not exists jobs_job_id_unique
  on public.jobs (job_id)
  where job_id is not null;

commit;



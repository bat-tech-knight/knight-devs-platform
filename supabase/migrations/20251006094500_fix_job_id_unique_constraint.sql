-- Replace partial unique index with a standard UNIQUE constraint on job_id
-- UNIQUE allows multiple NULLs in Postgres, so it's safe for rows without job_id

begin;

-- Drop partial index if it exists
do $$
begin
  if exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace where c.relkind = 'i' and c.relname = 'jobs_job_id_unique') then
    execute 'drop index if exists public.jobs_job_id_unique';
  end if;
end $$;

-- Add unique constraint if not exists
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'jobs_job_id_key'
      and conrelid = 'public.jobs'::regclass
  ) then
    alter table public.jobs add constraint jobs_job_id_key unique (job_id);
  end if;
end $$;

commit;



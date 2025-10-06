-- Enable RLS and add admin-only policies for public.jobs
-- Admin is determined via public.profiles where profiles.id = auth.uid() and role = 'admin'

begin;

-- Enable RLS on jobs table
alter table public.jobs enable row level security;

-- Helper: condition used in policies
-- exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')

-- SELECT policy for admins
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'jobs' and policyname = 'jobs select for admin'
  ) then
    create policy "jobs select for admin"
      on public.jobs for select
      to authenticated
      using (
        exists (
          select 1 from public.profiles p 
          where p.id = auth.uid() and p.role = 'admin'
        )
      );
  end if;
end $$;

-- INSERT policy for admins
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'jobs' and policyname = 'jobs insert for admin'
  ) then
    create policy "jobs insert for admin"
      on public.jobs for insert
      to authenticated
      with check (
        exists (
          select 1 from public.profiles p 
          where p.id = auth.uid() and p.role = 'admin'
        )
      );
  end if;
end $$;

-- UPDATE policy for admins (required for upsert when a row exists)
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'jobs' and policyname = 'jobs update for admin'
  ) then
    create policy "jobs update for admin"
      on public.jobs for update
      to authenticated
      using (
        exists (
          select 1 from public.profiles p 
          where p.id = auth.uid() and p.role = 'admin'
        )
      )
      with check (
        exists (
          select 1 from public.profiles p 
          where p.id = auth.uid() and p.role = 'admin'
        )
      );
  end if;
end $$;

commit;



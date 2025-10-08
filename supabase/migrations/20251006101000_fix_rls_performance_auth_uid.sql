-- Fix RLS performance issues by wrapping auth.uid() calls with SELECT
-- This prevents auth.uid() from being re-evaluated for each row

begin;

-- Drop and recreate profiles table policies with optimized auth.uid() calls
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;

-- Recreate profiles policies with optimized auth.uid() calls
create policy "Users can view own profile" on public.profiles
  for select using ((select auth.uid()) = id);

create policy "Users can update own profile" on public.profiles
  for update using ((select auth.uid()) = id);

create policy "Users can insert own profile" on public.profiles
  for insert with check ((select auth.uid()) = id);

-- Drop and recreate scraping_config table policies with optimized auth.uid() calls
drop policy if exists "Admin can view scraping configs" on public.scraping_config;
drop policy if exists "Admin can insert scraping configs" on public.scraping_config;
drop policy if exists "Admin can update scraping configs" on public.scraping_config;
drop policy if exists "Admin can delete scraping configs" on public.scraping_config;

-- Recreate scraping_config policies with optimized auth.uid() calls
create policy "Admin can view scraping configs" on public.scraping_config
  for select using (
    exists (
      select 1 from public.profiles 
      where id = (select auth.uid()) and role = 'admin'
    )
  );

create policy "Admin can insert scraping configs" on public.scraping_config
  for insert with check (
    exists (
      select 1 from public.profiles 
      where id = (select auth.uid()) and role = 'admin'
    )
  );

create policy "Admin can update scraping configs" on public.scraping_config
  for update using (
    exists (
      select 1 from public.profiles 
      where id = (select auth.uid()) and role = 'admin'
    )
  );

create policy "Admin can delete scraping configs" on public.scraping_config
  for delete using (
    exists (
      select 1 from public.profiles 
      where id = (select auth.uid()) and role = 'admin'
    )
  );

-- Drop and recreate jobs table policies with optimized auth.uid() calls
drop policy if exists "jobs select for admin" on public.jobs;
drop policy if exists "jobs insert for admin" on public.jobs;
drop policy if exists "jobs update for admin" on public.jobs;
drop policy if exists "jobs delete for admin" on public.jobs;

-- Recreate jobs policies with optimized auth.uid() calls
create policy "jobs select for admin"
  on public.jobs for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p 
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );

create policy "jobs insert for admin"
  on public.jobs for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles p 
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );

create policy "jobs update for admin"
  on public.jobs for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p 
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p 
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );

create policy "jobs delete for admin"
  on public.jobs for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles p 
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );

-- Drop and recreate scraping_runs table policies with optimized auth.uid() calls
drop policy if exists "Admin can view scraping runs" on public.scraping_runs;
drop policy if exists "Admin can insert scraping runs" on public.scraping_runs;
drop policy if exists "Admin can update scraping runs" on public.scraping_runs;
drop policy if exists "Admin can delete scraping runs" on public.scraping_runs;

-- Recreate scraping_runs policies with optimized auth.uid() calls
create policy "Admin can view scraping runs" on public.scraping_runs
  for select using (
    exists (
      select 1 from public.profiles 
      where id = (select auth.uid()) and role = 'admin'
    )
  );

create policy "Admin can insert scraping runs" on public.scraping_runs
  for insert with check (
    exists (
      select 1 from public.profiles 
      where id = (select auth.uid()) and role = 'admin'
    )
  );

create policy "Admin can update scraping runs" on public.scraping_runs
  for update using (
    exists (
      select 1 from public.profiles 
      where id = (select auth.uid()) and role = 'admin'
    )
  );

create policy "Admin can delete scraping runs" on public.scraping_runs
  for delete using (
    exists (
      select 1 from public.profiles 
      where id = (select auth.uid()) and role = 'admin'
    )
  );

commit;

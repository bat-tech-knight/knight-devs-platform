-- Admin checks must use profiles.user_id = auth.uid(), not profiles.id.
-- profiles.id is the profile row PK; auth.uid() is the auth user id.

begin;

-- scraping_config
drop policy if exists "Admin can view scraping configs" on public.scraping_config;
drop policy if exists "Admin can insert scraping configs" on public.scraping_config;
drop policy if exists "Admin can update scraping configs" on public.scraping_config;
drop policy if exists "Admin can delete scraping configs" on public.scraping_config;

create policy "Admin can view scraping configs" on public.scraping_config
  for select using (
    exists (
      select 1 from public.profiles p
      where p.user_id = (select auth.uid()) and p.role = 'admin'
    )
  );

create policy "Admin can insert scraping configs" on public.scraping_config
  for insert with check (
    exists (
      select 1 from public.profiles p
      where p.user_id = (select auth.uid()) and p.role = 'admin'
    )
  );

create policy "Admin can update scraping configs" on public.scraping_config
  for update using (
    exists (
      select 1 from public.profiles p
      where p.user_id = (select auth.uid()) and p.role = 'admin'
    )
  );

create policy "Admin can delete scraping configs" on public.scraping_config
  for delete using (
    exists (
      select 1 from public.profiles p
      where p.user_id = (select auth.uid()) and p.role = 'admin'
    )
  );

-- scraping_runs
drop policy if exists "Admin can view scraping runs" on public.scraping_runs;
drop policy if exists "Admin can insert scraping runs" on public.scraping_runs;
drop policy if exists "Admin can update scraping runs" on public.scraping_runs;
drop policy if exists "Admin can delete scraping runs" on public.scraping_runs;

create policy "Admin can view scraping runs" on public.scraping_runs
  for select using (
    exists (
      select 1 from public.profiles p
      where p.user_id = (select auth.uid()) and p.role = 'admin'
    )
  );

create policy "Admin can insert scraping runs" on public.scraping_runs
  for insert with check (
    exists (
      select 1 from public.profiles p
      where p.user_id = (select auth.uid()) and p.role = 'admin'
    )
  );

create policy "Admin can update scraping runs" on public.scraping_runs
  for update using (
    exists (
      select 1 from public.profiles p
      where p.user_id = (select auth.uid()) and p.role = 'admin'
    )
  );

create policy "Admin can delete scraping runs" on public.scraping_runs
  for delete using (
    exists (
      select 1 from public.profiles p
      where p.user_id = (select auth.uid()) and p.role = 'admin'
    )
  );

-- jobs (admin policies from fix_rls_performance migration)
drop policy if exists "jobs select for admin" on public.jobs;
drop policy if exists "jobs insert for admin" on public.jobs;
drop policy if exists "jobs update for admin" on public.jobs;
drop policy if exists "jobs delete for admin" on public.jobs;

create policy "jobs select for admin" on public.jobs
  for select to authenticated using (
    exists (
      select 1 from public.profiles p
      where p.user_id = (select auth.uid()) and p.role = 'admin'
    )
  );

create policy "jobs insert for admin" on public.jobs
  for insert to authenticated with check (
    exists (
      select 1 from public.profiles p
      where p.user_id = (select auth.uid()) and p.role = 'admin'
    )
  );

create policy "jobs update for admin" on public.jobs
  for update to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.user_id = (select auth.uid()) and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.user_id = (select auth.uid()) and p.role = 'admin'
    )
  );

create policy "jobs delete for admin" on public.jobs
  for delete to authenticated using (
    exists (
      select 1 from public.profiles p
      where p.user_id = (select auth.uid()) and p.role = 'admin'
    )
  );

-- Candidate/public read policy (older migration used profiles.id = auth.uid(), wrong for multi-profile)
drop policy if exists "Users can view jobs" on public.jobs;
create policy "Users can view jobs" on public.jobs
  for select using (
    exists (
      select 1 from public.profiles p
      where p.user_id = (select auth.uid())
    )
  );

commit;

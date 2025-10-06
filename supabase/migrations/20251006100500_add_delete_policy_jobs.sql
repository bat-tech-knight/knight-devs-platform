-- Add DELETE policy for admins on public.jobs (RLS enabled)

begin;

do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'jobs' and policyname = 'jobs delete for admin'
  ) then
    create policy "jobs delete for admin"
      on public.jobs for delete
      to authenticated
      using (
        exists (
          select 1 from public.profiles p 
          where p.id = auth.uid() and p.role = 'admin'
        )
      );
  end if;
end $$;

commit;



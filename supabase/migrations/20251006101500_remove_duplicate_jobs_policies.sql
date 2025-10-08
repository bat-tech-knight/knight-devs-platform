-- Fix duplicate RLS policies on public.jobs table
-- Remove the older "Admin can * jobs" policies and keep the optimized "jobs * for admin" policies

begin;

-- Drop the older duplicate policies that were created in the initial migration
-- These have the same functionality as the newer optimized policies
drop policy if exists "Admin can view jobs" on public.jobs;
drop policy if exists "Admin can insert jobs" on public.jobs;
drop policy if exists "Admin can update jobs" on public.jobs;
drop policy if exists "Admin can delete jobs" on public.jobs;

-- The optimized policies with (select auth.uid()) are already in place from the previous migration
-- No need to recreate them, just removing the duplicates

commit;

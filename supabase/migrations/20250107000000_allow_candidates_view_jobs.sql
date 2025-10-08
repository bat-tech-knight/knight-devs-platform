-- Update RLS policies to allow candidates (regular users) to view jobs
-- This migration adds policies for regular users to read jobs data

begin;

-- Only proceed if the jobs table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs' AND table_schema = 'public') THEN
        -- Drop existing admin-only policies
        DROP POLICY IF EXISTS "Admin can view jobs" ON public.jobs;
        DROP POLICY IF EXISTS "Admin can insert jobs" ON public.jobs;
        DROP POLICY IF EXISTS "Admin can update jobs" ON public.jobs;
        DROP POLICY IF EXISTS "Admin can delete jobs" ON public.jobs;

        -- Create new policies that allow both admins and regular users to view jobs
        -- Only admins can modify jobs (insert, update, delete)
        CREATE POLICY "Users can view jobs" ON public.jobs
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM public.profiles 
              WHERE id = auth.uid()
            )
          );

        -- Only admin users can insert jobs
        CREATE POLICY "Admin can insert jobs" ON public.jobs
          FOR INSERT WITH CHECK (
            EXISTS (
              SELECT 1 FROM public.profiles 
              WHERE id = auth.uid() AND role = 'admin'
            )
          );

        -- Only admin users can update jobs
        CREATE POLICY "Admin can update jobs" ON public.jobs
          FOR UPDATE USING (
            EXISTS (
              SELECT 1 FROM public.profiles 
              WHERE id = auth.uid() AND role = 'admin'
            )
          );

        -- Only admin users can delete jobs
        CREATE POLICY "Admin can delete jobs" ON public.jobs
          FOR DELETE USING (
            EXISTS (
              SELECT 1 FROM public.profiles 
              WHERE id = auth.uid() AND role = 'admin'
            )
          );
    END IF;
END $$;

commit;

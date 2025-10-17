-- Create storage bucket for generated resumes
-- This migration creates a Supabase storage bucket for storing generated resume files

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'generated-resumes',
  'generated-resumes',
  false, -- Private bucket
  10485760, -- 10MB file size limit
  ARRAY['application/pdf', 'text/markdown', 'text/html', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for the generated-resumes bucket

-- Allow authenticated users to upload their own resume files
CREATE POLICY "Users can upload their own resume files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'generated-resumes' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow authenticated users to view their own resume files
CREATE POLICY "Users can view their own resume files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'generated-resumes' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow authenticated users to update their own resume files
CREATE POLICY "Users can update their own resume files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'generated-resumes' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow authenticated users to delete their own resume files
CREATE POLICY "Users can delete their own resume files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'generated-resumes' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow admins to view all resume files
CREATE POLICY "Admins can view all resume files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'generated-resumes' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to delete all resume files
CREATE POLICY "Admins can delete all resume files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'generated-resumes' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

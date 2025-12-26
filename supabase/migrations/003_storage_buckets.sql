-- Create storage buckets for file uploads

-- Bucket for project training documents (PDFs, text files)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-documents',
  'project-documents',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'text/plain', 'text/markdown', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Bucket for fund application attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'application-attachments',
  'application-attachments',
  false,
  20971520, -- 20MB limit
  ARRAY['application/pdf', 'text/plain', 'image/png', 'image/jpeg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
) ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Bucket for user avatars and logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true, -- Public so avatars can be displayed
  2097152, -- 2MB limit
  ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS Policies for project-documents bucket

-- Users can upload documents to their own projects
CREATE POLICY "Users can upload project documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM projects WHERE user_id = auth.uid()
  )
);

-- Users can view their own project documents
CREATE POLICY "Users can view own project documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM projects WHERE user_id = auth.uid()
  )
);

-- Users can delete their own project documents
CREATE POLICY "Users can delete own project documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM projects WHERE user_id = auth.uid()
  )
);

-- RLS Policies for application-attachments bucket

-- Users can upload attachments to their own applications
CREATE POLICY "Users can upload application attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'application-attachments' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM applications WHERE user_id = auth.uid()
  )
);

-- Users can view their own application attachments
CREATE POLICY "Users can view own application attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'application-attachments' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM applications WHERE user_id = auth.uid()
  )
);

-- Users can delete their own application attachments
CREATE POLICY "Users can delete own application attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'application-attachments' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM applications WHERE user_id = auth.uid()
  )
);

-- RLS Policies for avatars bucket (public read, authenticated write)

-- Anyone can view avatars (public bucket)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Users can upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);


INSERT INTO storage.buckets (id, name, public) VALUES ('temp-imports', 'temp-imports', false);

-- Policy to allow authenticated users to upload and delete their own files
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'temp-imports');
CREATE POLICY "Authenticated users can delete their own files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'temp-imports');
CREATE POLICY "Authenticated users can read their own files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'temp-imports');


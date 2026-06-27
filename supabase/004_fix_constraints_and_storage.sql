-- 1. Fix the role constraint in the profiles table to allow 'disabled'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'trainee', 'disabled'));

-- 2. Create Storage Buckets for lessons and assignments
INSERT INTO storage.buckets (id, name, public) VALUES ('lessons', 'lessons', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('assignments', 'assignments', true) ON CONFLICT (id) DO NOTHING;

-- 3. Set up Storage RLS Policies for 'lessons'
-- Allow public access to read files in the 'lessons' bucket
CREATE POLICY "Public Access to Lessons" ON storage.objects FOR SELECT USING (bucket_id = 'lessons');
-- Allow admins to upload/update/delete files in 'lessons'
CREATE POLICY "Admins can manage Lessons" ON storage.objects FOR ALL USING (bucket_id = 'lessons' AND public.get_user_role() = 'admin');

-- 4. Set up Storage RLS Policies for 'assignments'
-- Allow public access to read files in 'assignments' (so admins can read student uploads, and students can read their own)
CREATE POLICY "Public Access to Assignments" ON storage.objects FOR SELECT USING (bucket_id = 'assignments');
-- Allow authenticated users to upload files to 'assignments'
CREATE POLICY "Users can upload Assignments" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'assignments' AND auth.role() = 'authenticated');
-- Allow authenticated users to update their own assignments
CREATE POLICY "Users can update own Assignments" ON storage.objects FOR UPDATE USING (bucket_id = 'assignments' AND auth.role() = 'authenticated');
-- Allow admins to delete assignments
CREATE POLICY "Admins can delete Assignments" ON storage.objects FOR DELETE USING (bucket_id = 'assignments' AND public.get_user_role() = 'admin');

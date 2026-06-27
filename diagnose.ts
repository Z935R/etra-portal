import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wrmqbxkfowdupjjmbplm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndybXFieGtmb3dkdXBqam1icGxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMjcwNzYsImV4cCI6MjA5NzkwMzA3Nn0.02ZaiDoOx0jvQ-iYsrS0VEsUQ9cYQbT79-B0A-NfauU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('🔍 Running diagnostics on live Supabase Auth...');
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'rayan@etra.sa',
      password: 'Admin@ETRA2024',
    });

    if (error) {
      console.error('❌ Login failed!');
      console.error('Error Code:', error.code);
      console.error('Error Message:', error.message);
      console.error('Status:', error.status);
      console.error('Full Error:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ Login successful!');
      console.log('User:', data.user?.email);
      console.log('Session expires in:', data.session?.expires_in);
    }
  } catch (err) {
    console.error('💥 Unexpected error:', err);
  }
}

run();

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '.env.local') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function checkSignUp() {
  const { data, error } = await supabase.auth.signUp({
    email: 'test_signup_12345@gmail.com',
    password: 'Password@2024',
  });
  console.log('SignUp Data:', data);
  console.log('SignUp Error:', error);
}

checkSignUp();

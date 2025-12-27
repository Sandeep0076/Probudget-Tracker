import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
// Use SERVICE_ROLE_KEY for backend to bypass RLS (safe because backend is trusted)
// The anon key respects RLS and won't work now that we have user-based policies
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and service role key are required. Make sure SUPABASE_SERVICE_ROLE_KEY is in your .env file.');
}

console.log('[SUPABASE] Initializing client with URL:', supabaseUrl);
console.log('[SUPABASE] Using key type:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE (bypasses RLS)' : 'ANON (respects RLS)');

export const supabase = createClient(supabaseUrl, supabaseKey);
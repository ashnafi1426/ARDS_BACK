import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

dotenv.config();

export const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('✅ Supabase client initialized');


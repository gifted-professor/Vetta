import { createClient } from '@supabase/supabase-js';

const env = ((import.meta as any).env || {}) as Record<string, string | undefined>;
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

export const supabaseReady = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl || 'http://localhost:54321', supabaseAnonKey || 'anon');

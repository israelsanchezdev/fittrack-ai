import { createClient, SupabaseClient } from '@supabase/supabase-js';

const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('sb_url') : '';
const storedKey = typeof window !== 'undefined' ? localStorage.getItem('sb_key') : '';

// Safe access to process.env for different environments
// Vite/Vercel uses import.meta.env.VITE_...
// Fix: cast import.meta to any to avoid TS error "Property 'env' does not exist on type 'ImportMeta'"
const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || (typeof process !== 'undefined' && process.env && process.env.SUPABASE_URL) || '';
const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || (typeof process !== 'undefined' && process.env && process.env.SUPABASE_ANON_KEY) || '';

const getUrl = () => storedUrl || envUrl || '';
const getKey = () => storedKey || envKey || '';

// Initialize with available credentials or placeholders
// We export 'let' so we can update this binding dynamically
export let supabase: SupabaseClient = createClient(
  getUrl() || 'https://placeholder.supabase.co', 
  getKey() || 'placeholder'
);

export const isSupabaseConfigured = () => {
  const url = getUrl();
  const key = getKey();
  return url && 
         key &&
         url !== 'https://placeholder.supabase.co' && 
         !url.includes('your-project-id') &&
         !url.includes('placeholder');
};

export const saveSupabaseConfig = (url: string, key: string) => {
  localStorage.setItem('sb_url', url);
  localStorage.setItem('sb_key', key);
  
  // Re-initialize the client immediately
  try {
    supabase = createClient(url, key);
  } catch (e) {
    console.error("Failed to re-initialize Supabase client", e);
  }
};

export const clearSupabaseConfig = () => {
  localStorage.removeItem('sb_url');
  localStorage.removeItem('sb_key');
  
  // Reset to placeholder
  supabase = createClient('https://placeholder.supabase.co', 'placeholder');
};
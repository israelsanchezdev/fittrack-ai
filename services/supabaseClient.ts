import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 1. Try Local Storage (User manually entered keys in Settings)
const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('sb_url') : '';
const storedKey = typeof window !== 'undefined' ? localStorage.getItem('sb_key') : '';

// 2. Try Vite Environment Variables (Vercel Deployment)
// We cast to 'any' to avoid TypeScript errors if types aren't perfectly configured
const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

// Priority: Local Storage > Environment Variables
const getUrl = () => storedUrl || envUrl || '';
const getKey = () => storedKey || envKey || '';

// Initialize with available credentials or placeholders
// We export 'let' so we can update this binding dynamically if the user changes settings
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
  
  // Reset to env vars if available, or placeholder
  const fallbackUrl = envUrl || 'https://placeholder.supabase.co';
  const fallbackKey = envKey || 'placeholder';
  
  supabase = createClient(fallbackUrl, fallbackKey);
};

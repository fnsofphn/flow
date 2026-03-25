import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const OAUTH_PROVIDER_TOKEN_KEY = 'oauth_provider_token';
const OAUTH_PROVIDER_REFRESH_TOKEN_KEY = 'oauth_provider_refresh_token';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  throw new Error('Missing Supabase environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.provider_token) {
      window.localStorage.setItem(OAUTH_PROVIDER_TOKEN_KEY, session.provider_token);
    }

    if (session?.provider_refresh_token) {
      window.localStorage.setItem(OAUTH_PROVIDER_REFRESH_TOKEN_KEY, session.provider_refresh_token);
    }

    if (!session) {
      window.localStorage.removeItem(OAUTH_PROVIDER_TOKEN_KEY);
      window.localStorage.removeItem(OAUTH_PROVIDER_REFRESH_TOKEN_KEY);
    }
  });
}

export const getStoredGoogleProviderToken = () =>
  typeof window === 'undefined' ? null : window.localStorage.getItem(OAUTH_PROVIDER_TOKEN_KEY);

export const getStoredGoogleRefreshToken = () =>
  typeof window === 'undefined' ? null : window.localStorage.getItem(OAUTH_PROVIDER_REFRESH_TOKEN_KEY);

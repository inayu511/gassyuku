import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const getSupabaseConfig = (): { url: string; anonKey: string } | null => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey || /\s/.test(anonKey)) {
    return null;
  }

  try {
    const parsedUrl = new URL(url);
    const isLocalHttp =
      parsedUrl.protocol === 'http:' &&
      ['localhost', '127.0.0.1', '[::1]'].includes(parsedUrl.hostname);
    const isHttps = parsedUrl.protocol === 'https:';

    if ((!isHttps && !isLocalHttp) || !parsedUrl.hostname || parsedUrl.username || parsedUrl.password) {
      return null;
    }
  } catch {
    return null;
  }

  return { url, anonKey };
};

const createConfiguredSupabaseClient = (): SupabaseClient | null => {
  const config = getSupabaseConfig();
  if (!config) {
    return null;
  }

  try {
    return createClient(config.url, config.anonKey);
  } catch {
    return null;
  }
};

export const supabase = createConfiguredSupabaseClient();

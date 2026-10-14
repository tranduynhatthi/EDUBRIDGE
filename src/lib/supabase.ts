import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null = null;
function config() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('Chưa thiết lập NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY trong .env.local');
  return {url, key};
}

export function supabaseBrowser(): SupabaseClient {
  if (!browserClient) {
    const {url, key} = config();
    browserClient = createClient(url, key);
  }
  return browserClient;
}

export async function accessToken(): Promise<string> {
  const { data, error } = await supabaseBrowser().auth.getSession();
  if (error || !data.session?.access_token) throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  return data.session.access_token;
}

export async function authorizedFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const token = await accessToken();
  return fetch(url, { ...init, headers: {...init.headers, Authorization: `Bearer ${token}`}, cache: 'no-store' });
}

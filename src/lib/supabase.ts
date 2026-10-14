import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null = null;
function config() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('Thiếu cấu hình Supabase. Vào Vercel → Settings → Environment Variables và nhập URL cùng publishable key.');
  if (!/^https:\/\//.test(url) || /[\s\u0080-\uFFFF]/.test(url)) throw new Error('NEXT_PUBLIC_SUPABASE_URL không đúng định dạng. Hãy sao chép Project URL từ Supabase.');
  // The key becomes an HTTP header. Unicode, whitespace and copied instructions are invalid.
  if (!/^(sb_publishable_[A-Za-z0-9_-]+|eyJ[A-Za-z0-9._-]+)$/.test(key)) {
    throw new Error('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY không hợp lệ. Hãy sao chép đúng publishable key (sb_publishable_...) từ Supabase → Settings → API Keys; không nhập lời hướng dẫn, dấu ngoặc kép hoặc khoảng trắng.');
  }
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

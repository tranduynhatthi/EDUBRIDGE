import { createClient } from '@supabase/supabase-js';

export async function requireTeacher(request: Request) {
  const jwt = request.headers.get('Authorization')?.match(/^Bearer (.+)$/)?.[1];
  if (!jwt) throw new Error('AUTH_REQUIRED');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('ENV_SUPABASE_MISSING');
  const supabase = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  const { data: { user }, error } = await supabase.auth.getUser(jwt);
  if (error || !user) throw new Error('AUTH_REQUIRED');
  const {data: profile, error: profileError} = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profileError || (profile?.role !== 'teacher' && profile?.role !== 'admin')) throw new Error('TEACHER_REQUIRED');
  return {user, supabase, role: profile.role as 'teacher'|'admin'};
}
export async function requireAdmin(request: Request) {
  const auth = await requireTeacher(request);
  if (auth.role !== 'admin') throw new Error('ADMIN_REQUIRED');
  return auth;
}
export function authFailure(error: unknown): Response {
  const message = error instanceof Error ? error.message : '';
  if (message === 'AUTH_REQUIRED') return Response.json({error: 'Cần đăng nhập lại.'}, {status: 401});
  if (message === 'TEACHER_REQUIRED') return Response.json({error: 'Chức năng chỉ dành cho giáo viên hoặc quản trị viên.'}, {status: 403});
  if (message === 'ADMIN_REQUIRED') return Response.json({error: 'Chỉ quản trị viên mới được nhập SGK.'}, {status: 403});
  if (message === 'ENV_SUPABASE_MISSING') return Response.json({error: 'Máy chủ thiếu cấu hình Supabase.'}, {status: 503});
  return Response.json({error: 'Không thể xử lí yêu cầu. Vui lòng thử lại.'}, {status: 500});
}

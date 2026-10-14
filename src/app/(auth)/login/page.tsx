'use client';
import {FormEvent,useState} from 'react';
import {useRouter} from 'next/navigation';
import {BookOpen,ArrowRight,ShieldCheck} from 'lucide-react';
import {supabaseBrowser} from '@/lib/supabase';
export default function LoginPage() {
 const router=useRouter();
 const [register,setRegister]=useState(false);
 const [email,setEmail]=useState('');
 const [password,setPassword]=useState('');
 const [name,setName]=useState('');
 const [accountType,setAccountType]=useState<'teacher'|'student'>('teacher');
 const [loading,setLoading]=useState(false);
 const [message,setMessage]=useState('');
 async function submit(e:FormEvent) {
  e.preventDefault();setMessage('');setLoading(true);
  try {
   const api=supabaseBrowser();
   if(register){
    const {data,error}=await api.auth.signUp({email,password,options:{data:{full_name:name,role:accountType},emailRedirectTo:window.location.origin+'/auth/confirm'}});
    if(error)throw error;
    if(data.session){router.replace(accountType==='student'?'/student':'/dashboard');return;}
    setMessage('Kiểm tra email và bấm xác nhận. Sau khi xác nhận, trở về trang Đăng nhập. Nếu email mở localhost, Site URL trong Supabase cần được sửa thành tên miền Vercel chính thức.');
   } else {
    const {error}=await api.auth.signInWithPassword({email,password});if(error)throw error;
    const {data:{user}}=await api.auth.getUser();const {data:profile}=await api.from('profiles').select('role').eq('id',user?.id||'').single();router.replace(profile?.role==='student'?'/student':'/dashboard');
   }
  }catch(error){setMessage(error instanceof Error ? error.message : 'Không thể đăng nhập.');}
  finally{setLoading(false);}
 }
 return <div className="auth-page"><div className="auth-intro"><div className="intro-badge"><BookOpen size={25}/> EDUBRIDGE</div><h1>Biến tiếng Anh thành <em>cầu nối tri thức.</em></h1><p>Trợ giảng AI giúp giáo viên dạy các môn THPT bằng tiếng Anh, từ học liệu đến bài giảng.</p><div className="intro-feature"><ShieldCheck size={21}/> Dữ liệu bài dạy riêng tư theo từng tài khoản</div></div>
 <div className="auth-card"><span className="eyebrow">WELCOME TO EDUBRIDGE</span><h2>{register?'Tạo tài khoản giáo viên':'Đăng nhập'}</h2><p className="muted">{register?'Bắt đầu xây dựng bài học cùng AI.':'Đăng nhập để chọn ngay bài học từ kho SGK.'}</p>
 <form onSubmit={submit}><label>Vai trò tài khoản<select value={accountType} onChange={e=>setAccountType(e.target.value as 'teacher'|'student')}><option value="teacher">Giáo viên</option><option value="student">Học sinh</option></select></label>{register&&<label>Họ và tên<input required value={name} onChange={e=>setName(e.target.value)} placeholder="Nguyễn Văn A"/></label>}
 <label>Email<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="giaovien@truong.edu.vn"/></label>
 <label>Mật khẩu<input required type="password" minLength={6} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Ít nhất 6 kí tự"/></label>
 {message&&<p className="notice">{message}</p>}
 <button disabled={loading} className="primary-btn full" type="submit">{loading?'Đang xử lí…':register?'Tạo tài khoản':'Đăng nhập'} <ArrowRight size={18}/></button></form>
 <p className="auth-toggle">{register?'Đã có tài khoản?':'Chưa có tài khoản?'} <button onClick={()=>{setRegister(!register);setMessage('');}}>{register?'Đăng nhập':'Đăng ký giáo viên'}</button></p>
 <p className="auth-note">Tài khoản học sinh chỉ được tham gia lớp bằng mã do giáo viên cung cấp. Nếu xác nhận email chuyển về localhost, hãy yêu cầu quản trị viên cập nhật Supabase Authentication → URL Configuration (Site URL và Redirect URLs).</p>
 </div></div>;
}

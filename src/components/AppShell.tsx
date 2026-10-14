'use client';
import Link from 'next/link';
import {usePathname, useRouter} from 'next/navigation';
import {useEffect,useState} from 'react';
import {BookOpen, LayoutDashboard, LogOut, Sparkles, LibraryBig, ClipboardList, Mic2, Languages} from 'lucide-react';
import {supabaseBrowser} from '@/lib/supabase';

export default function AppShell({children,subtitle}:{children:React.ReactNode,subtitle?:string}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdmin,setIsAdmin]=useState(false);
  useEffect(()=>{let active=true;(async()=>{const {data:{user}}=await supabaseBrowser().auth.getUser();if(!user)return;const {data}=await supabaseBrowser().from('profiles').select('role').eq('id',user.id).single();if(active)setIsAdmin(data?.role==='admin');})();return()=>{active=false;};},[]);
  async function logout() {await supabaseBrowser().auth.signOut();router.replace('/login');}
  return <div className="app-layout">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><BookOpen size={23}/></div><div><strong>EDUBRIDGE</strong><small>AI LESSON BUILDER</small></div></div>
      <p className="side-label">KHÔNG GIAN GIÁO VIÊN</p>
      <nav className="side-nav"><Link className={pathname==='/dashboard'?'selected':''} href="/dashboard"><LayoutDashboard size={18}/> Tổng quan</Link>
      <Link className={pathname==='/builder'?'selected':''} href="/builder"><Sparkles size={18}/> Chọn môn / Bài SGK</Link><Link className={pathname==='/assignments'?'selected':''} href="/assignments"><ClipboardList size={18}/> Kết quả học sinh</Link><Link className={pathname==='/dictionary'?'selected':''} href="/dictionary"><Languages size={18}/> Từ điển chuyên ngành</Link><Link className={pathname==='/practice'?'selected':''} href="/practice"><Mic2 size={18}/> Luyện nói tiếng Anh</Link>{isAdmin&&<Link className={pathname.startsWith('/admin/library')?'selected':''} href="/admin/library"><LibraryBig size={18}/> Quản trị SGK</Link>}</nav>
      <div className="sidebar-bottom"><p>EDUBRIDGE 1.7 · GDPT 2018</p><button type="button" className="nav-logout" onClick={logout}><LogOut size={17}/> Đăng xuất</button></div>
    </aside>
    <div className="main-area"><header className="topbar"><span>EDUBRIDGE / {subtitle||'Không gian làm việc'}</span><span className="top-tag">GIÁO VIÊN</span></header><main className="main-content">{children}</main></div>
  </div>;
}

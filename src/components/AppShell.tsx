'use client';
import Link from 'next/link';
import {usePathname,useRouter} from 'next/navigation';
import {BookOpen,LayoutDashboard,LogOut,Sparkles,Mic2,Languages} from 'lucide-react';
import {supabaseBrowser} from '@/lib/supabase';

export default function AppShell({children,subtitle}:{children:React.ReactNode,subtitle?:string}){
 const pathname=usePathname(),router=useRouter();
 async function logout(){await supabaseBrowser().auth.signOut();router.replace('/login');}
 return <div className="app-layout">
 <aside className="sidebar">
  <div className="brand"><div className="brand-mark"><BookOpen size={23}/></div><div><strong>EDUBRIDGE</strong><small>AI LESSON BUILDER</small></div></div>
  <p className="side-label">KHÔNG GIAN GIÁO VIÊN</p>
  <nav className="side-nav">
   <Link className={pathname==='/dashboard'?'selected':''} href="/dashboard"><LayoutDashboard size={18}/> Tổng quan</Link>
   <Link className={pathname==='/builder'?'selected':''} href="/builder"><Sparkles size={18}/> Chọn môn / Bài học</Link>
   <Link className={pathname==='/dictionary'?'selected':''} href="/dictionary"><Languages size={18}/> Từ điển chuyên ngành</Link>
   <Link className={pathname==='/practice'?'selected':''} href="/practice"><Mic2 size={18}/> Luyện nói tiếng Anh</Link>
  </nav>
  <div className="sidebar-bottom"><p>EDUBRIDGE 1.12 · GDPT 2018</p><button type="button" className="nav-logout" onClick={logout}><LogOut size={17}/> Đăng xuất</button></div>
 </aside>
 <div className="main-area"><header className="topbar"><span>EDUBRIDGE / {subtitle||'Không gian làm việc'}</span><span className="top-tag">GIÁO VIÊN</span></header><main className="main-content">{children}</main></div>
 </div>;
}

'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {ArrowRight,BookOpen,Clock3,FilePlus2,Layers3,Sparkles} from 'lucide-react';
import AppShell from '@/components/AppShell';
import RequireLogin from '@/components/RequireLogin';
import {supabaseBrowser} from '@/lib/supabase';
import {SUBJECT_GROUPS} from '@/lib/subjects';
type Item={id:string;title:string;subject:string;grade:string;language_level:string;created_at:string};
export default function Dashboard(){
 const [items,setItems]=useState<Item[]>([]),[displayName,setDisplayName]=useState('giáo viên'),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 useEffect(()=>{let active=true;(async()=>{try{
  const api=supabaseBrowser();
  const [lessons,auth]=await Promise.all([
   api.from('lessons').select('id,title,subject,grade,language_level,created_at').order('created_at',{ascending:false}),
   api.auth.getUser()
  ]);
  if(lessons.error)throw lessons.error;
  let fullName=auth.data.user?.user_metadata?.full_name;
  if(auth.data.user){const profile=await api.from('profiles').select('full_name').eq('id',auth.data.user.id).single();
   if(!profile.error&&profile.data?.full_name?.trim())fullName=profile.data.full_name;}
  if(active){setItems(lessons.data||[]);setDisplayName(typeof fullName==='string'&&fullName.trim()?fullName.trim():'giáo viên');}
 }catch(e){if(active)setError(e instanceof Error?e.message:'Không thể tải trang tổng quan.');}
 finally{if(active)setLoading(false);}})();return()=>{active=false;};},[]);
 return <RequireLogin><AppShell subtitle="Tổng quan">
 <section className="welcome"><div><div className="eyebrow">EDUBRIDGE / KHÔNG GIAN GIÁO VIÊN</div>
 <h1>Xin chào, {displayName}! <span aria-hidden="true">👋</span></h1>
 <p>Chọn môn học bạn đang giảng dạy. EDUBRIDGE giúp soạn bài EMI/CLIL, slide, câu giao tiếp và bài tập từ học liệu đã có sẵn trong cơ sở dữ liệu.</p>
 <a className="primary-btn" href="#chon-mon">Chọn môn học <ArrowRight size={17}/></a></div><div className="hero-icon"><Sparkles size={56}/></div></section>
 <div className="stats"><div className="stat"><Layers3 size={24}/><div><b>{items.length}</b><small>Bài học đã tạo</small></div></div>
 <div className="stat"><BookOpen size={24}/><div><b>{SUBJECT_GROUPS.reduce((n,g)=>n+g.items.length,0)} môn</b><small>Môn hiện hỗ trợ</small></div></div>
 <div className="stat"><Clock3 size={24}/><div><b>EMI / CLIL</b><small>Dạy học song ngữ với Gemini</small></div></div></div>
 <section id="chon-mon" className="white-panel subject-panel"><div className="section-heading"><div><h2>Chọn môn học</h2><p>Nhấn vào môn để chọn bài học có sẵn trong cơ sở dữ liệu; không cần tải sách hay nhập nội dung.</p></div></div>
 {SUBJECT_GROUPS.map(group=><div className="subject-group" key={group.id}><h3>{group.label}</h3><div className="subject-grid">
 {group.items.map(subject=><Link key={subject} href={`/builder?subject=${encodeURIComponent(subject)}`} className="subject-card">
 <span className="subject-icon"><BookOpen size={20}/></span><strong>{subject}</strong><ArrowRight size={17} className="subject-arrow"/></Link>)}
 </div></div>)}
 <p className="muted" style={{marginTop:16,fontSize:12}}>Danh mục môn đang được EDUBRIDGE hỗ trợ; không phải toàn bộ môn học của Chương trình GDPT 2018. Bài giảng đã tạo trước đây vẫn được lưu trong tài khoản.</p>
 </section>
 <section className="white-panel" style={{marginTop:22}}><div className="section-heading"><div><h2>Bài học của tôi</h2><p>Nội dung đã tạo và lưu trong tài khoản.</p></div>
 <Link href="/builder" className="secondary-btn"><FilePlus2 size={16}/> Tạo bài mới</Link></div>
 {loading?<p>Đang tải...</p>:error?<p className="error">{error}</p>:items.length===0?
 <div className="empty-state"><BookOpen size={36}/><h3>Chưa có bài học nào</h3><p>Hãy chọn môn học và bài học có sẵn ở phía trên.</p></div>:
 <div className="lessons-list">{items.map(item=><Link key={item.id} className="lesson-item" href={`/lessons/${item.id}`}>
 <span className="lesson-avatar"><BookOpen size={20}/></span><div className="lesson-meta"><strong>{item.title}</strong>
 <span>{item.subject} · Lớp {item.grade} · English {item.language_level} · {new Date(item.created_at).toLocaleDateString('vi-VN')}</span></div><ArrowRight size={17}/></Link>)}</div>}
 </section></AppShell></RequireLogin>;
}

'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {ArrowRight,BookOpen,Clock3,FilePlus2,Layers3,Sparkles} from 'lucide-react';
import AppShell from '@/components/AppShell';
import RequireLogin from '@/components/RequireLogin';
import {supabaseBrowser} from '@/lib/supabase';

type Item={id:string,title:string,subject:string,grade:string,language_level:string,created_at:string};
export default function Dashboard() {
 const [items,setItems]=useState<Item[]>([]);const [error,setError]=useState('');const [loading,setLoading]=useState(true);
 useEffect(()=>{let live=true;async function load(){try{const{data,error}=await supabaseBrowser().from('lessons').select('id,title,subject,grade,language_level,created_at').order('created_at',{ascending:false});if(error)throw error;if(live)setItems(data||[]);}catch(e){if(live)setError(e instanceof Error?e.message:'Không thể tải bài học.');}finally{if(live)setLoading(false);}}load();return()=>{live=false;};},[]);
 return <RequireLogin><AppShell subtitle="Tổng quan">
 <section className="welcome"><div><div className="eyebrow">AI-POWERED TEACHING WORKSPACE</div><h1>Xin chào, giáo viên! <span>👋</span></h1><p>Chỉ cần chọn bài học từ SGK đã có trong hệ thống, AI sẽ hỗ trợ soạn dạy Vật lí bằng tiếng Anh.</p><Link href="/builder" className="primary-btn">Chọn bài từ SGK <ArrowRight size={17}/></Link></div><div className="hero-icon"><Sparkles size={56}/></div></section>
 <div className="stats"><div className="stat"><Layers3 size={24}/><div><b>{items.length}</b><small>Bài học đã tạo</small></div></div><div className="stat"><BookOpen size={24}/><div><b>Vật lí THPT</b><small>Môn học thí điểm</small></div></div><div className="stat"><Clock3 size={24}/><div><b>EMI / CLIL</b><small>Phương pháp giảng dạy</small></div></div></div>
 <section className="white-panel"><div className="section-heading"><div><h2>Bài học của tôi</h2><p>Tất cả nội dung đang lưu trong tài khoản này.</p></div><Link href="/builder" className="secondary-btn"><FilePlus2 size={16}/> Chọn bài</Link></div>
 {loading?<p>Đang tải…</p>:error?<p className="error">{error}. Nếu chưa chạy SQL hãy xem README.</p>:items.length===0?<div className="empty-state"><BookOpen size={38}/><h3>Chưa có bài học nào</h3><p>Hãy chọn một bài đã được duyệt trong kho SGK để bắt đầu.</p><Link className="primary-btn" href="/builder">Chọn bài Vật lí <ArrowRight size={16}/></Link></div>:
 <div className="lessons-list">{items.map(row=><Link href={`/lessons/${row.id}`} key={row.id} className="lesson-item"><div className="lesson-avatar"><BookOpen size={20}/></div><div className="lesson-meta"><strong>{row.title}</strong><span>Vật lí {row.grade} · English {row.language_level} · {new Date(row.created_at).toLocaleDateString('vi-VN')}</span></div><ArrowRight size={17}/></Link>)}</div>}
 </section></AppShell></RequireLogin>;
}

'use client';
import {FormEvent,useEffect,useMemo,useState} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {BookOpen,FileText,Info,LoaderCircle,ShieldCheck,Sparkles,LibraryBig} from 'lucide-react';
import AppShell from '@/components/AppShell';
import RequireLogin from '@/components/RequireLogin';
import {authorizedFetch,supabaseBrowser} from '@/lib/supabase';

type Book={id:string,title:string,subject:string,grade:string,book_series:string,publisher:string,is_active:boolean};
type CatalogLesson={id:string,textbook_id:string,sort_order:number,chapter:string,title:string,start_page:number,end_page:number};
export default function BuilderPage(){
 const router=useRouter();
 const [books,setBooks]=useState<Book[]>([]);
 const [catalog,setCatalog]=useState<CatalogLesson[]>([]);
 const [grade,setGrade]=useState<'10'|'11'|'12'>('12');
 const [bookId,setBookId]=useState('');
 const [lessonId,setLessonId]=useState('');
 const [level,setLevel]=useState<'A2'|'B1'|'B2'>('B1');
 const [notes,setNotes]=useState('Sử dụng tiếng Anh dễ hiểu, có câu hỏi tương tác, giữ nguyên ý nghĩa công thức và đơn vị.');
 const [loading,setLoading]=useState(false);
 const [catalogLoading,setCatalogLoading]=useState(true);
 const [error,setError]=useState('');
 const availableBooks=useMemo(()=>books.filter(b=>b.grade===grade&&b.is_active),[books,grade]);
 const availableLessons=useMemo(()=>catalog.filter(l=>l.textbook_id===bookId).sort((a,b)=>a.sort_order-b.sort_order),[catalog,bookId]);
 const selectedBook=books.find(b=>b.id===bookId);
 const selectedLesson=catalog.find(l=>l.id===lessonId);
 useEffect(()=>{let active=true;(async()=>{
  try{
   const [b,l]=await Promise.all([
    supabaseBrowser().from('textbooks').select('id,title,subject,grade,book_series,publisher,is_active').eq('is_active',true).order('grade'),
    supabaseBrowser().from('textbook_lessons').select('id,textbook_id,sort_order,chapter,title,start_page,end_page').eq('is_published',true).order('sort_order')
   ]);
   if(b.error)throw b.error;if(l.error)throw l.error;
   if(active){setBooks(b.data||[]);setCatalog(l.data||[]);}
  }catch(e){if(active)setError(e instanceof Error?e.message:'Không tải được kho bài học. Hãy chạy SQL 02.');}
  finally{if(active)setCatalogLoading(false);}
 })();return()=>{active=false;};},[]);
 useEffect(()=>{if(!availableBooks.some(b=>b.id===bookId))setBookId(availableBooks[0]?.id||'');},[availableBooks,bookId]);
 useEffect(()=>{if(!availableLessons.some(l=>l.id===lessonId))setLessonId(availableLessons[0]?.id||'');},[availableLessons,lessonId]);
 async function createLesson(event:FormEvent){
  event.preventDefault();setError('');
  if(!lessonId){setError('Kho SGK chưa có bài đã được duyệt. Liên hệ quản trị viên.');return;}
  setLoading(true);
  try{
   const r=await authorizedFetch('/api/ai/lesson',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({textbookLessonId:lessonId,languageLevel:level,teacherNotes:notes})});
   const json=await r.json();if(!r.ok)throw new Error(json.error||'Không thể tạo bài dạy.');
   router.push(`/lessons/${json.id}`);
  }catch(e){setError(e instanceof Error?e.message:'Không tạo được bài dạy.');}finally{setLoading(false);}
 }
 return <RequireLogin><AppShell subtitle="Chọn bài từ SGK">
 <div className="page-heading"><div><div className="eyebrow">EDUBRIDGE / LESSON CATALOG</div><h1>Chọn bài học từ sách giáo khoa</h1><p>Giáo viên không cần tải lại SGK. Chọn bài đã có trong thư viện và để AI chuẩn bị học liệu.</p></div><div className="header-symbol"><LibraryBig size={29}/></div></div>
 <form className="builder-grid" onSubmit={createLesson}>
 <div className="form-main"><section className="white-panel form-section"><h2><span className="step-dot">1</span> Chọn bài có sẵn</h2>
 <div className="form-grid">
 <label className="field">Môn học<select disabled value="Vật lí"><option>Vật lí</option></select></label>
 <label className="field">Khối lớp<select value={grade} onChange={e=>setGrade(e.target.value as '10'|'11'|'12')}><option value="10">Lớp 10</option><option value="11">Lớp 11</option><option value="12">Lớp 12</option></select></label>
 <label className="field wide">Bộ sách giáo khoa<select value={bookId} onChange={e=>setBookId(e.target.value)} disabled={catalogLoading||availableBooks.length===0}>
 {availableBooks.length===0?<option value="">Chưa có sách được nhập</option>:availableBooks.map(b=><option key={b.id} value={b.id}>{b.book_series} – {b.title}</option>)}
 </select></label>
 <label className="field wide">Bài học<select value={lessonId} onChange={e=>setLessonId(e.target.value)} disabled={catalogLoading||availableLessons.length===0}>
 {availableLessons.length===0?<option value="">Chưa có bài nào được duyệt</option>:availableLessons.map(l=><option key={l.id} value={l.id}>{l.sort_order}. {l.title}{l.chapter?` – ${l.chapter}`:''}</option>)}
 </select></label>
 </div>
 {selectedLesson&&selectedBook?<div className="catalog-selection"><BookOpen size={21}/><div><strong>{selectedLesson.title}</strong><p>{selectedBook.title} · {selectedBook.book_series} · Lớp {grade} · Trang PDF {selectedLesson.start_page}–{selectedLesson.end_page}</p><small>Kiến thức nguồn được lấy từ thư viện SGK đã được quản trị viên kiểm duyệt.</small></div></div>:<div className="warning-box"><Info size={18}/><span>{catalogLoading?'Đang tải danh mục…':'Chưa có dữ liệu SGK cho lựa chọn này. Quản trị viên cần nhập và duyệt bài trong mục Quản trị SGK.'}</span></div>}
 </section>
 <section className="white-panel form-section"><h2><span className="step-dot">2</span> Tùy chỉnh bài dạy</h2>
 <div className="form-grid"><label className="field">Trình độ tiếng Anh<select value={level} onChange={e=>setLevel(e.target.value as 'A2'|'B1'|'B2')}><option value="A2">A2 – Cơ bản</option><option value="B1">B1 – Trung bình</option><option value="B2">B2 – Khá</option></select></label></div>
 <label className="field" style={{marginTop:18}}>Hướng dẫn bổ sung (không bắt buộc)<textarea rows={4} maxLength={1500} value={notes} onChange={e=>setNotes(e.target.value)}/></label>
 </section></div>
 <aside className="form-aside"><section className="white-panel preview-panel"><div className="aside-title"><Sparkles size={20}/> EDUBRIDGE AI</div><h3>Sau khi chọn bài, AI tạo:</h3><ul className="feature-list"><li><BookOpen size={16}/> Mục tiêu kiến thức và ngôn ngữ</li><li><FileText size={16}/> Thuật ngữ Anh–Việt</li><li><FileText size={16}/> Slide và lời thoại giáo viên</li><li><FileText size={16}/> Câu giao tiếp và bài kiểm tra</li></ul>
 <div className="warning-box"><Info size={18}/><span>AI chỉ dùng nội dung bài được duyệt trong kho SGK. Giáo viên cần kiểm tra công thức, hình ảnh và đáp án trước khi giảng dạy.</span></div>
 {error&&<p className="error" role="alert">{error}</p>}
 <button type="submit" className="primary-btn full" disabled={!lessonId||loading||catalogLoading}>{loading?<><LoaderCircle className="rotating" size={19}/> AI đang tạo bài…</>:<><Sparkles size={18}/> Tạo bài dạy bằng AI</>}</button>
 <p className="privacy-note"><ShieldCheck size={14}/> Không cần tải lại sách khi soạn bài.</p>
 <Link href="/dashboard" className="muted" style={{display:'block',fontSize:12,marginTop:10,textAlign:'center'}}>Quay về tổng quan</Link>
 </section></aside></form></AppShell></RequireLogin>;
}

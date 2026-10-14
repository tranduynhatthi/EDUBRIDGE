'use client';
import {ChangeEvent,FormEvent,useEffect,useState} from 'react';
import {BookOpen,BookMarked,ScanText,CheckCircle2,FileUp,Info,LibraryBig,LoaderCircle,Save,ShieldCheck} from 'lucide-react';
import AppShell from '@/components/AppShell';
import RequireLogin from '@/components/RequireLogin';
import {authorizedFetch,supabaseBrowser} from '@/lib/supabase';

type Book={id:string,title:string,grade:string,book_series:string,publisher:string,page_count:number,is_active:boolean};
type CatalogLesson={id:string,textbook_id:string,sort_order:number,chapter:string,title:string,start_page:number,end_page:number,source_text:string,extraction_note:string,is_published:boolean};
export default function LibraryAdmin(){
 const [admin,setAdmin]=useState<boolean|null>(null);
 const [books,setBooks]=useState<Book[]>([]);
 const [catalog,setCatalog]=useState<CatalogLesson[]>([]);
 const [bookTitle,setBookTitle]=useState('Vật lí 12');
 const [grade,setGrade]=useState<'10'|'11'|'12'>('12');
 const [series,setSeries]=useState('Kết nối tri thức với cuộc sống');
 const [publisher,setPublisher]=useState('Nhà xuất bản Giáo dục Việt Nam');
 const [pdf,setPdf]=useState<File|null>(null);
 const [selectedBook,setSelectedBook]=useState('');
 const [sortOrder,setSortOrder]=useState(1);
 const [chapter,setChapter]=useState('Chương 1');
 const [lessonTitle,setLessonTitle]=useState('Bài 1. Cấu trúc của chất. Sự chuyển thể');
 const [startPage,setStartPage]=useState(7);
 const [endPage,setEndPage]=useState(10);
 const [manualText,setManualText]=useState('');
 const [extractionNote,setExtractionNote]=useState('');
 const [editId,setEditId]=useState('');
 const [editText,setEditText]=useState('');
 const [editNote,setEditNote]=useState('');
 const [confirmed,setConfirmed]=useState(false);
 const [busy,setBusy]=useState(false);
 const [status,setStatus]=useState('');
 const [error,setError]=useState('');
 const selected=books.find(b=>b.id===selectedBook);
 const selectedRecord=catalog.find(l=>l.id===editId);
 const catalogOfBook=catalog.filter(l=>l.textbook_id===selectedBook);
 const isPhysics12=!!selected&&selected.grade==='12'&&selected.page_count===126&&selected.book_series.toLowerCase().includes('kết nối tri thức');
 async function refresh(){
  const [b,l]=await Promise.all([
   supabaseBrowser().from('textbooks').select('id,title,grade,book_series,publisher,page_count,is_active').order('created_at',{ascending:false}),
   supabaseBrowser().from('textbook_lessons').select('id,textbook_id,sort_order,chapter,title,start_page,end_page,source_text,extraction_note,is_published').order('sort_order')
  ]);
  if(b.error)throw b.error;if(l.error)throw l.error;
  setBooks(b.data||[]);setCatalog(l.data||[]);
  setSelectedBook(v=>(b.data||[]).some(x=>x.id===v)?v:(b.data?.[0]?.id||''));
 }
 useEffect(()=>{let active=true;(async()=>{
  try{
   const {data:{user}}=await supabaseBrowser().auth.getUser();
   if(!user)return;
   const {data:profile}=await supabaseBrowser().from('profiles').select('role').eq('id',user.id).single();
   if(!active)return;
   const allowed=profile?.role==='admin';setAdmin(allowed);
   if(allowed)await refresh();
  }catch(e){if(active)setError(e instanceof Error?e.message:'Không thể đọc kho sách.');}
 })();return()=>{active=false;};},[]);
 function selectEditor(lesson:CatalogLesson){setEditId(lesson.id);setEditText(lesson.source_text);setEditNote(lesson.extraction_note);setConfirmed(false);setStatus('');setError('');}
 function fileChange(e:ChangeEvent<HTMLInputElement>){const f=e.target.files?.[0];setPdf(f||null);}
 async function uploadBook(e:FormEvent){
  e.preventDefault();setStatus('');setError('');
  if(!pdf){setError('Hãy chọn tệp PDF SGK.');return;}
  if(pdf.size>30*1024*1024){setError('PDF vượt giới hạn 30 MB.');return;}
  setBusy(true);
  const uuid=crypto.randomUUID();const path=uuid+'.pdf';
  try{
   const {error:upError}=await supabaseBrowser().storage.from('edubridge-textbooks').upload(path,pdf,{contentType:'application/pdf',upsert:false});
   if(upError)throw upError;
   const r=await authorizedFetch('/api/admin/books',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:bookTitle,grade,bookSeries:series,publisher,storagePath:uuid,originalFilename:pdf.name})});
   const json=await r.json();if(!r.ok){await supabaseBrowser().storage.from('edubridge-textbooks').remove([path]);throw new Error(json.error||'Không tạo được sách.');}
   setStatus(`Đã nhập ${bookTitle} (${json.pageCount} trang PDF) vào kho riêng tư. Hãy khai báo các bài.`);
   setPdf(null);await refresh();setSelectedBook(json.id);
  }catch(e){setError(e instanceof Error?e.message:'Lỗi tải SGK.');}finally{setBusy(false);}
 }
 async function importLesson(e:FormEvent){
  e.preventDefault();setError('');setStatus('');setBusy(true);
  try{
   const r=await authorizedFetch('/api/admin/lessons',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({bookId:selectedBook,sortOrder,chapter,title:lessonTitle,startPage,endPage,manualText,extractionNote})});
   const json=await r.json();if(!r.ok)throw new Error(json.error||'Không thể tách bài.');
   await refresh();setEditId(json.id);setEditText(json.sourceText);setEditNote(extractionNote);setConfirmed(false);
   setStatus('Đã tạo BẢN NHÁP. Hãy đọc lại chữ, hình và công thức trước khi công bố.');
   setSortOrder(n=>n+1);setManualText('');
  }catch(e){setError(e instanceof Error?e.message:'Không thể nhập bài.');}finally{setBusy(false);}
 }
 async function seedPhysics12(){
  if(!selectedBook)return;setBusy(true);setError('');setStatus('');
  try{
   const r=await authorizedFetch('/api/admin/catalog-seed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({bookId:selectedBook})});
   const json=await r.json();if(!r.ok)throw new Error(json.error||'Không tạo được danh mục.');
   await refresh();setStatus(`Đã thêm ${json.added} bài. Kho dự kiến ${json.total} bài; tất cả bài mới đều là bản nháp chưa hiển thị với giáo viên.`);
  }catch(e){setError(e instanceof Error?e.message:'Không tạo được mục lục.');}finally{setBusy(false);}
 }
 async function analyzeScan(){
  if(!editId)return;setBusy(true);setError('');setStatus('');
  try{
   const r=await authorizedFetch(`/api/admin/lessons/${editId}/analyze-pdf`,{method:'POST'});
   const json=await r.json();if(!r.ok)throw new Error(json.error||'AI không đọc được trang PDF ảnh.');
   setEditText(json.sourceText);setEditNote(json.extractionNote);setConfirmed(false);
   await refresh();setStatus('AI đã đọc PDF ảnh và ghi BẢN NHÁP. Hãy mở SGK đối chiếu từng công thức và hình vẽ trước khi duyệt.');
  }catch(e){setError(e instanceof Error?e.message:'Không tạo được bản nháp từ SGK.');}finally{setBusy(false);}
 }
 async function saveReview(publish:boolean){
  if(!editId)return;setError('');setStatus('');setBusy(true);
  try{
   const r=await authorizedFetch(`/api/admin/lessons/${editId}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({sourceText:editText,extractionNote:editNote,isPublished:publish,confirmedReview:confirmed})});
   const json=await r.json();if(!r.ok)throw new Error(json.error||'Không thể lưu bài.');
   await refresh();setStatus(publish?'Đã duyệt! Bài học xuất hiện trong danh mục giáo viên.':'Đã lưu bản nháp, chưa hiển thị cho giáo viên.');
  }catch(e){setError(e instanceof Error?e.message:'Lỗi khi lưu.');}finally{setBusy(false);}
 }
 return <RequireLogin><AppShell subtitle="Quản trị kho sách"><div className="page-heading"><div><div className="eyebrow">EDUBRIDGE / CONTENT ADMIN</div><h1>Quản trị sách giáo khoa</h1><p>Chỉ người phụ trách nội dung nhập sách một lần; giáo viên khác chỉ cần chọn bài học đã được duyệt.</p></div><div className="header-symbol"><LibraryBig size={28}/></div></div>
 {admin===null?<p>Đang xác thực vai trò quản trị…</p>:!admin?<section className="white-panel"><h2>Bạn không có quyền quản trị nội dung</h2><p>Để nhập sách, người điều hành cần cấp vai trò <code>admin</code> bằng Supabase SQL Editor theo README. Giáo viên thông thường không cần thực hiện bước này.</p></section>:<>
 {error&&<div className="error" role="alert" style={{marginBottom:18}}>{error}</div>}{status&&<div className="success-note" style={{marginBottom:18}}><CheckCircle2 size={17}/> {status}</div>}
 <div className="admin-layout">
 <section className="white-panel form-section"><h2><span className="step-dot">1</span> Nhập một bộ SGK vào thư viện</h2><p className="muted">PDF chỉ được lưu ở kho riêng tư. Chỉ nhập sách mà nhóm có quyền sử dụng.</p>
 <form onSubmit={uploadBook} className="admin-form"><label className="field">Tên sách<input value={bookTitle} minLength={3} onChange={e=>setBookTitle(e.target.value)} required/></label>
 <label className="field">Bộ sách<input value={series} minLength={2} onChange={e=>setSeries(e.target.value)} required/></label>
 <div className="form-grid"><label className="field">Lớp<select value={grade} onChange={e=>setGrade(e.target.value as '10'|'11'|'12')}><option value="10">10</option><option value="11">11</option><option value="12">12</option></select></label>
 <label className="field">Nhà xuất bản<input value={publisher} onChange={e=>setPublisher(e.target.value)}/></label></div>
 <label className="upload-box"><FileUp size={24}/><b>{pdf?pdf.name:'Chọn PDF SGK (≤ 30 MB)'}</b><span>Sách PDF nhiều trang, có thể cần đối chiếu nội dung ảnh/công thức</span><input type="file" accept="application/pdf,.pdf" onChange={fileChange} hidden/></label>
 <button disabled={busy||!pdf} type="submit" className="primary-btn">{busy?<LoaderCircle className="rotating" size={17}/>:<FileUp size={17}/>} Nhập sách</button></form></section>
 <section className="white-panel form-section"><h2><span className="step-dot">2</span> Khai báo từng bài theo trang PDF</h2>
 <form onSubmit={importLesson} className="admin-form"><label className="field">Chọn sách đã nhập<select value={selectedBook} onChange={e=>setSelectedBook(e.target.value)} required><option value="">Chưa có sách</option>{books.map(b=><option key={b.id} value={b.id}>{b.title} – {b.book_series} – {b.grade} ({b.page_count} trang)</option>)}</select></label>
 <div className="form-grid"><label className="field">Số thứ tự bài<input type="number" min={1} max={500} value={sortOrder} onChange={e=>setSortOrder(Number(e.target.value))} required/></label>
 <label className="field">Chương<input value={chapter} onChange={e=>setChapter(e.target.value)}/></label></div>
 <label className="field">Tên bài<input value={lessonTitle} minLength={5} onChange={e=>setLessonTitle(e.target.value)} required/></label>
 <div className="form-grid"><label className="field">Từ trang PDF<input type="number" min={1} max={selected?.page_count||1000} value={startPage} onChange={e=>setStartPage(Number(e.target.value))} required/></label>
 <label className="field">Đến trang PDF<input type="number" min={1} max={selected?.page_count||1000} value={endPage} onChange={e=>setEndPage(Number(e.target.value))} required/></label></div>
 <p className="muted" style={{fontSize:12}}>Dùng số trang của tệp PDF (khác số trang in trên giấy). Tối đa 25 trang mỗi lần.</p>
 <label className="field">Văn bản thay thế (không bắt buộc)<textarea rows={3} value={manualText} maxLength={30000} onChange={e=>setManualText(e.target.value)} placeholder="Chỉ dùng khi PDF ảnh quét hoặc công thức bị trích xuất sai. Nội dung này sẽ thay phần tự trích PDF."/></label>
 <label className="field">Ghi chú về nguồn và công thức<textarea rows={2} maxLength={1200} value={extractionNote} onChange={e=>setExtractionNote(e.target.value)}/></label>
 <button disabled={busy||!selectedBook} className="primary-btn" type="submit"><BookOpen size={17}/> Trích xuất bài và lưu bản nháp</button></form></section>
 </div>
 {isPhysics12&&<section className="white-panel form-section" style={{marginTop:22}}>
 <h2><span className="step-dot">2A</span> Tự động nhập danh mục 25 bài Vật lí 12</h2>
 <div className="attention"><Info size={19}/><div>Danh mục đã đối chiếu từ mục lục đúng tệp SGK Vật lí 12 Kết nối tri thức gồm 126 trang PDF. Hệ thống kiểm tra tệp gốc trước khi tạo. Chỉ tạo tiêu đề và trang – KHÔNG tự công bố nội dung sách.</div></div>
 <p className="muted">Sách đang chọn: <b>{selected?.title}</b> – đã có {catalogOfBook.length}/25 mục bài. Để đọc sách ảnh quét, chọn bài vừa tạo bên dưới và bấm “AI đọc PDF bài này”, sau đó đối chiếu và duyệt.</p>
 <button type="button" className="primary-btn" onClick={seedPhysics12} disabled={busy||!selectedBook}><BookMarked size={17}/> Nhập danh mục 25 bài từ SGK đã tải</button>
 </section>}
 <section className="white-panel" style={{marginTop:22}}><div className="section-heading"><div><h2>Danh mục bài đã nhập</h2><p>Chọn một bài để kiểm tra hoặc chỉnh sửa nội dung trước khi duyệt.</p></div></div>
 {catalog.length===0?<p className="muted">Chưa có bài. Hãy nhập SGK và khai báo trang của bài đầu tiên.</p>:<div className="catalog-items">{catalog.map(l=><button key={l.id} type="button" onClick={()=>selectEditor(l)} className={'catalog-row'+(editId===l.id?' active':'')}><span><strong>{l.sort_order}. {l.title}</strong><small>{books.find(b=>b.id===l.textbook_id)?.title} · PDF trang {l.start_page}–{l.end_page}</small></span><span className={l.is_published?'published-label':'draft-label'}>{l.is_published?'Đã duyệt':'Bản nháp'}</span></button>)}</div>}
 </section>
 {selectedRecord&&<section className="white-panel form-section" style={{marginTop:20}}><h2><span className="step-dot">3</span> Hậu kiểm và duyệt: {selectedRecord.title}</h2>
 <div className="attention"><Info size={19}/><div>Đọc đối chiếu với bản PDF gốc. Phần trích chữ có thể thiếu hình vẽ, chỉ số trên/dưới, dấu âm, căn thức hoặc ký hiệu. Không công bố nếu chưa xử lí lỗi kiến thức.</div></div>
 {!selectedRecord.is_published&&!selectedRecord.source_text.trim()&&<div style={{marginBottom:18}}>
 <p className="muted">Bài này mới có tên và phạm vi trang. Tệp SGK là PDF ảnh quét, nên không thể trích chữ bằng cách thông thường. Bấm nút dưới để AI đọc các trang của đúng bài; kết quả chỉ là bản nháp, cần giáo viên duyệt.</p>
 <button type="button" className="primary-btn" onClick={analyzeScan} disabled={busy}><ScanText size={17}/> {busy?'Đang đọc trang PDF…':'AI đọc PDF bài này → Tạo nguồn nháp'}</button>
 </div>}
 <label className="field">Toàn văn trích xuất – có thể sửa<textarea rows={19} value={editText} onChange={e=>{setEditText(e.target.value);setConfirmed(false);}}/></label>
 <p className="small-count">{editText.length.toLocaleString('vi-VN')} / 30.000 ký tự</p>
 <label className="field">Ghi chú kiểm duyệt<textarea rows={3} value={editNote} onChange={e=>setEditNote(e.target.value)}/></label>
 <label className="check-row"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/><span>Tôi đã đối chiếu trang nguồn và kiểm tra khái niệm, công thức, đơn vị, hình ảnh liên quan của bài.</span></label>
 <div className="action-row"><button disabled={busy||editText.length<250} className="secondary-btn" onClick={()=>saveReview(false)} type="button"><Save size={17}/> Lưu bản nháp</button>
 <button disabled={busy||!confirmed||editText.length<250} className="primary-btn" onClick={()=>saveReview(true)} type="button"><ShieldCheck size={17}/> Duyệt và cho giáo viên chọn</button></div>
 </section>}
 </>}
 </AppShell></RequireLogin>;
}

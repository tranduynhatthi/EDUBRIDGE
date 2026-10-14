'use client';
import {FormEvent,useEffect,useMemo,useState} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {BookOpen,FileText,Info,LoaderCircle,ShieldCheck,Sparkles,LibraryBig} from 'lucide-react';
import AppShell from '@/components/AppShell';
import RequireLogin from '@/components/RequireLogin';
import {authorizedFetch,supabaseBrowser} from '@/lib/supabase';
import {SUBJECT_GROUPS,isValidSubject,type SubjectName} from '@/lib/subjects';
import {makeOfflineLesson} from '@/lib/offline-lesson';
type Book={id:string;title:string;subject:string;grade:string;book_series:string;is_active:boolean};
type CatalogLesson={id:string;textbook_id:string;sort_order:number;chapter:string;title:string;start_page:number;end_page:number};
type ReadyLesson={id:string;subject:string;grade:string;slug:string;sort_order:number;chapter:string;title:string;source_text:string};
export default function BuilderPage(){
 const router=useRouter();
 const [subject,setSubject]=useState<SubjectName>('Vật lí'),[grade,setGrade]=useState<'10'|'11'|'12'>('12');
 const [books,setBooks]=useState<Book[]>([]),[catalog,setCatalog]=useState<CatalogLesson[]>([]);
 const [ready,setReady]=useState<ReadyLesson[]>([]),[readyId,setReadyId]=useState(''),[readyText,setReadyText]=useState('');
 const [lessonId,setLessonId]=useState(''),[level,setLevel]=useState<'A2'|'B1'|'B2'>('B1');
 const [notes,setNotes]=useState('Sử dụng tiếng Anh dễ hiểu, có câu hỏi tương tác, giữ nguyên thuật ngữ và kiến thức của nguồn.');
 const [generationMode,setGenerationMode]=useState<'standard'|'advanced'>('standard');
 const [mode,setMode]=useState<'starter'|'catalog'|'teacher'>('starter');
 const [ownTitle,setOwnTitle]=useState(''),[ownSource,setOwnSource]=useState(''),[ownFilename,setOwnFilename]=useState('Nội dung giáo viên cung cấp');
 const [readingPdf,setReadingPdf]=useState(false),[sourceWarnings,setSourceWarnings]=useState<string[]>([]);
 const [pdfStatus,setPdfStatus]=useState('');
 const [loading,setLoading]=useState(false),[catalogLoading,setCatalogLoading]=useState(true),[error,setError]=useState('');
 const [quotaLimited,setQuotaLimited]=useState(false);
 useEffect(()=>{const requested=new URLSearchParams(window.location.search).get('subject');if(isValidSubject(requested)){setSubject(requested);setGrade(requested==='Vật lí'?'12':'10');}},[]);
 const relevantBooks=useMemo(()=>books.filter(b=>b.subject===subject&&b.grade===grade&&b.is_active),[books,subject,grade]);
 const readyAvailable=useMemo(()=>ready.filter(l=>l.subject===subject&&l.grade===grade).sort((a,b)=>a.sort_order-b.sort_order),[ready,subject,grade]);
 const selectedReady=readyAvailable.find(l=>l.id===readyId);
 const availableLessons=useMemo(()=>{const ids=new Set(relevantBooks.map(b=>b.id));return catalog.filter(l=>ids.has(l.textbook_id)).sort((a,b)=>a.title.localeCompare(b.title,'vi'));},[catalog,relevantBooks]);
 const selectedLesson=availableLessons.find(l=>l.id===lessonId);
 const selectedBook=books.find(b=>b.id===selectedLesson?.textbook_id);
 useEffect(()=>{let active=true;(async()=>{try{
  const [b,l,starter]=await Promise.all([
   supabaseBrowser().from('textbooks').select('id,title,subject,grade,book_series,is_active').eq('is_active',true).order('grade'),
   supabaseBrowser().from('textbook_lessons').select('id,textbook_id,sort_order,chapter,title,start_page,end_page').eq('is_published',true).order('sort_order'),
   supabaseBrowser().from('edubridge_ready_lessons').select('id,slug,subject,grade,sort_order,chapter,title,source_text').eq('is_active',true).order('sort_order')
  ]);if(b.error)throw b.error;if(l.error)throw l.error;if(starter.error)throw starter.error;
  if(active){setBooks(b.data||[]);setCatalog(l.data||[]);setReady(starter.data||[]);}
 }catch(e){if(active)setError(e instanceof Error?e.message:'Không tải được kho học liệu đã duyệt.');}
 finally{if(active)setCatalogLoading(false);}})();return()=>{active=false;};},[]);
 useEffect(()=>{if(!availableLessons.some(l=>l.id===lessonId))setLessonId(availableLessons[0]?.id||'');},[availableLessons,lessonId]);
 useEffect(()=>{if(!readyAvailable.some(l=>l.id===readyId))setReadyId(readyAvailable[0]?.id||'');},[readyAvailable,readyId]);
 useEffect(()=>{setReadyText(selectedReady?.source_text||'');},[selectedReady?.id]);
 async function createLesson(e:FormEvent){
  e.preventDefault();setError('');setQuotaLimited(false);
  if(mode==='catalog'&&!lessonId){setError('Chưa có bài SGK đã duyệt ở môn/lớp này. Hãy chọn học liệu có sẵn hoặc tự nhập nội dung.');return;}
  if(mode==='starter'&&(!selectedReady||readyText.trim().length<250)){setError('Chưa có học liệu khởi đầu phù hợp. Hãy chọn lớp khác hoặc tự nhập nội dung.');return;}
  if(mode==='teacher'&&(ownTitle.trim().length<5||ownSource.trim().length<250)){setError('Tên bài ít nhất 5 ký tự và nội dung nguồn ít nhất 250 ký tự.');return;}
  setLoading(true);
  try{const payload=mode==='catalog'?{textbookLessonId:lessonId,languageLevel:level,teacherNotes:notes,generationMode}:
   mode==='starter'?{mode:'teacher',title:selectedReady!.title,subject,grade,languageLevel:level,teacherNotes:notes,sourceText:readyText.trim(),sourceFilename:'Học liệu EDUBRIDGE biên soạn độc lập – '+selectedReady!.slug,generationMode}:
   {mode:'teacher',title:ownTitle.trim(),subject,grade,languageLevel:level,teacherNotes:notes,sourceText:ownSource.trim(),sourceFilename:ownFilename,generationMode};
   const r=await authorizedFetch('/api/ai/lesson',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
   const rawResult=await r.text();
   let json:{id?:string;error?:string;code?:string};
   try{json=JSON.parse(rawResult) as typeof json;}catch{
     throw new Error('['+r.status+'] Máy chủ Vercel không trả JSON. Có thể yêu cầu bị ngắt hoặc hết thời gian; hãy thử tạo bài lại với nguồn ngắn hơn.');
   }
   if(!r.ok){if(json.code==='GEMINI_QUOTA_LIMIT')setQuotaLimited(true);throw new Error((json.code?'['+json.code+'] ':'')+(json.error||'Không thể tạo bài.'));}
   if(!json.id)throw new Error('[LESSON_MISSING_ID] Máy chủ chưa xác nhận đã lưu bài học.');
   router.push(`/lessons/${json.id}`);
  }catch(e){setError(e instanceof Error?e.message:'Không thể tạo bài.');}finally{setLoading(false);}
 }
 async function createOffline(){
  if(loading)return;
  setLoading(true);setError('');
  try{
   const api=supabaseBrowser();
   const {data:{user},error:authError}=await api.auth.getUser();
   if(authError||!user)throw new Error('Cần đăng nhập lại để lưu bản nháp.');
   let title='',source='',filename='',ref:string|null=null;
   if(mode==='starter'){
    if(!selectedReady)throw new Error('Chưa chọn học liệu có sẵn.');
    title=selectedReady.title;source=readyText.trim();filename='Học liệu EDUBRIDGE biên soạn độc lập – '+selectedReady.slug;
   }else if(mode==='teacher'){
    title=ownTitle.trim();source=ownSource.trim();filename=ownFilename;
   }else{
    if(!lessonId||!selectedLesson||!selectedBook)throw new Error('Chưa chọn bài SGK đã hậu kiểm.');
    const found=await api.from('textbook_lessons').select('source_text').eq('id',lessonId).eq('is_published',true).single();
    if(found.error||!found.data)throw new Error('Không lấy được nội dung SGK đã duyệt.');
    title=selectedLesson.title;source=found.data.source_text||'';ref=lessonId;
    filename=selectedBook.title+' – '+selectedBook.book_series;
   }
   if(title.length<5||source.length<250||source.length>25000)throw new Error('Cần tiêu đề và nguồn hợp lệ từ 250–25.000 ký tự.');
   const generated=makeOfflineLesson(title,source);
   const result=await api.from('lessons').insert({
    teacher_id:user.id,textbook_lesson_id:ref,title,subject,grade,language_level:level,
    source_text:source,source_filename:filename.slice(0,160),teacher_notes:notes,
    generated_content:generated,model_name:'offline-template',status:'draft'
   }).select('id').single();
   if(result.error||!result.data?.id)throw new Error('Không lưu được bản khung vào Supabase: '+(result.error?.code||'UNKNOWN'));
   router.push('/lessons/'+result.data.id);
  }catch(e){setError(e instanceof Error?e.message:'Không tạo được bản khung không dùng AI.');}finally{setLoading(false);}
 }
 async function uploadOwnFile(file:File|undefined){
  if(!file)return;setError('');setSourceWarnings([]);setPdfStatus('');
  if(file.size>4*1024*1024&&/\.pdf$/i.test(file.name)){setError('Tệp PDF vượt 4 MB, quá lớn để gửi trực tiếp qua Vercel. Vui lòng chỉ lưu 1–4 trang của bài hoặc nén PDF.');return;}
  if(file.size>10*1024*1024){setError('Tệp vượt 10 MB. Hãy rút gọn nội dung.');return;}
  setOwnFilename(file.name);
  if(/\.(txt|md)$/i.test(file.name)){
   const text=await file.text();if(text.length>25000){setError('Văn bản quá 25.000 ký tự. Chọn riêng một bài.');return;}
   setOwnSource(text);if(!ownTitle)setOwnTitle(file.name.replace(/\.[^.]+$/,''));return;
  }
  if(!/\.pdf$/i.test(file.name)){setError('Chỉ hỗ trợ PDF, TXT hoặc Markdown.');return;}
  setReadingPdf(true);setPdfStatus('Đang kiểm tra PDF và gửi Gemini đọc nội dung...');
  try{const form=new FormData();form.append('file',file);
   const r=await authorizedFetch('/api/ai/source-pdf',{method:'POST',body:form});
   const raw=await r.text();let json:Record<string,unknown>;
   try{json=JSON.parse(raw) as Record<string,unknown>;}catch{throw new Error('['+r.status+'] Máy chủ không nhận tệp PDF hoặc bị gián đoạn trước khi trả kết quả. Nếu PDF quá lớn, hãy tách 1–4 trang và thử lại.');}
   if(!r.ok)throw new Error((json.code?'['+String(json.code)+'] ':'')+String(json.error||'Không đọc được PDF.'));
   setOwnSource(String(json.sourceText||''));setSourceWarnings(Array.isArray(json.warnings)?json.warnings.map(String):[]);
   setPdfStatus('Đã đọc '+String(json.extractedLength||'')+' ký tự từ '+String(json.pages||'')+' trang. '+(json.method==='split-pdf'?'Đã thử đọc bổ sung từng nhóm trang. ':'')+'Hãy đối chiếu SGK và chỉnh sửa trước khi tạo bài.');
   if(!ownTitle)setOwnTitle(file.name.replace(/\.[^.]+$/,''));
  }catch(e){setError(e instanceof Error?e.message:'Không xử lý được PDF.');setPdfStatus('Đọc PDF thất bại, dữ liệu nguồn bạn đã nhập trước đó được giữ nguyên.');}
  finally{setReadingPdf(false);}
 }
 return <RequireLogin><AppShell subtitle="Chọn bài từ sách giáo khoa">
 <div className="page-heading"><div><div className="eyebrow">EDUBRIDGE / LESSON BUILDER</div>
 <h1>Chọn bài học – có sẵn sau đăng nhập</h1><p>Chọn học liệu EDUBRIDGE đã lưu trong cơ sở dữ liệu, không cần tải sách. Bài trích từ SGK sẽ được hiển thị riêng sau khi đã hậu kiểm.</p></div><div className="header-symbol"><LibraryBig size={29}/></div></div>
 <form className="builder-grid" onSubmit={createLesson}>
 <div className="form-main">
 <section className="white-panel form-section"><h2><span className="step-dot">1</span> Môn học và nguồn bài</h2>
 <div className="form-grid">
 <label className="field">Môn học<select value={subject} onChange={e=>{if(isValidSubject(e.target.value))setSubject(e.target.value);}}>
 {SUBJECT_GROUPS.map(group=><optgroup label={group.label} key={group.id}>{group.items.map(s=><option key={s} value={s}>{s}</option>)}</optgroup>)}</select></label>
 <label className="field">Lớp<select value={grade} onChange={e=>setGrade(e.target.value as '10'|'11'|'12')}>
 <option value="10">Lớp 10</option><option value="11">Lớp 11</option><option value="12">Lớp 12</option></select></label></div>
 <div className="action-row" style={{margin:'20px 0'}}>
 <button className={mode==='starter'?'primary-btn':'secondary-btn'} type="button" onClick={()=>{setMode('starter');setError('');}}>Học liệu có sẵn</button>
 <button className={mode==='catalog'?'primary-btn':'secondary-btn'} type="button" onClick={()=>{setMode('catalog');setError('');}}>SGK đã hậu kiểm</button>
 <button className={mode==='teacher'?'primary-btn':'secondary-btn'} type="button" onClick={()=>{setMode('teacher');setError('');}}>Tự đưa nội dung SGK</button></div>
 {mode==='starter'?<>
 <label className="field">Bài học đã tích hợp<select value={readyId} onChange={e=>setReadyId(e.target.value)} disabled={catalogLoading||readyAvailable.length===0}>
 {readyAvailable.length===0?<option value="">Chưa có học liệu khởi đầu cho môn và lớp này</option>:readyAvailable.map(l=><option key={l.id} value={l.id}>{l.title}</option>)}</select></label>
 {selectedReady?<div style={{marginTop:14}}>
 <div className="catalog-selection"><BookOpen size={20}/><div><strong>{selectedReady.title}</strong><p>{subject} · Lớp {grade} · {selectedReady.chapter}</p><small>Học liệu gốc do EDUBRIDGE biên soạn, không phải bản trích hay nội dung SGK đã hậu kiểm.</small></div></div>
 <label className="field" style={{marginTop:15}}>Nội dung học liệu – có thể xem và chỉnh sửa trước khi tạo bài<textarea rows={12} maxLength={25000} value={readyText} onChange={e=>setReadyText(e.target.value)}/></label>
 <p className="muted">{readyText.length.toLocaleString('vi-VN')} ký tự. Bạn có thể tự điều chỉnh nội dung cho phù hợp thực tế giảng dạy. Việc nhấn Tạo bài với Gemini mới sử dụng API.</p>
 </div>:<div className="warning-box"><Info size={18}/><span>Chưa có học liệu sẵn cho lựa chọn này. Hãy chọn lớp khác hoặc dùng Tự nhập nội dung.</span></div>}
 </>:mode==='catalog'?<>
 <label className="field">Bài học đã duyệt<select value={lessonId} onChange={e=>setLessonId(e.target.value)} disabled={catalogLoading||availableLessons.length===0}>
 {availableLessons.length===0?<option value="">Chưa có bài được duyệt ở môn/lớp này</option>:availableLessons.map(l=><option key={l.id} value={l.id}>{l.title}{l.chapter?` · ${l.chapter}`:''}</option>)}</select></label>
 {selectedLesson&&selectedBook?<div className="catalog-selection"><BookOpen size={21}/><div>
 <strong>{selectedLesson.title}</strong><p>{subject} · Lớp {grade} · Nguồn: {selectedBook.title} · PDF trang {selectedLesson.start_page}–{selectedLesson.end_page}</p>
 <small>Đã được quản trị viên duyệt. Không cần chọn bộ SGK riêng.</small></div></div>:
 <div className="warning-box"><Info size={18}/><span>{catalogLoading?'Đang tải danh mục...':'Chưa có bài được duyệt. Bạn có thể chuyển sang Tự đưa nội dung SGK ngay.'}</span></div>}
 </>:<div className="form-grid" style={{marginTop:12}}>
 <label className="field wide">Tên bài<input required maxLength={120} value={ownTitle} onChange={e=>setOwnTitle(e.target.value)} placeholder={subject==='Vật lí'?'Ví dụ: Cấu trúc của chất. Sự chuyển thể':'Nhập tên bài của môn '+subject}/></label>
 <label className="field wide">Tải nội dung bài (PDF 1–10 trang, tối đa 4 MB; TXT hoặc MD)<input type="file" accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown" disabled={readingPdf} onChange={e=>{void uploadOwnFile(e.target.files?.[0]);}}/></label>
 {readingPdf&&<p role="status">Gemini đang đọc PDF, vui lòng chờ...</p>}
 {pdfStatus&&<p role="status" className="muted">{pdfStatus}</p>}
 <label className="field wide">Nội dung nguồn — có thể chỉnh sửa trước khi tạo bài<textarea rows={12} maxLength={25000} value={ownSource} onChange={e=>setOwnSource(e.target.value)} placeholder="Dán nội dung SGK; kiểm tra, chỉnh sửa thuật ngữ, hình, công thức hoặc số liệu trước khi dùng AI."/></label>
 <p className="muted">{ownSource.length.toLocaleString('vi-VN')} / 25.000 ký tự. Nguồn chỉ thuộc tài khoản của bạn.</p>
 {sourceWarnings.length>0&&<div className="warning-box"><Info size={18}/><span>Cần hậu kiểm: {sourceWarnings.join(' | ')}</span></div>}
 <p className="muted">Chỉ đưa lên tài liệu có quyền sử dụng. PDF được gửi tới Gemini để đọc thành bản nháp.</p>
 </div>}</section>
 <section className="white-panel form-section"><h2><span className="step-dot">2</span> Tùy chỉnh bài dạy</h2>
 <div className="form-grid"><label className="field">Mức tiếng Anh<select value={level} onChange={e=>setLevel(e.target.value as 'A2'|'B1'|'B2')}>
 <option value="A2">A2 – Cơ bản</option><option value="B1">B1 – Trung bình</option><option value="B2">B2 – Khá</option></select></label>
 <label className="field">Mô hình Gemini<select value={generationMode} onChange={e=>setGenerationMode(e.target.value as 'standard'|'advanced')}>
 <option value="standard">Tiêu chuẩn · Gemini 3.5 Flash-Lite (mặc định)</option>
 <option value="advanced">Chuyên sâu · Gemini 3.8 Flash</option>
 </select></label></div>
 <p className="muted" style={{marginTop:9}}>Tạo bài thông thường dùng Gemini 3.5 Flash-Lite. Chọn “Chuyên sâu” mới dùng Gemini 3.8 Flash (hạn mức khác). Đọc PDF vẫn sử dụng Gemini 3.8 Flash.</p>
 <label className="field" style={{marginTop:18}}>Yêu cầu bổ sung<textarea rows={4} maxLength={1500} value={notes} onChange={e=>setNotes(e.target.value)}/></label>
 </section></div>
 <aside className="form-aside"><section className="white-panel preview-panel"><div className="aside-title"><Sparkles size={20}/> EDUBRIDGE AI</div>
 <h3>Gemini hỗ trợ bài {subject}:</h3><ul className="feature-list">
 <li><BookOpen size={16}/> Mục tiêu kiến thức và ngôn ngữ</li>
 <li><FileText size={16}/> Từ vựng chuyên môn Anh–Việt</li>
 <li><FileText size={16}/> Slide và kịch bản giáo viên</li>
 <li><FileText size={16}/> Câu giao tiếp và câu hỏi kiểm tra</li></ul>
 <div className="warning-box"><Info size={18}/><span>AI chỉ sử dụng nội dung bạn chọn hoặc đưa lên. Giáo viên cần kiểm duyệt độ chính xác trước khi giảng dạy.</span></div>
 {error&&<p className="error" role="alert">{error}</p>}
 <button type="submit" className="primary-btn full" disabled={loading||(mode==='catalog'?catalogLoading||!lessonId:mode==='starter'?catalogLoading||!selectedReady||readyText.trim().length<250:readingPdf||ownTitle.trim().length<5||ownSource.trim().length<250)}>
 {loading?<><LoaderCircle className="rotating" size={19}/> Gemini đang tạo bài...</>:<><Sparkles size={18}/> Tạo bài dạy với Gemini</>}</button>
 {quotaLimited&&<p role="status" className="muted" style={{marginTop:12}}>Hạn mức Gemini hiện không đủ. Bạn vẫn có thể tạo bản khung không dùng AI để soạn bài và chỉnh sửa.</p>}
 <button type="button" className="secondary-btn full" style={{marginTop:10}} onClick={()=>{void createOffline();}} disabled={loading||catalogLoading||(mode==='catalog'?!lessonId:mode==='starter'?!selectedReady||readyText.trim().length<250:ownTitle.trim().length<5||ownSource.trim().length<250)}>
 <FileText size={17}/> {loading?'Đang xử lý...':'Tạo bản khung KHÔNG dùng AI'}
 </button>
 <p className="muted" style={{fontSize:12,marginTop:10}}>Bản khung sắp xếp trích đoạn nguồn, không dịch thuật và không tự tạo đáp án đúng. Giáo viên phải hoàn thiện các mục [CHƯA_SOẠN] trước khi giao bài.</p>
 <p className="privacy-note"><ShieldCheck size={14}/> Bài học lưu riêng trong tài khoản.</p>
 <Link href="/dashboard" className="muted" style={{display:'block',fontSize:12,marginTop:12,textAlign:'center'}}>Quay về Tổng quan</Link>
 </section></aside></form></AppShell></RequireLogin>;
}

'use client';
import {FormEvent,useEffect,useMemo,useState} from 'react';
import {useRouter} from 'next/navigation';
import {BookOpen,FileText,Info,LoaderCircle,ShieldCheck,Sparkles,LibraryBig} from 'lucide-react';
import AppShell from '@/components/AppShell';
import RequireLogin from '@/components/RequireLogin';
import {authorizedFetch,supabaseBrowser} from '@/lib/supabase';
import {SUBJECT_GROUPS,isValidSubject,type SubjectName} from '@/lib/subjects';
import {makeOfflineLesson} from '@/lib/offline-lesson';

type ReadyLesson={id:string;subject:string;grade:string;slug:string;sort_order:number;chapter:string;title:string;source_text:string};
type Book={id:string;title:string;subject:string;grade:string;is_active:boolean};
type ApprovedLesson={id:string;textbook_id:string;sort_order:number;chapter:string;title:string};
type Choice={key:string;id:string;kind:'ready'|'approved';title:string;chapter:string;sort_order:number;source_text?:string;slug?:string;bookTitle?:string};

export default function BuilderPage(){
 const router=useRouter();
 const [subject,setSubject]=useState<SubjectName>('Vật lí');
 const [grade,setGrade]=useState<'10'|'11'|'12'>('12');
 const [ready,setReady]=useState<ReadyLesson[]>([]);
 const [approved,setApproved]=useState<ApprovedLesson[]>([]);
 const [books,setBooks]=useState<Book[]>([]);
 const [choiceKey,setChoiceKey]=useState('');
 const [level,setLevel]=useState<'A2'|'B1'|'B2'>('B1');
 const [notes,setNotes]=useState('Sử dụng tiếng Anh dễ hiểu, có câu hỏi tương tác, giữ nguyên thuật ngữ và kiến thức của nguồn.');
 const [generationMode,setGenerationMode]=useState<'standard'|'advanced'>('standard');
 const [loading,setLoading]=useState(false),[catalogLoading,setCatalogLoading]=useState(true),[error,setError]=useState(''),[quotaLimited,setQuotaLimited]=useState(false);

 useEffect(()=>{
  const requested=new URLSearchParams(window.location.search).get('subject');
  if(isValidSubject(requested)){setSubject(requested);setGrade(requested==='Vật lí'?'12':'10');}
 },[]);

 useEffect(()=>{
  let active=true;
  (async()=>{try{
   const api=supabaseBrowser();
   const [readyResult,approvedResult,booksResult]=await Promise.all([
    api.from('edubridge_ready_lessons').select('id,subject,grade,slug,sort_order,chapter,title,source_text').eq('is_active',true).order('sort_order'),
    api.from('textbook_lessons').select('id,textbook_id,sort_order,chapter,title').eq('is_published',true).order('sort_order'),
    api.from('textbooks').select('id,title,subject,grade,is_active').eq('is_active',true),
   ]);
   if(readyResult.error||approvedResult.error||booksResult.error)throw (readyResult.error||approvedResult.error||booksResult.error);
   if(active){setReady(readyResult.data||[]);setApproved(approvedResult.data||[]);setBooks(booksResult.data||[]);}
  }catch(e){if(active)setError(e instanceof Error?e.message:'Không tải được dữ liệu bài học.');}
  finally{if(active)setCatalogLoading(false);}
  })();
  return()=>{active=false;};
 },[]);

 const choices=useMemo<Choice[]>(()=>{
  const bookById=new Map(books.filter(b=>b.is_active&&b.subject===subject&&b.grade===grade).map(b=>[b.id,b]));
  const standard=ready.filter(l=>l.subject===subject&&l.grade===grade).map(l=>({
   key:'ready:'+l.id,id:l.id,kind:'ready' as const,title:l.title,chapter:l.chapter,sort_order:l.sort_order,source_text:l.source_text,slug:l.slug
  }));
  const verified=approved.filter(l=>bookById.has(l.textbook_id)).map(l=>({
   key:'approved:'+l.id,id:l.id,kind:'approved' as const,title:l.title,chapter:l.chapter,sort_order:l.sort_order,bookTitle:bookById.get(l.textbook_id)?.title
  }));
  return [...verified,...standard].sort((a,b)=>a.sort_order-b.sort_order||a.title.localeCompare(b.title,'vi'));
 },[ready,approved,books,subject,grade]);
 const selected=choices.find(l=>l.key===choiceKey)??choices[0];
 useEffect(()=>{if(!choices.some(l=>l.key===choiceKey))setChoiceKey(choices[0]?.key||'');},[choices,choiceKey]);

 function onSubjectChange(v:string){
  if(!isValidSubject(v))return;
  setSubject(v);setGrade(v==='Vật lí'?'12':'10');setError('');setQuotaLimited(false);
 }
 async function createLesson(event:FormEvent){
  event.preventDefault();setError('');setQuotaLimited(false);
  if(!selected){setError('Môn và lớp này chưa có bài học trong cơ sở dữ liệu.');return;}
  setLoading(true);
  try{
   // Only send a database lesson ID. Original source is fetched and verified by the server.
   const payload=selected.kind==='ready'
    ?{readyLessonId:selected.id,languageLevel:level,teacherNotes:notes,generationMode}
    :{textbookLessonId:selected.id,languageLevel:level,teacherNotes:notes,generationMode};
   const response=await authorizedFetch('/api/ai/lesson',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
   const raw=await response.text();
   let json:{id?:string;error?:string;code?:string};
   try{json=JSON.parse(raw) as typeof json;}catch{throw new Error('['+response.status+'] Máy chủ chưa trả JSON hợp lệ. Hãy thử lại khi kết nối ổn định.');}
   if(!response.ok){
    if(json.code==='GEMINI_QUOTA_LIMIT')setQuotaLimited(true);
    throw new Error((json.code?'['+json.code+'] ':'')+(json.error||'Không thể tạo bài.'));
   }
   if(!json.id)throw new Error('[LESSON_MISSING_ID] Máy chủ chưa xác nhận đã lưu bài.');
   router.push('/lessons/'+json.id);
  }catch(e){setError(e instanceof Error?e.message:'Không thể tạo bài.');}
  finally{setLoading(false);}
 }

 async function createOffline(){
  if(loading||!selected)return;
  setLoading(true);setError('');
  try{
   const api=supabaseBrowser();
   const {data:{user},error:authError}=await api.auth.getUser();
   if(authError||!user)throw new Error('Cần đăng nhập lại để lưu bản khung.');
   let source='',filename='',ref:string|null=null;
   if(selected.kind==='ready'){
    const got=await api.from('edubridge_ready_lessons').select('source_text,slug').eq('id',selected.id).eq('is_active',true).single();
    if(got.error||!got.data)throw new Error('Không tìm thấy học liệu có sẵn trong kho.');
    source=got.data.source_text||'';filename='Học liệu EDUBRIDGE biên soạn độc lập – '+got.data.slug;
   }else{
    const got=await api.from('textbook_lessons').select('source_text').eq('id',selected.id).eq('is_published',true).single();
    if(got.error||!got.data)throw new Error('Bài SGK chưa được duyệt hoặc không tồn tại.');
    source=got.data.source_text||'';filename=selected.bookTitle||'Bài SGK đã duyệt';ref=selected.id;
   }
   if(source.length<250||source.length>25000)throw new Error('Nội dung bài chưa đủ điều kiện để tạo bản khung.');
   const generated=makeOfflineLesson(selected.title,source);
   const saved=await api.from('lessons').insert({
    teacher_id:user.id,textbook_lesson_id:ref,title:selected.title,subject,grade,language_level:level,
    source_text:source,source_filename:filename.slice(0,160),teacher_notes:notes,
    generated_content:generated,model_name:'offline-template',status:'draft'
   }).select('id').single();
   if(saved.error||!saved.data?.id)throw new Error('Không lưu được bản khung trong Supabase: '+(saved.error?.code||'UNKNOWN'));
   router.push('/lessons/'+saved.data.id);
  }catch(e){setError(e instanceof Error?e.message:'Không tạo được bản khung.');}
  finally{setLoading(false);}
 }
 return <RequireLogin><AppShell subtitle="Chọn bài học">
  <div className="page-heading"><div><div className="eyebrow">EDUBRIDGE / LESSON LIBRARY</div>
   <h1>Chọn bài học từ cơ sở dữ liệu</h1>
   <p>Giáo viên chỉ cần chọn môn, lớp và bài học. Không cần tải sách hoặc nhập lại nội dung.</p></div>
   <div className="header-symbol"><LibraryBig size={29}/></div></div>
  <form className="builder-grid" onSubmit={createLesson}>
   <div className="form-main">
    <section className="white-panel form-section">
     <h2><span className="step-dot">1</span> Chọn môn – lớp – bài học</h2>
     <div className="form-grid">
      <label className="field">Môn học<select value={subject} onChange={e=>onSubjectChange(e.target.value)}>
       {SUBJECT_GROUPS.map(group=><optgroup label={group.label} key={group.id}>
        {group.items.map(s=><option key={s} value={s}>{s}</option>)}
       </optgroup>)}</select></label>
      <label className="field">Lớp<select value={grade} onChange={e=>{setGrade(e.target.value as '10'|'11'|'12');setError('');}}>
       <option value="10">Lớp 10</option><option value="11">Lớp 11</option><option value="12">Lớp 12</option>
      </select></label>
     </div>
     <label className="field" style={{marginTop:18}}>Bài học trong cơ sở dữ liệu
      <select value={selected?.key||''} onChange={e=>setChoiceKey(e.target.value)} disabled={catalogLoading||choices.length===0}>
       {choices.length===0?<option value="">Chưa có bài học cho môn/lớp này</option>:
        choices.map(l=><option key={l.key} value={l.key}>{l.title}</option>)}
      </select>
     </label>
     {catalogLoading?<p className="muted" role="status">Đang tải danh sách bài học...</p>
      :selected?<div className="catalog-selection" style={{marginTop:14}}>
       <BookOpen size={21}/><div><strong>{selected.title}</strong>
       <p>{subject} · Lớp {grade} · {selected.chapter}</p>
       <small>{selected.kind==='ready'
        ?'Học liệu tham khảo do EDUBRIDGE biên soạn; chưa phải nguyên văn SGK chính thức.'
        :'Nội dung SGK đã được duyệt trong cơ sở dữ liệu.'}</small>
       </div></div>
      :<div className="warning-box"><Info size={18}/><span>Môn/lớp này chưa có học liệu trong cơ sở dữ liệu. Hệ thống không tự tạo nội dung SGK hoặc yêu cầu giáo viên tải sách lên. Quản trị nội dung sẽ bổ sung sau khi có nguồn hợp lệ và được kiểm chứng.</span></div>}
     {selected?.kind==='ready'&&<details style={{marginTop:18}}>
      <summary style={{cursor:'pointer',fontWeight:600}}>Xem nội dung tham khảo đã lưu</summary>
      <textarea rows={9} readOnly value={selected.source_text||''} style={{width:'100%',marginTop:10}} aria-label="Nội dung tham khảo từ cơ sở dữ liệu"/>
      <p className="muted">Chỉ đọc. Nguồn chuẩn được lấy từ Supabase; không cần tải tệp hay nhập lại.</p>
     </details>}
     <p className="muted" style={{marginTop:14}}>Thư viện sẽ được cập nhật theo môn và lớp khi học liệu chính thức có quyền sử dụng đã được nhập và hậu kiểm.</p>
    </section>
    <section className="white-panel form-section"><h2><span className="step-dot">2</span> Tùy chỉnh bài dạy</h2>
     <div className="form-grid">
      <label className="field">Mức tiếng Anh<select value={level} onChange={e=>setLevel(e.target.value as 'A2'|'B1'|'B2')}>
       <option value="A2">A2 – Cơ bản</option><option value="B1">B1 – Trung bình</option><option value="B2">B2 – Khá</option>
      </select></label>
      <label className="field">Mô hình Gemini<select value={generationMode} onChange={e=>setGenerationMode(e.target.value as 'standard'|'advanced')}>
       <option value="standard">Tiêu chuẩn · Gemini 3.5 Flash-Lite</option>
       <option value="advanced">Chuyên sâu · Gemini 3.8 Flash</option>
      </select></label>
     </div>
     <label className="field" style={{marginTop:18}}>Yêu cầu bổ sung
      <textarea rows={4} maxLength={1500} value={notes} onChange={e=>setNotes(e.target.value)}/>
     </label>
    </section>
   </div>
   <aside className="form-aside">
    <section className="white-panel preview-panel">
     <div className="aside-title"><Sparkles size={20}/> EDUBRIDGE AI</div>
     <h3>Tạo bài dạy môn {subject}</h3>
     <ul className="feature-list">
      <li><BookOpen size={16}/> Mục tiêu kiến thức và ngôn ngữ</li>
      <li><FileText size={16}/> Thuật ngữ Anh–Việt</li>
      <li><FileText size={16}/> PowerPoint có hình minh họa và lời thoại trong Notes</li>
      <li><FileText size={16}/> Giáo án 5512 · Phiếu học tập · Đề ôn tập 10–2–3</li>
     </ul>
     <div className="warning-box"><Info size={18}/><span>AI dùng nội dung bài đã lưu trong cơ sở dữ liệu. Giáo viên phải hậu kiểm kiến thức trước khi sử dụng.</span></div>
     {error&&<p className="error" role="alert">{error}</p>}
     <button type="submit" className="primary-btn full" disabled={loading||catalogLoading||!selected}>
      {loading?<><LoaderCircle className="rotating" size={19}/> Đang xử lý...</>:<><Sparkles size={18}/> Tạo bài dạy với AI</>}
     </button>
     {quotaLimited&&<p role="status" className="muted" style={{marginTop:12}}>Gemini đã hết hạn mức. Bạn vẫn có thể tạo bản khung không dùng AI.</p>}
     <button type="button" className="secondary-btn full" style={{marginTop:10}} disabled={loading||catalogLoading||!selected} onClick={()=>{void createOffline();}}>
      <FileText size={17}/> Tạo bản khung KHÔNG dùng AI
     </button>
     <p className="muted" style={{fontSize:12,marginTop:10}}>Bản khung phải được giáo viên hoàn thiện câu hỏi và đáp án trước khi giao cho học sinh.</p>
     <p className="privacy-note"><ShieldCheck size={14}/> Bài học lưu riêng trong tài khoản.</p>
    </section>
   </aside>
  </form>
 </AppShell></RequireLogin>;
}

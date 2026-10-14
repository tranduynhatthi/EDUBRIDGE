'use client';
import {useEffect,useState} from 'react';
import {useParams,useRouter} from 'next/navigation';
import Link from 'next/link';
import {ArrowLeft,BookOpen,CheckCircle2,Download,FilePenLine,Save,ShieldAlert} from 'lucide-react';
import AppShell from '@/components/AppShell';
import RequireLogin from '@/components/RequireLogin';
import {authorizedFetch,supabaseBrowser} from '@/lib/supabase';
import {LessonResultSchema,type LessonResult,type LessonRow} from '@/lib/schema';
import {classifySlide,type SlideKind} from '@/lib/slide-deck';

const tabNames:{key:string,label:string}[]=[{key:'slides',label:'Slide + lời giảng'},{key:'vocabulary',label:'Thuật ngữ'},{key:'phrases',label:'Câu giao tiếp'},{key:'quiz',label:'Quiz'},{key:'objectives',label:'Mục tiêu'}];
export default function LessonDetail(){
 const params=useParams<{id:string}>();const router=useRouter();
 const [row,setRow]=useState<LessonRow|null>(null);const [result,setResult]=useState<LessonResult|null>(null);
 const [unsaved,setUnsaved]=useState(false);
 const [tab,setTab]=useState('slides');const [loading,setLoading]=useState(true);const [busy,setBusy]=useState(false);const [msg,setMsg]=useState('');const [error,setError]=useState('');
 useEffect(()=>{let active=true;async function load(){try{const {data,error}=await supabaseBrowser().from('lessons').select('*').eq('id',params.id).single();if(error)throw error;if(active){setRow(data as LessonRow);setResult((data as LessonRow).generated_content);}}catch(e){if(active)setError(e instanceof Error?e.message:'Không tìm thấy bài học.');}finally{if(active)setLoading(false);}}load();return()=>{active=false;};},[params.id]);
 async function save(){if(!result||!row)return;setBusy(true);setMsg('');setError('');try{
 const validation=LessonResultSchema.safeParse(result);
 if(!validation.success)throw new Error('Nội dung chưa hợp lệ, hãy kiểm tra đủ phần slide và câu hỏi.');
 if(result.quiz.length===0||result.quiz.length>30)throw new Error('Bài kiểm tra phải có từ 1 đến 30 câu.');
 if(row.model_name==='offline-template'&&JSON.stringify(result).includes('[CHƯA_SOẠN]'))throw new Error('Bản khung không AI còn câu hỏi hoặc đáp án [CHƯA_SOẠN]. Hãy thay tất cả chỗ trống trước khi đánh dấu đã rà soát.');
 for(const q of result.quiz){if(!q.questionEn.trim()||q.choices.length!==4||q.choices.some(a=>!a.trim())||q.correctIndex<0||q.correctIndex>3||!q.explanationVi.trim())throw new Error('Có câu hỏi thiếu nội dung, chưa đủ 4 phương án hoặc đáp án không hợp lệ.');}
 const {error}=await supabaseBrowser().from('lessons').update({generated_content:result,status:'reviewed'}).eq('id',row.id);if(error)throw error;setUnsaved(false);setMsg('Đã lưu bản chỉnh sửa và đánh dấu là đã rà soát.');}catch(e){setError(e instanceof Error?e.message:'Không thể lưu.');}finally{setBusy(false);}}
 async function assign(){if(!row)return;if(unsaved){setError('Hãy lưu chỉnh sửa trước khi giao bài.');return;}setBusy(true);setError('');try{const r=await authorizedFetch('/api/assignments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lessonId:row.id})});const j=await r.json();if(!r.ok)throw new Error(j.error||'Lỗi giao bài');setMsg(`Đã giao bài! Mã lớp: ${j.access_code} — gửi mã này cho học sinh.`);}catch(e){setError(e instanceof Error?e.message:'Không giao được bài.');}finally{setBusy(false);}}
 async function exportPptx(){if(!row)return;setBusy(true);setError('');try{const r=await authorizedFetch('/api/export/pptx',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:row.id})});if(!r.ok){const json=await r.json();throw new Error(json.error||'Không thể xuất PowerPoint.');}const blob=await r.blob();const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='EDUBRIDGE_'+row.title.replace(/[^\p{L}\p{N}_-]+/gu,'_')+'.pptx';a.click();URL.revokeObjectURL(url);}catch(e){setError(e instanceof Error?e.message:'Không thể xuất.');}finally{setBusy(false);}}
 function editQuiz(index:number,update:Partial<LessonResult['quiz'][number]>){setResult(old=>old?{...old,quiz:old.quiz.map((q,i)=>i===index?{...q,...update}:q)}:null);setUnsaved(true);setMsg('Có nội dung mới chưa lưu.');}
 function editSlide(index:number,field:'title'|'teacherScript'|'slideType'|'keyMessage'|'studentTask'|'visualSuggestion'|'formula',value:string){setResult(old=>old?{...old,slides:old.slides.map((s,i)=>i===index?{...s,[field]:value}:s)}:null);setUnsaved(true);setMsg('Có nội dung mới chưa lưu.');}
 function editBullet(index:number,value:string){setResult(old=>old?{...old,slides:old.slides.map((s,i)=>i===index?{...s,bullets:value.split('\n').map(x=>x.trim()).filter(Boolean)}:s)}:null);setUnsaved(true);setMsg('Có nội dung mới chưa lưu.');}
 return <RequireLogin><AppShell subtitle="Bài học đã tạo"><Link className="back-link" href="/dashboard"><ArrowLeft size={17}/> Quay lại danh sách</Link>
 {loading?<p>Đang tải bài giảng…</p>:error&&!row?<p className="error">{error} <button className="secondary-btn" onClick={()=>router.push('/dashboard')}>Về trang chủ</button></p>:row&&result?<>
 <div className="lesson-header"><div><div className="eyebrow">EDUBRIDGE / LESSON PREVIEW</div><h1>{row.title}</h1><p>{row.subject} lớp {row.grade} · Tiếng Anh {row.language_level} · {row.model_name==='offline-template'?'Bản khung không AI':'AI model: '+row.model_name}</p></div><div className="action-row"><button onClick={save} disabled={busy} className="secondary-btn"><Save size={17}/> Lưu chỉnh sửa</button><button onClick={assign} disabled={busy||unsaved} className="secondary-btn">Giao bài cho học sinh</button><button onClick={exportPptx} disabled={busy} className="primary-btn"><Download size={17}/> Xuất PPT Slide Studio</button></div></div>
 {msg&&<p className="success-note"><CheckCircle2 size={16}/> {msg}</p>}{error&&<p className="error">{error}</p>}
 {result.qualityWarnings.length>0&&<div className="attention"><ShieldAlert size={21}/><div><strong>Cảnh báo cần giáo viên kiểm tra</strong><ul>{result.qualityWarnings.map((warning,i)=><li key={i}>{warning}</li>)}</ul></div></div>}
 <div className="lesson-tabs">{tabNames.map(t=><button key={t.key} className={tab===t.key?'active':''} onClick={()=>setTab(t.key)}>{t.label}</button>)}</div>
 {tab==='slides'&&<div className="slide-stack">{result.slides.map((slide,i)=><section className="white-panel slide-editor" key={i}><div className="slide-num">SLIDE {String(i+1).padStart(2,'0')} · EDUBRIDGE SLIDE STUDIO</div>
 <div className="form-grid">
 <label className="field">Bố cục slide<select value={slide.slideType||'auto'} onChange={e=>editSlide(i,'slideType',e.target.value==='auto'?'':e.target.value)}>
 <option value="auto">Tự chọn bố cục – {classifySlide(slide,i,result.slides.length)}</option>
 <option value="warmup">Khởi động / Câu hỏi</option>
 <option value="concept">Khái niệm trọng tâm</option>
 <option value="process">Quy trình / Các bước</option>
 <option value="comparison">So sánh / Nêu khác biệt</option>
 <option value="diagram">Sơ đồ khái niệm</option>
 <option value="formula">Công thức / Định luật</option>
 <option value="example">Ví dụ / Vận dụng</option>
 <option value="activity">Hoạt động học sinh</option>
 <option value="summary">Tổng kết</option>
 </select></label>
 <label className="field">Thông điệp chính (tối đa 180 kí tự)<input maxLength={180} value={slide.keyMessage||''} onChange={e=>editSlide(i,'keyMessage',e.target.value)} placeholder="Một ý khoa học cốt lõi"/></label>
 </div>
 <p className="muted" style={{margin:'6px 0 15px'}}>Màu cam–trắng, 16:9; hình khối và sơ đồ có thể sửa trong PowerPoint. Gợi ý hình ảnh chưa tự chèn ảnh từ Internet.</p>
 <label className="field">Tiêu đề (chỉnh sửa được)<input value={slide.title} onChange={e=>editSlide(i,'title',e.target.value)}/></label><label className="field">Ý chính (mỗi dòng một ý)<textarea rows={Math.max(4,slide.bullets.length+1)} value={slide.bullets.join('\n')} onChange={e=>editBullet(i,e.target.value)}/></label><label className="field">Nhiệm vụ học sinh<input value={slide.studentTask||''} onChange={e=>editSlide(i,'studentTask',e.target.value)} placeholder="Predict / Discuss / Explain..."/></label>
 <label className="field">Công thức từ nguồn (nếu có, giữ nguyên ký hiệu)<input value={slide.formula||''} onChange={e=>editSlide(i,'formula',e.target.value)} placeholder="Ví dụ: pV = nRT"/></label>
 <label className="field">Gợi ý hình minh họa (chưa chèn tự động)<input value={slide.visualSuggestion||''} onChange={e=>editSlide(i,'visualSuggestion',e.target.value)} placeholder="Mô tả sơ đồ phù hợp"/></label>
 <label className="field">Teacher's Script<textarea rows={5} value={slide.teacherScript} onChange={e=>editSlide(i,'teacherScript',e.target.value)}/></label></section>)}</div>}
 {tab==='vocabulary'&&<section className="white-panel table-section"><h2><BookOpen size={22}/> Thuật ngữ chuyên ngành</h2><div className="scroll-table"><table><thead><tr><th>English</th><th>Tiếng Việt</th><th>Definition</th><th>Example</th></tr></thead><tbody>{result.vocabulary.map((term,i)=><tr key={i}><td><b>{term.termEn}</b></td><td>{term.termVi}</td><td>{term.definitionEn}</td><td>{term.exampleEn}</td></tr>)}</tbody></table></div></section>}
 {tab==='phrases'&&<section className="white-panel table-section"><h2>Câu giao tiếp trong lớp</h2><div className="scroll-table"><table><thead><tr><th>English classroom language</th><th>Ý nghĩa tiếng Việt</th></tr></thead><tbody>{result.classroomPhrases.map((p,i)=><tr key={i}><td>{p.english}</td><td>{p.vietnamese}</td></tr>)}</tbody></table></div></section>}
 {tab==='quiz'&&<div className="slide-stack">{result.quiz.map((q,i)=><section className="white-panel quiz-card" key={i}><h3>Câu {i+1}</h3><label className="field">Câu hỏi bằng tiếng Anh<input value={q.questionEn} onChange={e=>editQuiz(i,{questionEn:e.target.value})}/></label><div className="choices">{q.choices.map((v,j)=><label className="field" key={j}>Đáp án {String.fromCharCode(65+j)}<input value={v} onChange={e=>editQuiz(i,{choices:q.choices.map((x,k)=>k===j?e.target.value:x)})}/></label>)}</div><label className="field">Đáp án đúng<select value={q.correctIndex} onChange={e=>editQuiz(i,{correctIndex:Number(e.target.value)})}>{q.choices.map((_,j)=><option value={j} key={j}>{String.fromCharCode(65+j)}</option>)}</select></label><label className="field">Giải thích bằng tiếng Việt<textarea rows={2} value={q.explanationVi} onChange={e=>editQuiz(i,{explanationVi:e.target.value})}/></label></section>)}</div>}
 {tab==='objectives'&&<section className="white-panel table-section"><h2><FilePenLine size={21}/> Mục tiêu bài học</h2><h3>Mục tiêu kiến thức (Content)</h3><ul>{result.contentObjectives.map((s,i)=><li key={i}>{s}</li>)}</ul><h3>Mục tiêu ngôn ngữ (Language)</h3><ul>{result.languageObjectives.map((s,i)=><li key={i}>{s}</li>)}</ul><h3>Khái niệm trọng tâm</h3><ul>{result.keyConcepts.map((k,i)=><li key={i}><b>{k.vi}:</b> {k.en}</li>)}</ul></section>}
 <p className="review-disclaimer"><ShieldAlert size={16}/> Slide Studio xuất file 16:9 cam–trắng, nhiều bố cục, hình khối và sơ đồ vector có thể chỉnh sửa. Không chèn ảnh nguồn ngoài; công thức dạng text cần giáo viên kiểm tra. PowerPoint chỉ xuất nội dung đã lưu. Sau khi chỉnh sửa slide, hãy bấm “Lưu chỉnh sửa” trước khi xuất. Đã hỗ trợ giao bài và chấm quiz. Chấm phát âm và LMS nâng cao chưa có.</p>
 </>:null}</AppShell></RequireLogin>;
}

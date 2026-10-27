'use client';
import {useState} from 'react';
import {Download,FileText,BookOpenCheck,ClipboardList,ShieldAlert,Sparkles} from 'lucide-react';
import {authorizedFetch} from '@/lib/supabase';
import type {LessonResult} from '@/lib/schema';
import type {Plan5512,Worksheet,Review,MaterialType} from '@/lib/teaching-materials';

const kinds=[
 {kind:'plan',title:'Giáo án theo Công văn 5512',caption:'Phụ lục IV · Mục tiêu · Thiết bị · Bốn hoạt động'},
 {kind:'worksheet',title:'Phiếu học tập',caption:'Nhiệm vụ theo tiến trình, có đáp án riêng cho giáo viên'},
 {kind:'review',title:'Ôn tập sau bài học',caption:'10 câu nhiều lựa chọn · 2 câu đúng–sai · 3 câu trả lời ngắn'}
] as const;
const fieldMap={plan:'plan5512',worksheet:'worksheet',review:'reviewAssessment'} as const;
type Material=Plan5512|Worksheet|Review;
type Props={section:'lesson'|'review';lessonId:string;result:LessonResult;unsaved:boolean;onGenerated:(kind:MaterialType,material:Material)=>void};
export default function TeachingMaterialsPanel({section,lessonId,result,unsaved,onGenerated}:Props){
 const [selected,setSelected]=useState<MaterialType>(section==='review'?'review':'plan');
 const [mode,setMode]=useState<'standard'|'advanced'>('standard');
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const [answers,setAnswers]=useState(false);
 const selectedMaterial=selected==='plan'?result.plan5512:selected==='worksheet'?result.worksheet:result.reviewAssessment;
 async function generate(){
  if(unsaved){setError('Hãy lưu chỉnh sửa bài giảng trước khi tạo tài liệu mới.');return;}
  setBusy(true);setError('');setMessage('');
  try{
   const res=await authorizedFetch('/api/ai/materials',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:lessonId,kind:selected,generationMode:mode})});
   const body=await res.json() as {error?:string;code?:string;material?:Material};
   if(!res.ok||!body.material)throw new Error((body.code?'['+body.code+'] ':'')+(body.error||'Không tạo được tài liệu.'));
   onGenerated(selected,body.material);
   setMessage('Đã tạo và lưu bản nháp. Giáo viên cần kiểm tra nội dung và đáp án trước khi sử dụng.');
  }catch(e){setError(e instanceof Error?e.message:'Không thể tạo tài liệu.');}
  finally{setBusy(false);}
 }
 async function download(version:'student'|'answers'='student'){
  setBusy(true);setError('');
  try{
   const r=await authorizedFetch('/api/export/materials',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:lessonId,kind:selected,version})});
   if(!r.ok){const j=await r.json() as {error?:string};throw new Error(j.error||'Không thể xuất Word.');}
   const blob=await r.blob(),url=URL.createObjectURL(blob),link=document.createElement('a');
   link.href=url;link.download='EDUBRIDGE_'+selected+'_'+(version==='student'?'Hoc_sinh':'Dap_an_GV')+'.docx';
   document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
  }catch(e){setError(e instanceof Error?e.message:'Không thể xuất tài liệu.');}
  finally{setBusy(false);}
 }
 return <section className="white-panel" style={{padding:24}}>
  <div className="eyebrow">EDUBRIDGE / TEACHING MATERIALS</div>
  <h2>{section==='review'?'Câu hỏi ôn tập sau bài học':'Giáo án và phiếu học tập'}</h2>
  <p className="muted">Tài liệu được tạo từ nội dung bài học trong cơ sở dữ liệu. Mỗi lần bấm tạo sẽ dùng hạn mức Gemini; không tự động gọi AI hàng loạt.</p>
  <div className="form-grid" style={{margin:'14px 0'}}>
   {kinds.filter(item=>section==='review'?item.kind==='review':item.kind!=='review').map(({kind,title,caption})=><button type="button" key={kind} className={selected===kind?'primary-btn':'secondary-btn'} onClick={()=>{setSelected(kind);setMessage('');setError('');setAnswers(false);}} style={{height:'auto',minHeight:78,textAlign:'left',whiteSpace:'normal'}}>
    {kind==='plan'?<BookOpenCheck size={18}/>:kind==='worksheet'?<FileText size={18}/>:<ClipboardList size={18}/>}
    <span><strong>{title}</strong><small style={{display:'block',fontSize:12,opacity:.85,marginTop:4}}>{caption}</small></span>
   </button>)}
  </div>
  <div className="form-grid" style={{marginTop:12}}>
   <label className="field">Chất lượng AI
    <select value={mode} onChange={e=>setMode(e.target.value as 'standard'|'advanced')}>
     <option value="standard">Tiêu chuẩn · Gemini 3.5 Flash-Lite</option>
     <option value="advanced">Chuyên sâu · Gemini 3.8 Flash</option>
    </select>
   </label>
   <div style={{display:'flex',alignItems:'end',gap:8}}>
    <button type="button" className="primary-btn" disabled={busy||unsaved} onClick={()=>void generate()}><Sparkles size={17}/>{selectedMaterial?'Tạo lại tài liệu bằng AI':'Tạo tài liệu với AI'}</button>
   </div>
  </div>
  {unsaved&&<p className="error">Có chỉnh sửa chưa lưu ở các mục khác. Vui lòng lưu trước khi tạo tài liệu.</p>}
  {error&&<p role="alert" className="error">{error}</p>}{message&&<p role="status" className="success-note">{message}</p>}
  {selectedMaterial?<div style={{marginTop:22}}>
   <div className="action-row" style={{marginBottom:14}}>
    <button type="button" className="secondary-btn" disabled={busy} onClick={()=>void download('student')}><Download size={17}/>{selected==='plan'?'Xuất giáo án Word':selected==='worksheet'?'Xuất phiếu HS Word':'Xuất đề ôn tập Word'}</button>
    {selected!=='plan'&&<button type="button" className="secondary-btn" disabled={busy} onClick={()=>void download('answers')}><Download size={17}/> Xuất đáp án giáo viên</button>}
    {selected!=='plan'&&<button type="button" className="secondary-btn" onClick={()=>setAnswers(v=>!v)}>{answers?'Ẩn đáp án':'Xem đáp án giáo viên'}</button>}
   </div>
   {selected==='plan'&&<PlanPreview plan={selectedMaterial as Plan5512}/>}
   {selected==='worksheet'&&<WorksheetPreview sheet={selectedMaterial as Worksheet} showAnswers={answers}/>}
   {selected==='review'&&<ReviewPreview review={selectedMaterial as Review} showAnswers={answers}/>}
   <p className="review-disclaimer"><ShieldAlert size={16}/> Đây là bản nháp do AI sinh, chưa phải giáo án đã được nhà trường phê duyệt. Đề Word dành cho học sinh không chứa đáp án. Các câu đúng–sai và trả lời ngắn được giao qua Word để học sinh tự làm, chưa chấm tự động trong LMS.</p>
  </div>:<div className="empty-state" style={{marginTop:20}}><FileText size={30}/><h3>Chưa tạo tài liệu này</h3><p>Bấm “Tạo tài liệu với AI” để tạo bản nháp dựa trên bài đã lưu.</p></div>}
 </section>;
}
function PlanPreview({plan}:{plan:Plan5512}){
 const headings=['Mở đầu','Hình thành kiến thức','Luyện tập','Vận dụng'];
 return <div className="slide-stack">
  <section><h3>I. Mục tiêu</h3><b>Kiến thức</b><ul>{plan.knowledge.map((x,i)=><li key={i}>{x}</li>)}</ul>
  <b>Năng lực</b><ul>{plan.competencies.map((x,i)=><li key={i}>{x}</li>)}</ul>
  <b>Phẩm chất</b><ul>{plan.qualities.map((x,i)=><li key={i}>{x}</li>)}</ul></section>
  <section><h3>II. Thiết bị dạy học và học liệu</h3><p><strong>GV:</strong> {plan.teacherEquipment.join('; ')}</p><p><strong>HS:</strong> {plan.studentEquipment.join('; ')}</p></section>
  <section><h3>III. Tiến trình ({plan.duration})</h3>{plan.activities.map((a,i)=><div key={i} style={{padding:14,border:'1px solid #FED7AA',borderRadius:10,marginBottom:12}}>
   <h4>Hoạt động {i+1}. {headings[i]} — {a.name}</h4><p><b>Mục tiêu:</b> {a.objective}</p><p><b>Nội dung:</b> {a.content}</p><p><b>Sản phẩm:</b> {a.product}</p>
   <p><b>Giao nhiệm vụ:</b> {a.organization.assign}</p><p><b>Thực hiện:</b> {a.organization.perform}</p><p><b>Báo cáo/thảo luận:</b> {a.organization.report}</p><p><b>Kết luận/nhận định:</b> {a.organization.conclude}</p>
  </div>)}</section>
 </div>;
}
function WorksheetPreview({sheet,showAnswers}:{sheet:Worksheet;showAnswers:boolean}){
 return <div><h3>{sheet.title}</h3><p>{sheet.instructions}</p>{(sheet.vocabulary||[]).length>0&&<div><h4>Key vocabulary – Từ vựng trọng tâm</h4><table><thead><tr><th>English</th><th>Tiếng Việt</th><th>Definition in English</th></tr></thead><tbody>{sheet.vocabulary.map((v,i)=><tr key={i}><td>{v.termEn}</td><td>{v.termVi}</td><td>{v.definitionEn}</td></tr>)}</tbody></table></div>{sheet.tasks.map((t,i)=><section key={i} style={{marginBottom:19}}>
  <h4>Nhiệm vụ {i+1}. {t.instruction}</h4><p>{t.question}</p>{showAnswers&&<p style={{color:'#166534'}}><b>Gợi ý đáp án:</b> {t.expectedAnswer}</p>}
 </section>)}</div>;
}
function ReviewPreview({review,showAnswers}:{review:Review;showAnswers:boolean}){
 return <div>
  <h3>Phần I. 10 câu trắc nghiệm nhiều lựa chọn</h3>
  {review.multipleChoice.map((q,i)=><section key={i} style={{marginBottom:16}}>
   <b>Câu {i+1}. {q.question}</b><ol type="A">{q.choices.map((x,j)=><li key={j}>{x}</li>)}</ol>
   {showAnswers&&<p style={{color:'#166534'}}><b>Đáp án {String.fromCharCode(65+q.correctIndex)}:</b> {q.explanation}</p>}
  </section>)}
  <h3>Phần II. 2 câu đúng–sai (mỗi câu gồm 4 ý)</h3>
  {review.trueFalse.map((q,i)=><section key={i} style={{marginBottom:18}}><b>Câu {i+1}. {q.context}</b>
   {q.statements.map((st,j)=><p key={j}> {String.fromCharCode(97+j)}) {st.text} {showAnswers?<strong style={{color:'#166534'}}>— {st.isTrue?'Đúng':'Sai'}. {st.explanation}</strong>:''}</p>)}
  </section>)}
  <h3>Phần III. 3 câu trả lời ngắn</h3>
  {review.shortAnswer.map((q,i)=><section key={i} style={{marginBottom:16}}><b>Câu {i+1}. {q.question}</b>
   {showAnswers?<p style={{color:'#166534'}}><b>Đáp án:</b> {q.answer}. {q.explanation}</p>:<p>Trả lời: ...................................................</p>}
  </section>)}
 </div>;
}

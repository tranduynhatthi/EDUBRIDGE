'use client';
import {useCallback,useEffect,useState} from 'react';
import {CirclePause,CirclePlay,RefreshCcw,ShieldCheck,Layers3,Clock,AlertCircle} from 'lucide-react';
import {supabaseBrowser} from '@/lib/supabase';

type Batch={id:string;status:'paused'|'running'|'completed'|'completed_with_errors'|'cancelled';approved_at:string|null;created_at:string;finished_at:string|null};
type Job={id:string;textbook_lesson_id:string;sort_order:number;status:'queued'|'processing'|'review_required'|'published'|'failed'|'skipped';attempts:number;error_code:string|null;extracted_chars:number;partial_text:string};
type Props={bookId:string;onRefreshCatalog:()=>Promise<void>;onSelectLesson:(id:string,partial:string)=>void};
const statusVi:Record<Batch['status']|Job['status'],string>={
 paused:'Tạm dừng, chưa gọi AI',running:'Đang xử lý nền',completed:'Xử lý xong – chờ hậu kiểm',
 completed_with_errors:'Hoàn thành, có bài lỗi',cancelled:'Đã hủy',queued:'Chờ xử lý',processing:'Đang trích xuất',
 review_required:'Chờ hậu kiểm',published:'Đã duyệt',failed:'Lỗi',skipped:'Đã có nguồn / Bỏ qua'
};
export default function BatchImportPanel({bookId,onRefreshCatalog,onSelectLesson}:Props){
 const [batch,setBatch]=useState<Batch|null>(null),[jobs,setJobs]=useState<Job[]>([]),[loading,setLoading]=useState(false);
 const [message,setMessage]=useState(''),[error,setError]=useState('');
 const load=useCallback(async()=>{
  if(!bookId){setBatch(null);setJobs([]);return;}
  const api=supabaseBrowser();
  const result=await api.from('edubridge_import_batches').select('id,status,approved_at,created_at,finished_at').eq('textbook_id',bookId)
   .order('created_at',{ascending:false}).limit(1);
  if(result.error)throw result.error;
  const recent=(result.data||[])[0] as Batch|undefined;setBatch(recent||null);
  if(!recent){setJobs([]);return;}
  const child=await api.from('edubridge_import_jobs').select('id,textbook_lesson_id,sort_order,status,attempts,error_code,extracted_chars,partial_text').eq('batch_id',recent.id).order('sort_order');
  if(child.error)throw child.error;
  setJobs((child.data||[]) as Job[]);
 },[bookId]);
 useEffect(()=>{let active=true;void load().catch(e=>{if(active)setError(e instanceof Error?e.message:'Không tải được tiến độ.');});
  const tick=window.setInterval(()=>{if(active)void load().catch(()=>{});},10000);
  return()=>{active=false;window.clearInterval(tick);};
 },[load]);
 async function stage(){
  if(!bookId)return;setLoading(true);setMessage('');setError('');
  try{const result=await supabaseBrowser().rpc('edubridge_stage_batch',{p_book_id:bookId});
   if(result.error)throw result.error;
   await load();setMessage('Đã chuẩn bị danh sách bài ở trạng thái TẠM DỪNG. Chưa gọi Gemini và chưa phát sinh phí AI.');}
  catch(e){setError(e instanceof Error?e.message:'Không tạo được lô xử lý.');}finally{setLoading(false);}
 }
 async function control(action:'start'|'pause'|'retry'|'cancel'){
  if(!batch)return;
  const charge=(action==='start'||action==='retry');
  const wording=charge?
   'XÁC NHẬN PHÁT SINH CHI PHÍ: Khi bấm OK, hệ thống bắt đầu gọi Google Gemini để đọc các bài còn chờ. Mỗi bài có thể được thử lại tối đa 3 lượt, sử dụng quota/billing Gemini của bạn. Bạn có đồng ý không?':
   action==='cancel'?'Hủy lô xử lý? Các bản nháp đã trích xuất và bài đã duyệt sẽ không bị xóa.':'Tạm dừng lô xử lý? Lượt đang chạy có thể hoàn tất.';
  if(!window.confirm(wording))return;
  setLoading(true);setMessage('');setError('');
  try{const r=await supabaseBrowser().rpc('edubridge_control_batch',{p_batch_id:batch.id,p_action:action,p_approve_cost:charge});
   if(r.error)throw r.error;
   await load();setMessage(charge?'Đã ghi nhận sự đồng ý chi phí. Hệ thống sẽ xử lý nền theo từng bài.':'Đã cập nhật trạng thái.');
  }catch(e){setError(e instanceof Error?e.message:'Không điều khiển được lô xử lý.');}finally{setLoading(false);}
 }
 const counts=Object.fromEntries(['queued','processing','review_required','published','failed','skipped'].map(k=>[k,jobs.filter(j=>j.status===k).length]));
 const done=(counts.review_required||0)+(counts.published||0)+(counts.failed||0)+(counts.skipped||0);
 const percent=jobs.length?Math.round(100*done/jobs.length):0;
 return <section className="white-panel form-section" style={{marginTop:22}} id="bulk-import">
  <h2><span className="step-dot">2B</span> Nhập nhanh SGK hàng loạt – xử lý nền</h2>
  <p className="muted">Chuẩn bị tất cả các bài của sách đã chọn; hệ thống đọc PDF từng bài, thử lại tối đa 3 lần và lưu bản nháp để hậu kiểm. Giáo viên chỉ truy cập bài đã duyệt.</p>
  <div className="attention"><ShieldCheck size={18}/><div>
   <b>Chế độ an toàn chi phí:</b> Chuẩn bị danh sách KHÔNG gọi Gemini. Chỉ nút <b>Bắt đầu đọc hàng loạt (có phí)</b> sau xác nhận riêng mới mở quyền xử lý. Một bài tại một thời điểm.
   <p className="muted" style={{marginTop:7}}>Cần cấu hình <code>GEMINI_API_KEY</code> trong Supabase → Edge Functions → Secrets trước khi chạy. Gemini key trong Vercel không tự động được chuyển sang Supabase.</p>
  </div></div>
  {!batch?<button disabled={loading||!bookId} type="button" className="secondary-btn" onClick={stage}><Layers3 size={18}/> {loading?'Đang chuẩn bị...':'Chuẩn bị danh sách bài – chưa gọi AI'}</button>:
  <>
   <div className="stats" style={{margin:'18px 0'}}>
    <div className="stat"><Layers3 size={21}/><div><b>{jobs.length}</b><small>Tổng số bài</small></div></div>
    <div className="stat"><Clock size={21}/><div><b>{counts.review_required||0}</b><small>Chờ hậu kiểm</small></div></div>
    <div className="stat"><ShieldCheck size={21}/><div><b>{counts.published||0}</b><small>Đã duyệt</small></div></div>
    <div className="stat"><AlertCircle size={21}/><div><b>{counts.failed||0}</b><small>Bài lỗi</small></div></div>
   </div>
   <p role="status"><b>Trạng thái:</b> {statusVi[batch.status]} · {percent}% công việc có kết quả</p>
   <div style={{height:8,background:'#ffedd5',borderRadius:20,overflow:'hidden',margin:'12px 0'}}><div style={{width:percent+'%',height:'100%',background:'#ea580c'}}/></div>
   <div className="action-row" style={{marginBottom:16}}>
    {batch.status==='paused'&&<button type="button" className="primary-btn" disabled={loading} onClick={()=>control('start')}><CirclePlay size={18}/> Bắt đầu đọc hàng loạt (có phí)</button>}
    {batch.status==='running'&&<button type="button" className="secondary-btn" disabled={loading} onClick={()=>control('pause')}><CirclePause size={18}/> Tạm dừng</button>}
    {(batch.status==='completed_with_errors'||batch.status==='paused'||batch.status==='completed')&&counts.failed>0&&<button type="button" className="secondary-btn" disabled={loading} onClick={()=>control('retry')}><RefreshCcw size={18}/> Thử lại bài lỗi (có phí)</button>}
    {(batch.status==='paused'||batch.status==='running')&&<button type="button" className="secondary-btn" disabled={loading} onClick={()=>control('cancel')}>Hủy lô</button>}
    <button type="button" className="secondary-btn" disabled={loading} onClick={()=>{void load().then(onRefreshCatalog).catch(e=>setError(String(e)));}}><RefreshCcw size={18}/> Cập nhật tiến độ</button>
   </div>
   <div style={{maxHeight:360,overflowY:'auto',border:'1px solid #fed7aa',borderRadius:12}}>
    <table style={{width:'100%',fontSize:13,borderCollapse:'collapse'}}><thead><tr style={{background:'#fff7ed'}}>
     <th style={{padding:10,textAlign:'left'}}>Bài</th><th style={{padding:10,textAlign:'left'}}>Trạng thái</th><th style={{padding:10}}>Lượt thử</th><th style={{padding:10}}>Ký tự</th></tr></thead>
     <tbody>{jobs.map(job=><tr key={job.id} style={{borderTop:'1px solid #ffedd5'}}>
      <td style={{padding:9}}><button type="button" onClick={()=>{onSelectLesson(job.textbook_lesson_id,job.partial_text);window.setTimeout(()=>document.getElementById('review-lesson')?.scrollIntoView({behavior:'smooth'}),100);}}>{job.sort_order}. Xem/hậu kiểm</button></td>
      <td style={{padding:9}}>{statusVi[job.status]}{job.error_code&&<small style={{display:'block',color:'#b91c1c'}}>{job.error_code}</small>}</td>
      <td style={{padding:9,textAlign:'center'}}>{job.attempts}/3</td>
      <td style={{padding:9,textAlign:'center'}}>{job.extracted_chars}</td></tr>)}</tbody></table>
   </div>
  </>}
  {message&&<p className="success-note" role="status">{message}</p>}
  {error&&<p className="error" role="alert">{error}</p>}
 </section>;
}

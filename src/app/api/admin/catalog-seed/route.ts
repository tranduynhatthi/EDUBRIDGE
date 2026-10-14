import {z} from 'zod';
import {createHash} from 'node:crypto';
import {requireAdmin,authFailure} from '@/lib/server-auth';
import catalog from '@/data/physics12-ktst.json';
export const runtime='nodejs';
const Input=z.object({bookId:z.string().uuid()});
export async function POST(request:Request){
 let auth:Awaited<ReturnType<typeof requireAdmin>>;
 try{auth=await requireAdmin(request);}catch(error){return authFailure(error);}
 const parsed=Input.safeParse(await request.json().catch(()=>null));
 if(!parsed.success)return Response.json({error:'Thiếu mã bộ sách hợp lệ.'},{status:400});
 const {data:book,error}=await auth.supabase.from('textbooks')
  .select('id,subject,grade,title,book_series,page_count').eq('id',parsed.data.bookId).single();
 if(error||!book)return Response.json({error:'Không tìm thấy bộ sách.'},{status:404});
 // Do not apply page mappings to different editions/files.
 const titleOk=book.title.toLowerCase().normalize('NFC').includes('vật lí 12');
 const seriesOk=book.book_series.toLowerCase().normalize('NFC').includes('kết nối tri thức');
 if(book.subject!=='Vật lí'||book.grade!=='12'||book.page_count!==catalog.pdfPageCount||!titleOk||!seriesOk){
  return Response.json({error:'Danh mục này chỉ dành cho đúng bản Vật lí 12 – Kết nối tri thức (PDF 126 trang) đã đối chiếu.'},{status:422});
 }
 // Fingerprint the user-provided PDF; 126 pages alone is not enough to identify an edition.
 const {data:meta}=await auth.supabase.from('textbooks').select('storage_path').eq('id',book.id).single();
 if(!meta)return Response.json({error:'Không tìm thấy vị trí PDF gốc.'},{status:404});
 const {data:pdf,error:pdfError}=await auth.supabase.storage.from('edubridge-textbooks').download(meta.storage_path);
 if(pdfError||!pdf)return Response.json({error:'Không đọc được tệp SGK để xác nhận bản sách.'},{status:404});
 const hash=createHash('sha256').update(Buffer.from(await pdf.arrayBuffer())).digest('hex');
 if(hash!==catalog.sha256)return Response.json({error:'File PDF không trùng chính xác bản SGK đã đối chiếu. Hãy dùng đúng tệp SGK Vật lí 12 đã gửi hoặc tạo mục lục thủ công.'},{status:422});
 const existing=await auth.supabase.from('textbook_lessons').select('sort_order').eq('textbook_id',book.id);
 if(existing.error)return Response.json({error:'Không đọc được danh mục hiện có.'},{status:500});
 const used=new Set((existing.data||[]).map(x=>x.sort_order));
 const insert=catalog.lessons.filter(l=>!used.has(l.sortOrder)).map(l=>({
  textbook_id:book.id,sort_order:l.sortOrder,chapter:l.chapter,title:l.title,
  start_page:l.startPage,end_page:l.endPage,source_text:'',
  extraction_note:'Mới có tên và trang SGK; chưa xử lí nội dung. Sách PDF ảnh quét; cần AI đọc từng bài và giáo viên hậu kiểm.',
  is_published:false,created_by:auth.user.id
 }));
 if(!insert.length)return Response.json({added:0,total:catalog.lessons.length,message:'Đã có toàn bộ danh mục, không tạo trùng.'});
 const {error:saveError}=await auth.supabase.from('textbook_lessons').insert(insert);
 if(saveError)return Response.json({error:`Chưa tạo được danh mục (${saveError.code}). Đảm bảo đã chạy SQL 03.`},{status:500});
 return Response.json({added:insert.length,total:catalog.lessons.length,message:'Đã tạo mục lục. Tất cả ở trạng thái nháp, chưa hiện với giáo viên.'},{status:201});
}

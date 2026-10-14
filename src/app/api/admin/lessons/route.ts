import {z} from 'zod';
import {getDocumentProxy} from 'unpdf';
import {requireAdmin,authFailure} from '@/lib/server-auth';
export const runtime='nodejs';
export const maxDuration=60;
const NewCatalogLesson=z.object({
 bookId:z.string().uuid(),
 sortOrder:z.number().int().min(1).max(500),
 chapter:z.string().trim().max(120),
 title:z.string().trim().min(5).max(120),
 startPage:z.number().int().min(1),
 endPage:z.number().int().min(1),
 manualText:z.string().max(30000).default(''),
 extractionNote:z.string().max(1200).default(''),
});
export async function POST(request:Request){
 let auth:Awaited<ReturnType<typeof requireAdmin>>;
 try{auth=await requireAdmin(request);}catch(e){return authFailure(e);}
 let body:unknown;
 try{body=await request.json();}catch{return Response.json({error:'Dữ liệu không hợp lệ.'},{status:400});}
 const parsed=NewCatalogLesson.safeParse(body);
 if(!parsed.success)return Response.json({error:parsed.error.issues[0]?.message},{status:400});
 const v=parsed.data;
 const {data:book,error:bookError}=await auth.supabase.from('textbooks').select('id,page_count,storage_path').eq('id',v.bookId).single();
 if(bookError||!book)return Response.json({error:'Không tìm thấy SGK.'},{status:404});
 if(v.endPage<v.startPage||v.endPage>book.page_count||v.endPage-v.startPage+1>25)
  return Response.json({error:'Phạm vi trang không hợp lệ: tối đa 25 trang cho mỗi bài và không vượt số trang sách.'},{status:400});
 let sourceText=v.manualText.trim();
 if(!sourceText){
  const {data:file,error:fileError}=await auth.supabase.storage.from('edubridge-textbooks').download(book.storage_path);
  if(fileError||!file)return Response.json({error:'Không thể đọc PDF trong kho sách riêng tư.'},{status:400});
  try{
   const pdf=await getDocumentProxy(new Uint8Array(await file.arrayBuffer()));
   const pages:string[]=[];
   for(let i=v.startPage;i<=v.endPage;i++){
    const page=await pdf.getPage(i);
    const content=await page.getTextContent();
    let text='';
    for(const item of content.items){if('str' in item)text+=String(item.str)+(('hasEOL' in item && item.hasEOL)?'\n':' ');}
    pages.push(`[TRANG PDF ${i}]\n${text.trim()}`);
   }
   sourceText=pages.join('\n\n').replace(/\s{3,}/g,'\n\n').trim();
  }catch(e){console.error('PDF page extract:',e instanceof Error?e.message:'unknown');return Response.json({error:'Không thể trích trang PDF. Có thể sách là ảnh quét.'},{status:422});}
 }
 if(sourceText.length<250)return Response.json({error:'Trích xuất chưa đủ 250 kí tự. Với PDF ảnh quét, hãy nhập văn bản đã được kiểm tra trong ô nội dung thay thế.'},{status:422});
 if(sourceText.length>30000)return Response.json({error:'Bài có trên 30.000 kí tự. Hãy thu hẹp số trang hoặc chia thành các phần.'},{status:413});
 const {data:saved,error:saveError}=await auth.supabase.from('textbook_lessons').insert({
  textbook_id:book.id,sort_order:v.sortOrder,chapter:v.chapter,title:v.title,
  start_page:v.startPage,end_page:v.endPage,source_text:sourceText,
  extraction_note:v.extractionNote,created_by:auth.user.id,is_published:false
 }).select('id,source_text').single();
 if(saveError||!saved)return Response.json({error:saveError?.code==='23505'?'Thứ tự bài đã tồn tại trong sách. Chọn số khác.':'Không thể lưu bài vào kho SGK.'},{status:409});
 return Response.json({id:saved.id,sourceText:saved.source_text,notice:'Đã nhập bản nháp. Quản trị viên cần kiểm tra công thức và duyệt trước khi giáo viên sử dụng.'},{status:201});
}

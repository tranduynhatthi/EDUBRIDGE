/**
 * Fast, cost-free extraction from the existing PRIVATE textbook PDF.
 * No API key, no OCR, no AI inference and no database writes.
 * An administrator must review the result and choose to save/publish.
 */
import {z} from 'zod';
import {getDocumentProxy} from 'unpdf';
import {requireAdmin,authFailure} from '@/lib/server-auth';

export const runtime='nodejs';
export const maxDuration=60;
const MAX_SOURCE_LENGTH=30000;

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 let auth:Awaited<ReturnType<typeof requireAdmin>>;
 try{auth=await requireAdmin(request);}catch(error){return authFailure(error);}
 const {id}=await params;
 if(!z.string().uuid().safeParse(id).success)return Response.json({error:'Mã bài không hợp lệ.'},{status:400});
 const {data:lesson,error}=await auth.supabase.from('textbook_lessons')
  .select('id,title,start_page,end_page,is_published,textbooks!inner(storage_path,page_count)')
  .eq('id',id).single();
 if(error||!lesson)return Response.json({error:'Không tìm thấy bài học.'},{status:404});
 if(lesson.is_published)return Response.json({error:'Bài đã duyệt: không tự động thay đổi nội dung nguồn.'},{status:409});
 const book=lesson.textbooks as unknown as {storage_path:string;page_count:number};
 const count=lesson.end_page-lesson.start_page+1;
 if(count<1||count>25||lesson.start_page<1||lesson.end_page>book.page_count)
  return Response.json({error:'Phạm vi trang PDF không hợp lệ. Một bài tối đa 25 trang.'},{status:422});
 const {data:file,error:downloadError}=await auth.supabase.storage.from('edubridge-textbooks').download(book.storage_path);
 if(downloadError||!file)return Response.json({error:'Không tải được PDF gốc từ kho SGK riêng tư.'},{status:404});
 if(file.size>30*1024*1024)return Response.json({error:'PDF lớn hơn giới hạn 30 MB.'},{status:413});
 try{
  const pdf=await getDocumentProxy(new Uint8Array(await file.arrayBuffer()));
  if(pdf.numPages!==book.page_count)return Response.json({error:'Tệp PDF đã thay đổi số trang so với dữ liệu lưu.'},{status:409});
  const pages:string[]=[];
  let contentPages=0;
  for(let pageNum=lesson.start_page;pageNum<=lesson.end_page;pageNum++){
   const page=await pdf.getPage(pageNum);
   const content=await page.getTextContent();
   const parts:string[]=[];
   for(const item of content.items)if('str' in item){
    const term=String(item.str??'');
    if(term.trim())parts.push(term+(('hasEOL' in item&&item.hasEOL)?'\n':' '));
   }
   const text=parts.join('').replace(/[ \t]+\n/g,'\n').trim();
   if(text)contentPages++;
   pages.push('[Trang PDF '+pageNum+']\n'+(text||'[KHÔNG CÓ LỚP VĂN BẢN]'));
  }
  const text=pages.join('\n\n').trim();
  const noText=contentPages===0 || text.replace(/\[Trang PDF \d+\]|\[KHÔNG CÓ LỚP VĂN BẢN\]|\s/g,'').length<250;
  if(noText)return Response.json({
    code:'PDF_NO_TEXT_LAYER',
    error:'PDF này chủ yếu là ảnh quét hoặc không đủ văn bản. Nhấn “AI đọc PDF ảnh quét” để nhận dạng từng trang, sau đó kiểm tra nội dung trước khi lưu.',
    pagesWithText:contentPages,totalPages:count
  },{status:422});
  if(text.length>MAX_SOURCE_LENGTH)return Response.json({
    code:'PDF_TEXT_TOO_LONG',
    error:'Văn bản của bài dài hơn 30.000 ký tự. Hãy thu hẹp phạm vi trang hoặc tách bài để AI xử lý trọn vẹn.',
    extractedLength:text.length
  },{status:413});
  return Response.json({
   sourceText:text,
   extractedLength:text.length,
   method:'pdf-text-layer',
   previewOnly:true,
   extractionNote:'BẢN NHÁP trích trực tiếp lớp văn bản PDF. Cần đối chiếu hình, bảng, công thức và trật tự nội dung trước khi duyệt.',
   warning:'Không phát sinh lượt gọi Gemini. Kết quả mới chỉ hiển thị ở ô biên tập; dữ liệu đã lưu chưa thay đổi.'
  });
 }catch(e){
  console.error('textbook pdf text layer extraction',{errorType:e instanceof Error?e.name:'unknown'});
  return Response.json({error:'Không đọc được lớp văn bản của PDF. Nếu sách là ảnh quét, hãy dùng AI đọc PDF ảnh quét.',code:'PDF_TEXT_EXTRACT_FAILED'},{status:422});
 }
}

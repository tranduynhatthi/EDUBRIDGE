import {z} from 'zod';
import {requireAdmin,authFailure} from '@/lib/server-auth';
import {getDocumentProxy} from 'unpdf';
import {isValidSubject} from '@/lib/subjects';
export const runtime='nodejs';
export const maxDuration=60;

const NewBook=z.object({
 title:z.string().trim().min(3).max(180),
 subject:z.string().refine(isValidSubject,'Môn học không hợp lệ'),
 grade:z.enum(['10','11','12']),
 bookSeries:z.string().trim().min(2).max(120),
 publisher:z.string().trim().max(120),
 storagePath:z.string().uuid().transform(x=>`${x}.pdf`),
 originalFilename:z.string().trim().min(5).max(220)
});
export async function POST(request:Request){
 let auth:Awaited<ReturnType<typeof requireAdmin>>;
 try{auth=await requireAdmin(request);}catch(e){return authFailure(e);}
 let body:unknown;
 try{body=await request.json();}catch{return Response.json({error:'Dữ liệu không hợp lệ.'},{status:400});}
 const parsed=NewBook.safeParse(body);
 if(!parsed.success)return Response.json({error:parsed.error.issues[0]?.message},{status:400});
 const v=parsed.data;
 const {data:download,error:downloadError}=await auth.supabase.storage.from('edubridge-textbooks').download(v.storagePath);
 if(downloadError||!download)return Response.json({error:'Không đọc được tệp SGK vừa tải lên trong kho riêng tư.'},{status:400});
 if(download.size>30*1024*1024)return Response.json({error:'Tệp lớn hơn giới hạn 30 MB.'},{status:413});
 try{
  const bytes=new Uint8Array(await download.arrayBuffer());
  if(Buffer.from(bytes.subarray(0,4)).toString()!=='%PDF')return Response.json({error:'Tệp không phải PDF hợp lệ.'},{status:422});
  const pdf=await getDocumentProxy(bytes);
  const pageCount=pdf.numPages;
  if(pageCount>1000)return Response.json({error:'Số trang vượt giới hạn bản MVP.'},{status:413});
  const {data,error}=await auth.supabase.from('textbooks').insert({
   title:v.title,subject:v.subject,grade:v.grade,book_series:v.bookSeries,
   publisher:v.publisher,storage_path:v.storagePath,original_filename:v.originalFilename,
   page_count:pageCount,created_by:auth.user.id
  }).select('id,page_count').single();
  if(error||!data)return Response.json({error:'Không lưu được thông tin SGK. Kiểm tra bảng textbooks và vai trò admin.'},{status:500});
  return Response.json({id:data.id,pageCount:data.page_count},{status:201});
 }catch(e){console.error('book ingestion:',e instanceof Error?e.message:'unknown');return Response.json({error:'PDF không đọc được. Kiểm tra tệp hoặc chuyển PDF sang bản có chữ.'},{status:422});}
}

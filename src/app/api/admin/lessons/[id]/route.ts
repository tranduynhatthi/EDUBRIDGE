import {z} from 'zod';
import {requireAdmin,authFailure} from '@/lib/server-auth';
export const runtime='nodejs';
const UpdateCatalogLesson=z.object({
 sourceText:z.string().trim().min(250).max(30000),
 extractionNote:z.string().max(1200),
 isPublished:z.boolean(),
 confirmedReview:z.boolean()
});
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
 let auth:Awaited<ReturnType<typeof requireAdmin>>;
 try{auth=await requireAdmin(request);}catch(e){return authFailure(e);}
 const {id}=await params;
 if(!z.string().uuid().safeParse(id).success)return Response.json({error:'ID bài không hợp lệ.'},{status:400});
 let body:unknown;
 try{body=await request.json();}catch{return Response.json({error:'Dữ liệu không hợp lệ.'},{status:400});}
 const parsed=UpdateCatalogLesson.safeParse(body);
 if(!parsed.success)return Response.json({error:parsed.error.issues[0]?.message},{status:400});
 const v=parsed.data;
 if(v.isPublished&&!v.confirmedReview)return Response.json({error:'Phải xác nhận đã hậu kiểm kiến thức, công thức và trang nguồn trước khi công bố.'},{status:400});
 if(v.isPublished&&v.sourceText.length>25000)return Response.json({error:'Bài có trên 25.000 ký tự, vượt khả năng tạo bài hiện tại. Hãy rút gọn nguồn hoặc chia nhỏ trước khi duyệt.'},{status:422});
 const {data,error}=await auth.supabase.from('textbook_lessons').update({
  source_text:v.sourceText,extraction_note:v.extractionNote,is_published:v.isPublished,
  reviewed_by:v.isPublished?auth.user.id:null,reviewed_at:v.isPublished?new Date().toISOString():null,
 }).eq('id',id).select('id,is_published').single();
 if(error||!data)return Response.json({error:'Không lưu được nội dung bài hoặc không có quyền.'},{status:500});
 return Response.json({id:data.id,published:data.is_published});
}

import {z} from 'zod';
import {requireTeacher,authFailure} from '@/lib/server-auth';
import {LessonResultSchema} from '@/lib/schema';
import {Plan5512Schema,ReviewSchema,WorksheetSchema} from '@/lib/teaching-materials';
import {generateMaterialParagraphs,materialDocx} from '@/lib/export-word';
export const runtime='nodejs';
const Request=z.object({id:z.string().uuid(),kind:z.enum(['plan','worksheet','review']),version:z.enum(['student','answers']).default('student')});
export async function POST(request:Request){
 let auth:Awaited<ReturnType<typeof requireTeacher>>;
 try{auth=await requireTeacher(request);}catch(e){return authFailure(e);}
 let raw:unknown;try{raw=await request.json();}catch{return Response.json({error:'Dữ liệu không hợp lệ.'},{status:400});}
 const input=Request.safeParse(raw);if(!input.success)return Response.json({error:'Thiếu mã bài học hoặc loại tài liệu.'},{status:400});
 const {data,error}=await auth.supabase.from('lessons').select('id,teacher_id,title,subject,grade,generated_content').eq('id',input.data.id).eq('teacher_id',auth.user.id).single();
 if(error||!data)return Response.json({error:'Không tìm thấy bài học thuộc tài khoản.'},{status:404});
 const lesson=LessonResultSchema.safeParse(data.generated_content);if(!lesson.success)return Response.json({error:'Bài giảng chưa hợp lệ.'},{status:422});
 const obj=lesson.data;
 const material=input.data.kind==='plan'?Plan5512Schema.safeParse(obj.plan5512):
 input.data.kind==='worksheet'?WorksheetSchema.safeParse(obj.worksheet):ReviewSchema.safeParse(obj.reviewAssessment);
 if(!material.success)return Response.json({error:'Chưa có tài liệu AI hoàn chỉnh. Hãy tạo và hậu kiểm trước khi xuất.'},{status:422});
 const word=generateMaterialParagraphs(input.data.kind,material.data,{title:data.title,subject:data.subject,grade:data.grade},input.data.version);
 try{
  const binary=await materialDocx(word);
  const filename='EDUBRIDGE_'+input.data.kind+'_'+input.data.version+'.docx';
  return new Response(new Uint8Array(binary),{status:200,headers:{
   'Content-Type':'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
   'Content-Disposition':'attachment; filename="'+filename+'"',
   'Cache-Control':'private, no-store'
  }});
 }catch{return Response.json({error:'Không thể xuất Word. Vui lòng thử lại.'},{status:500});}
}

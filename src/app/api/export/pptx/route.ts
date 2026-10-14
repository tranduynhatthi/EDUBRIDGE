import {z} from 'zod';
import {LessonResultSchema} from '@/lib/schema';
import {requireTeacher,authFailure} from '@/lib/server-auth';
import {buildBeautifulDeck} from '@/lib/slide-deck';
export const runtime='nodejs';
export const maxDuration=60;
const RequestSchema=z.object({id:z.string().uuid()});
function safeFileName(title:string){return title.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9_-]+/g,'_').slice(0,60)||'lesson';}
export async function POST(request:Request){
 let auth:Awaited<ReturnType<typeof requireTeacher>>;
 try{auth=await requireTeacher(request);}catch(e){return authFailure(e);}
 let input:unknown;try{input=await request.json();}catch{return Response.json({error:'Yêu cầu không hợp lệ.'},{status:400});}
 const parsed=RequestSchema.safeParse(input);
 if(!parsed.success)return Response.json({error:'Mã bài học không hợp lệ.'},{status:400});
 const {data:row,error}=await auth.supabase.from('lessons').select('title,subject,grade,language_level,generated_content').eq('id',parsed.data.id).single();
 if(error||!row)return Response.json({error:'Không tìm thấy bài học hoặc không có quyền truy cập.'},{status:404});
 const validated=LessonResultSchema.safeParse(row.generated_content);
 if(!validated.success)return Response.json({error:'Dữ liệu bài học chưa hợp lệ.'},{status:422});
 try{
  const bytes=await buildBeautifulDeck(validated.data,{title:row.title,subject:row.subject,grade:row.grade,level:row.language_level});
  return new Response(new Uint8Array(bytes),{status:200,headers:{
   'Content-Type':'application/vnd.openxmlformats-officedocument.presentationml.presentation',
   'Content-Disposition':'attachment; filename="EDUBRIDGE_'+safeFileName(row.title)+'.pptx"',
   'Cache-Control':'private, no-store'
  }});
 }catch(e){
  console.error('EDUBRIDGE PPT render',{kind:e instanceof Error?e.name:'unknown'});
  return Response.json({error:'Không thể dựng PowerPoint. Hãy thử lại sau hoặc liên hệ quản trị viên.',code:'PPTX_RENDER_FAILED'},{status:500});
 }
}

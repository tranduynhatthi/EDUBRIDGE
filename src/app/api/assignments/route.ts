import {requireTeacher,authFailure} from '@/lib/server-auth';
import {randomBytes} from 'node:crypto';
export const runtime='nodejs';
export async function POST(req:Request){
 let auth:Awaited<ReturnType<typeof requireTeacher>>;
 try {auth=await requireTeacher(req);}catch(e){return authFailure(e);}
 const body=await req.json().catch(()=>null);
 if(!body||typeof body.lessonId!=='string'||!/^[a-f0-9-]{36}$/i.test(body.lessonId))return Response.json({error:'Thiếu mã bài học.'},{status:400});
 const {data:lesson,error}=await auth.supabase.from('lessons').select('id,title,generated_content,status').eq('id',body.lessonId).eq('teacher_id',auth.user.id).single();
 if(error||!lesson)return Response.json({error:'Không tìm thấy bài học.'},{status:404});
 if(lesson.status!=='reviewed')return Response.json({error:'Cần lưu và rà soát bài học trước khi giao.'},{status:400});
 const content=lesson.generated_content;
 if(!content?.quiz?.length)return Response.json({error:'Bài học chưa có câu hỏi.'},{status:400});
 for(let k=0;k<3;k++){
  const code=randomBytes(5).toString('hex').toUpperCase().slice(0,8);
  const {data,error:dbError}=await auth.supabase.from('lesson_assignments').insert({teacher_id:auth.user.id,lesson_id:lesson.id,title:lesson.title,access_code:code,lesson_snapshot:content}).select('id,access_code').single();
  if(data)return Response.json(data,{status:201});
  if(dbError?.code!=='23505')break;
 }
 return Response.json({error:'Không thể tạo mã lớp. Kiểm tra migration 04.'},{status:500});
}

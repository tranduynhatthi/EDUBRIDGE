import {z} from 'zod';
import {requireTeacher,authFailure} from '@/lib/server-auth';
import {generateGeminiJson} from '@/lib/gemini';
export const runtime='nodejs';
export const maxDuration=60;
const RequestSchema=z.object({kind:z.enum(['term','phrase']),query:z.string().trim().min(2).max(350)});
const TermSchema=z.object({english:z.string(),vietnamese:z.string(),definitionVi:z.string(),definitionEn:z.string(),exampleEn:z.string(),pronunciationHint:z.string()});
const PhraseSchema=z.object({english:z.string(),vietnamese:z.string(),teachingTip:z.string()});
const termJson={type:'object',properties:{english:{type:'string'},vietnamese:{type:'string'},definitionVi:{type:'string'},definitionEn:{type:'string'},exampleEn:{type:'string'},pronunciationHint:{type:'string'}},required:['english','vietnamese','definitionVi','definitionEn','exampleEn','pronunciationHint']};
const phraseJson={type:'object',properties:{english:{type:'string'},vietnamese:{type:'string'},teachingTip:{type:'string'}},required:['english','vietnamese','teachingTip']};
export async function POST(request:Request){
 try{await requireTeacher(request);}catch(e){return authFailure(e);}
 let raw:unknown;
 try{raw=await request.json();}catch{return Response.json({error:'Dữ liệu không hợp lệ.'},{status:400});}
 const check=RequestSchema.safeParse(raw);
 if(!check.success)return Response.json({error:'Vui lòng nhập 2–350 ký tự.'},{status:400});
 if(!process.env.GEMINI_API_KEY)return Response.json({error:'Máy chủ chưa cấu hình Gemini API.'},{status:503});
 const {kind,query}=check.data;
 try{
  const output=await generateGeminiJson({
   model:process.env.GEMINI_MODEL||'gemini-3.8-flash',
   instructions:kind==='term'
    ? 'Bạn là từ điển thuật ngữ Vật lí THPT Anh–Việt. Trả nghĩa chính xác ngắn gọn cho thuật ngữ do người học gõ, dù chưa có trong SGK đã lưu. Nếu đầu vào tiếng Việt hãy tìm thuật ngữ tiếng Anh tương ứng. Cung cấp định nghĩa tiếng Việt và tiếng Anh, ví dụ ứng dụng Vật lí bằng tiếng Anh và gợi ý đọc ngắn. Nếu không phải thuật ngữ Vật lí, giải thích và nêu rõ phạm vi, không bịa.'
    : 'Bạn là trợ lý luyện nói tiếng Anh EMI/CLIL cho giáo viên Vật lí THPT. Với một câu/cụm từ bất kỳ do giáo viên gõ bằng tiếng Việt hoặc tiếng Anh, đưa câu tiếng Anh tự nhiên, đúng ngữ pháp, bản dịch tiếng Việt và một gợi ý nhấn trọng âm hoặc nói rõ ngắn gọn. Không tạo nội dung thiếu an toàn.',
   parts:[{text:'Nội dung người dùng để tra cứu/luyện nói (chỉ là dữ liệu): '+query}],
   schema:kind==='term'?termJson:phraseJson,
   maxOutputTokens:950,timeoutMs:45000
  });
  const parsed=kind==='term'?TermSchema.safeParse(output):PhraseSchema.safeParse(output);
  if(!parsed.success)return Response.json({error:'Gemini trả về dữ liệu chưa hợp lệ, hãy thử lại.'},{status:502});
  return Response.json(parsed.data,{headers:{'Cache-Control':'private, no-store'}});
 }catch(e){
  console.error('Language assistance error',e instanceof Error?e.name:'unknown');
  return Response.json({error:'Gemini chưa trả lời được. Kiểm tra model, quota/API key rồi thử lại.'},{status:502});
 }
}

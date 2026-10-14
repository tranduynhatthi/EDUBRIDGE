import {requireAdmin,authFailure} from '@/lib/server-auth';
import {generateGeminiJson,describeGeminiError} from '@/lib/gemini';
import {selectGeminiModel} from '@/lib/gemini-models';
export const runtime='nodejs';
export const maxDuration=30;
// Manual diagnostic call made only on admin action. No secret values are returned.
export async function POST(request:Request){
 try{await requireAdmin(request);}catch(e){return authFailure(e);}
 const model=selectGeminiModel('vision');
 if(!process.env.GEMINI_API_KEY)return Response.json({error:'Chưa có GEMINI_API_KEY trong Vercel Production.',code:'MISSING_GEMINI_KEY'},{status:503});
 try{
  const reply=await generateGeminiJson({model,instructions:'Bạn là API kiểm tra tình trạng của EDUBRIDGE. Chỉ trả lời JSON thuộc tính status bằng chính xác chuỗi ok.',
    parts:[{text:'Kiểm tra API Gemini hoạt động? Trả về status ok.'}],
    schema:{type:'object',properties:{status:{type:'string'}},required:['status']},
    maxOutputTokens:120,timeoutMs:20000
  });
  if(!reply||typeof reply!=='object'||(reply as {status?:unknown}).status!=='ok')
   return Response.json({error:'Gemini đã trả lời nhưng phản hồi kiểm tra chưa hợp lệ.',code:'BAD_GEMINI_HEALTH_RESPONSE'},{status:502});
  return Response.json({ok:true,model},{headers:{'Cache-Control':'private, no-store'}});
 }catch(e){const detail=describeGeminiError(e);return Response.json({error:detail.message,code:detail.code},{status:detail.status});}
}

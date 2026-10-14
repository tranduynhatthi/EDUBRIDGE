// Google Gemini API integration for EDUBRIDGE. Server-side only; never expose the key to clients.
export type GeminiPart = { text:string } | { inlineData:{mimeType:string;data:string} };
export const lessonJsonSchema = {
  "type": "object",
  "properties": {
    "lessonTitleEn": {
      "type": "string"
    },
    "contentObjectives": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "languageObjectives": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "keyConcepts": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "vi": {
            "type": "string"
          },
          "en": {
            "type": "string"
          }
        },
        "required": [
          "vi",
          "en"
        ]
      }
    },
    "vocabulary": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "termEn": {
            "type": "string"
          },
          "termVi": {
            "type": "string"
          },
          "definitionEn": {
            "type": "string"
          },
          "exampleEn": {
            "type": "string"
          }
        },
        "required": [
          "termEn",
          "termVi",
          "definitionEn",
          "exampleEn"
        ]
      }
    },
    "classroomPhrases": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "english": {
            "type": "string"
          },
          "vietnamese": {
            "type": "string"
          }
        },
        "required": [
          "english",
          "vietnamese"
        ]
      }
    },
    "slides": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "title": {
            "type": "string"
          },
          "bullets": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "teacherScript": {
            "type": "string"
          },
          "slideType": {
            "type": "string",
            "enum": ["warmup","concept","process","comparison","diagram","formula","example","activity","summary"]
          },
          "keyMessage": {"type":"string"},
          "studentTask": {"type":"string"},
          "visualSuggestion": {"type":"string"},
          "formula": {"type":"string"}
        },
        "required": [
          "title",
          "bullets",
          "teacherScript",
          "slideType",
          "keyMessage",
          "studentTask",
          "visualSuggestion",
          "formula"
        ]
      }
    },
    "quiz": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "questionEn": {
            "type": "string"
          },
          "choices": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "correctIndex": {
            "type": "integer"
          },
          "explanationVi": {
            "type": "string"
          }
        },
        "required": [
          "questionEn",
          "choices",
          "correctIndex",
          "explanationVi"
        ]
      }
    },
    "qualityWarnings": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  },
  "required": [
    "lessonTitleEn",
    "contentObjectives",
    "languageObjectives",
    "keyConcepts",
    "vocabulary",
    "classroomPhrases",
    "slides",
    "quiz",
    "qualityWarnings"
  ]
} as const;
export const notesJsonSchema = {
  "type": "object",
  "properties": {
    "sourceText": {
      "type": "string"
    },
    "warnings": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  },
  "required": [
    "sourceText",
    "warnings"
  ]
} as const;
type GeminiPayload = {candidates?:Array<{content?:{parts?:Array<{text?:string}>};finishReason?:string}>;promptFeedback?:{blockReason?:string}};
export class GeminiRequestError extends Error { readonly code:string; constructor(code:string){super(code);this.code=code;this.name='GeminiRequestError';} }
export function describeGeminiError(err:unknown):{code:string;message:string;status:number}{
 const code=err instanceof GeminiRequestError?err.code:
   err instanceof Error&&(err.name==='TimeoutError'||err.name==='AbortError')?'GEMINI_TIMEOUT':
   'GEMINI_UNKNOWN_ERROR';
 const messages:Record<string,string>={
  MISSING_GEMINI_KEY:'Chưa thiết lập GEMINI_API_KEY trong Vercel (Production).',
  INVALID_MODEL:'Tên model Gemini cấu hình không hợp lệ.',
  GEMINI_QUOTA_LIMIT:'Gemini đã hết hạn mức API hoặc vượt giới hạn số lần gọi. Kiểm tra Usage/Billing ở Google AI Studio.',
  GEMINI_KEY_OR_PERMISSION:'Khóa Gemini API không hợp lệ hoặc dự án Google không được cấp quyền gọi model.',
  GEMINI_MODEL_NOT_FOUND:'Không tìm thấy model Gemini. Kiểm tra GEMINI_MODEL hoặc GEMINI_VISION_MODEL trên Vercel.',
  GEMINI_BAD_REQUEST:'Gemini từ chối yêu cầu (HTTP 400). Kiểm tra model, định dạng JSON và giới hạn dữ liệu.',
  GEMINI_SERVER_BUSY:'Máy chủ Gemini tạm thời quá tải. Hãy thử lại sau ít phút.',
  GEMINI_BLOCKED:'Gemini đã chặn phản hồi do bộ lọc nội dung.',
  GEMINI_INVALID_JSON:'Gemini trả về JSON chưa hoàn chỉnh. Hãy giảm độ dài bài dạy hoặc thử lại.',
  GEMINI_OUTPUT_TRUNCATED:'Gemini đã dừng khi đạt giới hạn token trước khi hoàn thành bài. Hãy thử lại với nội dung nguồn ngắn hơn.',
  GEMINI_INVALID_API_RESPONSE:'Gemini trả về phản hồi API không hợp lệ. Hãy thử lại.',
  GEMINI_TIMEOUT:'Gemini xử lý quá thời gian. Hãy thử lại hoặc giảm lượng nội dung nguồn.',
  GEMINI_UNKNOWN_ERROR:'Không thể gọi Gemini. Kiểm tra mạng, API key, quyền model và hạn mức.'
 };
 const message=messages[code]??(code.startsWith('GEMINI_EMPTY_')?
  'Gemini không trả nội dung (lý do: '+code.replace('GEMINI_EMPTY_','')+'). Thử tệp ngắn hơn hoặc kiểm tra hạn mức token.':
  code.startsWith('GEMINI_HTTP_')?'Gemini trả về '+code.replace('GEMINI_HTTP_','HTTP ')+'; hãy kiểm tra cấu hình và thử lại.':messages.GEMINI_UNKNOWN_ERROR);
 return {code,message:message!,status:code==='GEMINI_QUOTA_LIMIT'?429:code==='GEMINI_TIMEOUT'?504:502};
}
export async function generateGeminiJson(options:{model:string;instructions:string;parts:GeminiPart[];schema:object;maxOutputTokens?:number;timeoutMs?:number}):Promise<unknown>{
 const apiKey=process.env.GEMINI_API_KEY;
 if(!apiKey)throw new GeminiRequestError('MISSING_GEMINI_KEY');
 const model=options.model.replace(/^models\//,'');
 if(!/^[a-zA-Z0-9_.-]+$/.test(model))throw new GeminiRequestError('INVALID_MODEL');
 const response=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':generateContent',{
  method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':apiKey},
  body:JSON.stringify({systemInstruction:{parts:[{text:options.instructions}]},contents:[{role:'user',parts:options.parts}],
   generationConfig:{responseMimeType:'application/json',responseSchema:options.schema,maxOutputTokens:options.maxOutputTokens??8192, ...(model.startsWith('gemini-3.')||model.startsWith('gemini-4-')?{thinkingConfig:{thinkingLevel:'low'}}:{})}}),
  signal:AbortSignal.timeout(options.timeoutMs??100000)
 });
 if(!response.ok){if(response.status===400)throw new GeminiRequestError('GEMINI_BAD_REQUEST');
  if(response.status===500||response.status===503||response.status===529)throw new GeminiRequestError('GEMINI_SERVER_BUSY');
  if(response.status===429)throw new GeminiRequestError('GEMINI_QUOTA_LIMIT');
  if(response.status===401||response.status===403)throw new GeminiRequestError('GEMINI_KEY_OR_PERMISSION');
  if(response.status===404)throw new GeminiRequestError('GEMINI_MODEL_NOT_FOUND');
  throw new GeminiRequestError('GEMINI_HTTP_'+response.status);}
 let payload:GeminiPayload;
 try{payload=await response.json() as GeminiPayload;}catch{throw new GeminiRequestError('GEMINI_INVALID_API_RESPONSE');}
 if(payload.promptFeedback?.blockReason)throw new GeminiRequestError('GEMINI_BLOCKED');
 const candidate=payload.candidates?.[0];
 const raw=(candidate?.content?.parts??[]).map(p=>p.text??'').join('');
 if(candidate?.finishReason==='MAX_TOKENS')throw new GeminiRequestError('GEMINI_OUTPUT_TRUNCATED');
 if(!raw.trim())throw new GeminiRequestError('GEMINI_EMPTY_'+(candidate?.finishReason??'UNKNOWN'));
 try{return JSON.parse(raw);}catch{throw new GeminiRequestError('GEMINI_INVALID_JSON');}
}

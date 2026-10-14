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
          }
        },
        "required": [
          "title",
          "bullets",
          "teacherScript"
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
export async function generateGeminiJson(options:{model:string;instructions:string;parts:GeminiPart[];schema:object;maxOutputTokens?:number;timeoutMs?:number}):Promise<unknown>{
 const apiKey=process.env.GEMINI_API_KEY;
 if(!apiKey)throw new GeminiRequestError('MISSING_GEMINI_KEY');
 const model=options.model.replace(/^models\//,'');
 if(!/^[a-zA-Z0-9_.-]+$/.test(model))throw new GeminiRequestError('INVALID_MODEL');
 const response=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':generateContent',{
  method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':apiKey},
  body:JSON.stringify({systemInstruction:{parts:[{text:options.instructions}]},contents:[{role:'user',parts:options.parts}],
   generationConfig:{responseMimeType:'application/json',responseSchema:options.schema,maxOutputTokens:options.maxOutputTokens??8192,temperature:0.2}}),
  signal:AbortSignal.timeout(options.timeoutMs??100000)
 });
 if(!response.ok){if(response.status===429)throw new GeminiRequestError('GEMINI_QUOTA_LIMIT');
  if(response.status===401||response.status===403)throw new GeminiRequestError('GEMINI_KEY_OR_PERMISSION');
  if(response.status===404)throw new GeminiRequestError('GEMINI_MODEL_NOT_FOUND');
  throw new GeminiRequestError('GEMINI_HTTP_'+response.status);}
 const payload=await response.json() as GeminiPayload;
 if(payload.promptFeedback?.blockReason)throw new GeminiRequestError('GEMINI_BLOCKED');
 const candidate=payload.candidates?.[0];
 const raw=(candidate?.content?.parts??[]).map(p=>p.text??'').join('');
 if(!raw.trim())throw new GeminiRequestError('GEMINI_EMPTY_'+(candidate?.finishReason??'UNKNOWN'));
 try{return JSON.parse(raw);}catch{throw new GeminiRequestError('GEMINI_INVALID_JSON');}
}

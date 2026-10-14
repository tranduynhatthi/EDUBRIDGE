/** Server-side EDUBRIDGE Gemini routing.
 * Legacy Vercel GEMINI_MODEL may still be 3.8; standard tasks intentionally
 * do not read it, so the actual default is always Gemini 3.5 Flash-Lite.
 */
export type GeminiTask='standard'|'advanced'|'vision';
export const GEMINI_STANDARD_MODEL='gemini-3.5-flash-lite';
export const GEMINI_ADVANCED_MODEL='gemini-3.8-flash';
export function selectGeminiModel(task:GeminiTask):string{
 if(task==='standard')return GEMINI_STANDARD_MODEL;
 if(task==='advanced')return GEMINI_ADVANCED_MODEL;
 return process.env.GEMINI_VISION_MODEL?.trim()||GEMINI_ADVANCED_MODEL;
}

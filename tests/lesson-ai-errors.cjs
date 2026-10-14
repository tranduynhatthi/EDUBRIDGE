const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const route=read('src/app/api/ai/lesson/route.ts'),ui=read('src/app/builder/page.tsx'),gemini=read('src/lib/gemini.ts');
assert(route.includes("code:'LESSON_SCHEMA_INVALID'"),'Invalid lesson structure must be diagnosed');
assert(route.includes("code:'LESSON_SAVE_FAILED'"),'Supabase failure must have separate code');
assert(route.includes('describeGeminiError(error)'),'Provider errors must keep error codes');
assert(ui.includes('json.code'),'User must see provider diagnostic code');
assert(gemini.includes("candidate?.finishReason==='MAX_TOKENS'"),'Truncated response must be detected');
assert(route.includes('maxOutputTokens:18000'),'Allow headroom for 8-slide JSON');
const m=[
 "const a=await import('file://'+process.argv[1]);",
 "process.env.GEMINI_API_KEY='unit-test-mock-not-real';",
 "globalThis.fetch=async()=>({ok:true,json:async()=>({candidates:[{finishReason:'MAX_TOKENS',content:{parts:[{text:'{'}]}}]})});",
 "const input={model:'gemini-3.8-flash',instructions:'Test',parts:[{text:'test'}],schema:{type:'object',properties:{ok:{type:'boolean'}},required:['ok']}};",
 "let err;try{await a.generateGeminiJson(input)}catch(e){err=e}",
 "if(!err||err.code!=='GEMINI_OUTPUT_TRUNCATED')throw Error('Missing MAX_TOKENS diagnostic');",
 "const message=a.describeGeminiError(err);if(message.code!=='GEMINI_OUTPUT_TRUNCATED')throw Error('Missing user-facing code');",
 "console.log('PASS mocked response truncation detection');"
].join('');
const p=spawnSync(process.execPath,['--experimental-strip-types','--input-type=module','-e',m,path.join(root,'src/lib/gemini.ts')],{encoding:'utf8'});
assert.equal(p.status,0,p.stderr||p.stdout);
console.log('PASS Gemini generation error contracts; no billable API requests.');

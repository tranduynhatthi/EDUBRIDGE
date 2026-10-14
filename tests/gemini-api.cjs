// Mocked Gemini API contract: no external API key or billable network request.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
for(const p of ['src/lib/gemini.ts','src/app/api/ai/lesson/route.ts','src/app/api/admin/lessons/[id]/analyze-pdf/route.ts'])assert(fs.existsSync(path.join(root,p)),p+' missing');
assert(read('src/lib/gemini.ts').includes('x-goog-api-key'));
assert(read('src/lib/gemini.ts').includes('responseMimeType'));
assert(!read('src/lib/gemini.ts').includes('temperature:0.2'),'Gemini 3.8 should not send legacy sampling temperature');
assert(read('src/lib/gemini.ts').includes("thinkingLevel:'low'"),'Gemini 3.8 extraction should minimize unnecessary thinking latency');
assert(read('src/app/admin/library/page.tsx').includes('Kiểm tra kết nối Gemini'));
assert(read('src/app/api/admin/lessons/[id]/analyze-pdf/route.ts').includes("mimeType:'application/pdf'"));
assert(read('src/app/api/ai/lesson/route.ts').includes('LessonResultSchema.safeParse(generated)'));
assert(!read('src/app/api/ai/lesson/route.ts').includes("import OpenAI"));
assert(!read('src/app/api/admin/lessons/[id]/analyze-pdf/route.ts').includes("import OpenAI"));
const script=[
 "const m=await import("+JSON.stringify("file://") + "+process.argv[1]);",
 "process.env.GEMINI_API_KEY='mock-key-not-real';",
 "let seen=0;",
 "globalThis.fetch=async(url,init)=>{",
 "if(!url.includes('generativelanguage.googleapis.com'))throw Error('Wrong endpoint');",
 "if(init.headers['x-goog-api-key']!=='mock-key-not-real')throw Error('Missing auth');",
 "const body=JSON.parse(init.body);",
 "if(body.generationConfig.responseMimeType!=='application/json')throw Error('Missing JSON mode');",
 "if(!body.systemInstruction?.parts?.length)throw Error('Missing instructions');",
 "if(++seen===2&&!body.contents[0].parts.some(p=>p.inlineData?.mimeType==='application/pdf'))throw Error('Missing PDF data');",
 "return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify({valid:true})}]}}]})};",
 "};",
 "const args={model:'gemini-3.8-flash',instructions:'Demo',parts:[{text:'A'}],schema:{type:'object',properties:{valid:{type:'boolean'}},required:['valid']}};",
 "const first=await m.generateGeminiJson(args);if(first.valid!==true)throw Error('Invalid decode');",
 "const second=await m.generateGeminiJson({...args,parts:[{text:'B'},{inlineData:{mimeType:'application/pdf',data:'JVBERi0='}}]});",
 "if(second.valid!==true||seen!==2)throw Error('Mock test failure');",
 "console.log('Gemini mocked request/JSON/PDF tests passed');"
].join('');
const r=spawnSync(process.execPath,['--experimental-strip-types','--input-type=module','-e',script,path.join(root,'src/lib/gemini.ts')],{encoding:'utf8'});
assert.equal(r.status,0,r.stderr||r.stdout);
console.log('PASS: Gemini API contract tests (mock only).');

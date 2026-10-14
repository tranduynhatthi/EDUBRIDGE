const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path'),{spawnSync}=require('node:child_process');
const read=p=>fs.readFileSync(p,'utf8');
const lesson=read('src/app/api/ai/lesson/route.ts'),lang=read('src/app/api/ai/language/route.ts'),pdf=read('src/app/api/ai/source-pdf/route.ts'),adminPdf=read('src/app/api/admin/lessons/[id]/analyze-pdf/route.ts'),ui=read('src/app/builder/page.tsx'),schema=read('src/lib/schema.ts');
assert(lesson.includes('selectGeminiModel(generationMode)'),'Lesson requests use chosen mode');
assert(lang.includes("selectGeminiModel('standard')"),'Dictionary and speaking use Flash-Lite');
assert(pdf.includes("selectGeminiModel('vision')")&&adminPdf.includes("selectGeminiModel('vision')"),'PDF retains 3.8 Flash');
assert(ui.includes("value={generationMode}")&&ui.includes('Gemini 3.5 Flash-Lite'),'Teacher can choose model explicitly');
assert(schema.includes("generationMode:z.enum(['standard','advanced']).optional().default('standard')"),'Mode must default to standard');
const cmd=[
 "process.env.GEMINI_MODEL='gemini-3.8-flash';",
 "const m=await import('file://'+process.argv[1]);",
 "if(m.selectGeminiModel('standard')!=='gemini-3.5-flash-lite')throw Error('Legacy Vercel env overrides standard');",
 "if(m.selectGeminiModel('advanced')!=='gemini-3.8-flash')throw Error('Advanced model wrong');",
 "if(m.selectGeminiModel('vision')!=='gemini-3.8-flash')throw Error('PDF model wrong');",
 "console.log('PASS standard, advanced and vision model routing');"
].join('');
const p=spawnSync(process.execPath,['--experimental-strip-types','--input-type=module','-e',cmd,path.join(process.cwd(),'src/lib/gemini-models.ts')],{encoding:'utf8'});
assert.equal(p.status,0,p.stderr||p.stdout);console.log('PASS: Model routing tests, without paid Gemini calls.');

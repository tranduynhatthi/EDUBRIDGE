const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const builder=read('src/app/builder/page.tsx'),details=read('src/app/lessons/[id]/page.tsx'),source=read('src/lib/offline-lesson.ts');
assert(builder.includes('makeOfflineLesson(selected.title,source)'),'Offline template must be accessible');
assert(builder.includes("model_name:'offline-template'"),'Offline template must be labelled, not AI');
assert(builder.includes("status:'draft'"),'Offline template must never auto-publish');
assert(builder.includes('Tạo bản khung KHÔNG dùng AI'),'Dedicated opt-in button');
assert(details.includes("row.model_name==='offline-template'"),'Cannot review placeholders');
assert(source.includes('[CHƯA_SOẠN]'),'Quiz placeholders must be explicit');
assert(!source.includes('generateGeminiJson'),'Offline draft must never call Gemini');
const script=[
 "const m=await import('file://'+process.argv[1]);",
 "const raw='Mô tả nội dung do giáo viên đưa vào. '.repeat(15);",
 "const lesson=m.makeOfflineLesson('Bài minh họa',raw);",
 "if(lesson.slides.length!==8)throw Error('Expected eight slides');",
 "if(lesson.quiz.length!==5||lesson.quiz.some(q=>q.choices.length!==4))throw Error('Invalid quiz placeholders');",
 "if(lesson.qualityWarnings.length===0||!JSON.stringify(lesson).includes('[CHƯA_SOẠN]'))throw Error('Unsafe unlabeled template');",
 "if(lesson.vocabulary.length!==0)throw Error('No invented vocabulary');",
 "console.log('PASS source-only offline scaffold');"
].join('');
const p=spawnSync(process.execPath,['--experimental-strip-types','--input-type=module','-e',script,path.join(root,'src/lib/offline-lesson.ts')],{encoding:'utf8'});
assert.equal(p.status,0,p.stderr||p.stdout);
console.log('PASS offline lesson feature tests (no billable API requests).');

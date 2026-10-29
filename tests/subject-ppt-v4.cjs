// Dedicated subject prompt V4.0 contract checks. Does not consume Gemini tokens.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const backend=read('src/app/api/ai/lesson/route.ts');
const common=read('src/lib/emi-clil-prompt.ts');
const builder=read('src/app/builder/page.tsx');
const lesson=read('src/app/lessons/[id]/page.tsx');
const deck=read('src/lib/slide-deck.ts');
assert(common.includes('describeSubjectPptPrompt(subject)'),'Gemini must get the full subject-specific prompt');
assert(common.includes('SUBJECT_PPT_PROMPT_VERSION'),'Prompt version must be provided');
assert(backend.includes('lesson.subjectPromptVersion=SUBJECT_PPT_PROMPT_VERSION'),'Saved lessons must be labelled by prompt version');
assert(backend.includes('lesson.subjectPromptSubject=data.subject'),'Save subject for audit');
assert(builder.includes('getSubjectPptPrompt(subject)'),'Builder must select subject-specific prompt');
assert(builder.includes('Xem chi tiết prompt môn'),'Builder must let teachers inspect details');
assert(lesson.includes("result.subjectPromptVersion==='4.0'"),'Saved lesson must distinguish old and new output');
assert(deck.includes("info.promptVersion:result.subjectPromptVersion"),'Export must carry correct prompt version');
const snippets=[
 "const a=await import('file://'+process.argv[1]);",
 "const b=await import('file://'+process.argv[2]);",
 "const names=Object.keys(a.SUBJECT_PPT_PROMPTS);",
 "if(names.length!==10)throw Error('Expected ten subject prompts');",
 "const unique=new Set();",
 "for(const subject of names){",
 " const p=a.getSubjectPptPrompt(subject);const full=a.describeSubjectPptPrompt(subject);",
 " for(const key of ['teachingFlow','visuals','vocabulary','classroomLanguage','activities','assessment','misconceptions','slideArchetypes','notes'])if(!Array.isArray(p[key])||p[key].length<2)throw Error(subject+' missing '+key);",
 " if(full.length<1900)throw Error('Subject prompt too short: '+subject+' '+full.length);",
 " if(!full.includes('SUBJECT-SPECIFIC VISUAL RULES')||!full.includes('ASSESSMENT / QUALITY RUBRIC')||!full.includes('REQUIRED TEACHER NOTES'))throw Error(subject+' missing full instructions');",
 " const final=b.buildEmiClilLessonInstructions({subject,level:'B1',durationMinutes:45});",
 " if(!final.includes(full)||!final.includes('45 minutes')||!final.includes('CLIL 4Cs'))throw Error(subject+' not fully integrated');",
 " unique.add(full);",
 "}",
 "if(unique.size!==10)throw Error('Subject prompts must differ');",
 "if(!a.describeSubjectPptPrompt('Hóa học').includes('conservation'))throw Error('Chemistry subject accuracy missing');",
 "if(!a.describeSubjectPptPrompt('Tin học').includes('flowchart'))throw Error('Computer science flowchart guidance missing');",
 "if(!a.describeSubjectPptPrompt('Địa lí').includes('scale'))throw Error('Geography scale guidance missing');",
 "if(!a.describeSubjectPptPrompt('Lịch sử').includes('timelines'))throw Error('History timelines missing');",
 "console.log('PASS 10 detailed, unique, source-grounded subject PPT prompts and backend integration');"
].join('');
const cmd=spawnSync(process.execPath,['--experimental-strip-types','--input-type=module','-e',snippets,path.join(root,'src/lib/subject-ppt-prompts.ts'),path.join(root,'src/lib/emi-clil-prompt.ts')],{encoding:'utf8'});
assert.equal(cmd.status,0,cmd.stderr||cmd.stdout);
console.log('PASS subject-prompt V4.0 integration checks.');

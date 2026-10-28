// Multi-subject EMI/CLIL contract test. No external services or API calls.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const read=x=>fs.readFileSync(x,'utf8');
const root=path.resolve(__dirname,'..');
const engine=read(path.join(root,'src/lib/emi-clil-prompt.ts'));
const slide=read(path.join(root,'src/lib/slide-deck.ts'));
const schema=read(path.join(root,'src/lib/schema.ts'));
const builder=read(path.join(root,'src/app/builder/page.tsx'));
const api=read(path.join(root,'src/app/api/ai/lesson/route.ts'));
for(const subject of ['Toán','Vật lí','Hóa học','Sinh học','Tin học','Công nghệ','Lịch sử','Địa lí','Ngữ văn','Giáo dục kinh tế và pháp luật']){
 assert(engine.includes("'"+subject+"'"),'Missing subject guide: '+subject);
}
assert(builder.includes('setDurationMinutes'),'45/90 minute selector missing');
assert(builder.includes('durationMinutes}'),'Generation request must forward duration');
assert(api.includes('buildEmiClilLessonInstructions({subject:data.subject,level:data.languageLevel,durationMinutes})'),'Generation must invoke multi-subject prompt');
assert(schema.includes('expectedStudentResponses')&&schema.includes('classroomEnglish')&&schema.includes('ipa:z.string().optional()'),'Structured teacher support missing');
assert(slide.includes('EXPECTED STUDENT RESPONSES')&&slide.includes('PRONUNCIATION / PHÁT ÂM'),'PowerPoint notes must carry per-slide scaffold');
assert(slide.includes("result.durationMinutes===90?14:10"),'Lesson slide count must respond to duration');
const js=[
 "const a=await import('file://'+process.argv[1]);",
 "const subjects=Object.keys(a.SUBJECT_TEACHING_GUIDES); if(subjects.length!==10)throw Error('Expected 10 subject guides');",
 "for(const subject of subjects){let p=a.buildEmiClilLessonInstructions({subject,level:'A2',durationMinutes:45});",
 "if(!p.includes('45 minutes')||!p.includes('CLIL 4Cs')||!p.includes(a.getSubjectTeachingGuide(subject).pedagogy))throw Error('Invalid guide for '+subject);}",
 "let extended=a.buildEmiClilLessonInstructions({subject:'Lịch sử',level:'B2',durationMinutes:90});",
 "if(!extended.includes('90 minutes')||!extended.includes('12 to 14')||!extended.includes('chronology'))throw Error('Missing 90-minute History guidance');",
 "console.log('PASS 10 subject-specific CLIL prompts, classroom support and 45/90 minute options');"
].join('');
const p=spawnSync(process.execPath,['--experimental-strip-types','--input-type=module','-e',js,path.join(root,'src/lib/emi-clil-prompt.ts')],{encoding:'utf8'});
assert.equal(p.status,0,p.stderr||p.stdout);
console.log('PASS source-grounded multi-subject PPT contract checks.');

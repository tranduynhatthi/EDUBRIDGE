const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const read=p=>fs.readFileSync(p,'utf8');
assert(read('src/app/builder/page.tsx').includes('Tạo bài dạy với AI'));
assert(!read('src/app/builder/page.tsx').includes('Tạo bài dạy với Gemini'));
assert(read('src/app/lessons/[id]/page.tsx').includes('TeachingMaterialsPanel'));
assert(read('src/app/api/ai/materials/route.ts').includes("status:'draft'"));
assert(read('src/app/api/export/materials/route.ts').includes("version:z.enum(['student','answers'])"));
const code=[
"const m=await import('file://'+process.argv[1]);",
"const w=await import('file://'+process.argv[2]);",
"const {default:JSZip}=await import('jszip');",
"const quiz={multipleChoice:Array.from({length:10},(_,i)=>({question:'Question test number '+i,choices:['one','two','three','four'],correctIndex:1,explanation:'Source verifies answer'})),",
"trueFalse:Array.from({length:2},(_,i)=>({context:'Context question '+i,statements:Array.from({length:4},(_,j)=>({text:'Claim '+i+' '+j,isTrue:j%2===0,explanation:'Based on lesson source'}))})),",
"shortAnswer:Array.from({length:3},(_,i)=>({question:'Brief question number '+i,answer:'Answer '+i,explanation:'Reason from source'})),qualityWarnings:[]};",
"if(!m.ReviewSchema.safeParse(quiz).success)throw Error('review schema failed');",
"if(m.ReviewSchema.safeParse({...quiz,multipleChoice:quiz.multipleChoice.slice(0,9)}).success)throw Error('9 MCQ accepted');",
"if(m.ReviewSchema.safeParse({...quiz,trueFalse:quiz.trueFalse.slice(0,1)}).success)throw Error('1 TF accepted');",
"if(m.ReviewSchema.safeParse({...quiz,shortAnswer:quiz.shortAnswer.slice(0,2)}).success)throw Error('2 short accepted');",
"const meta={title:'States of matter',subject:'Vật lí',grade:'12'};",
"const student=w.generateMaterialParagraphs('review',quiz,meta,'student').map(x=>x.text).join('\\n');",
"if(student.includes('Source verifies answer')||student.includes('Answer 0'))throw Error('Answer leaked');",
"const teacher=w.generateMaterialParagraphs('review',quiz,meta,'answers').map(x=>x.text).join('\\n');",
"if(!teacher.includes('Source verifies answer')||!teacher.includes('Answer 0'))throw Error('Teacher answers missing');",
"const zip=await JSZip.loadAsync(await w.materialDocx(w.generateMaterialParagraphs('review',quiz,meta,'student')));",
"const xml=await zip.file('word/document.xml').async('string');",
"if(!xml.includes('TRẮC NGHIỆM')||!xml.includes('ĐÚNG – SAI')||!xml.includes('TRẢ LỜI NGẮN'))throw Error('DOCX sections missing');",
"console.log('PASS: 10 MCQ, 2 TF x 4, 3 short answers, separated teacher/student DOCX');"
].join('');
const run=spawnSync(process.execPath,['--experimental-strip-types','--input-type=module','-e',code,path.join(process.cwd(),'src/lib/teaching-materials.ts'),path.join(process.cwd(),'src/lib/export-word.ts')],{encoding:'utf8',maxBuffer:2000000});
assert.equal(run.status,0,run.stderr||run.stdout);
console.log(run.stdout);

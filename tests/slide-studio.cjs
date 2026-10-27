const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const read=p=>fs.readFileSync(p,'utf8');
const engine=read('src/lib/slide-deck.ts'),api=read('src/app/api/export/pptx/route.ts');
const ui=read('src/app/lessons/[id]/page.tsx'),schema=read('src/lib/schema.ts');
assert(engine.includes("function formula("),'Equation renderer missing');
assert(engine.includes("function diagram("),'Mind-map renderer missing');
assert(engine.includes("function comparison("),'Comparison renderer missing');
assert(engine.includes("function warmup("),'Warmup renderer missing');
assert(engine.includes("function activity("),'Activity renderer missing');
assert(engine.includes("function quiz("),'Quiz renderer missing');
assert(engine.includes('function vocabularyPractice('),'Missing vocabulary lesson exercise');
assert(engine.includes('s.addMedia('),'Missing PowerPoint pronunciation audio');
assert(read('src/components/PronunciationPractice.tsx').includes('SpeechSynthesisUtterance'),'Browser speech playback missing');
assert(engine.includes('quizAfterSlideIndex(k,slideItems.length,qs.length)'),'Quiz checkpoints must be placed among lesson slides');
assert(!engine.includes('result.quiz.slice(0,2)'),'Do not truncate exported quiz questions');
assert(engine.includes("s.addNotes("),'Teacher scripts must be in speaker notes');
assert(engine.includes('CLASSROOM ENGLISH / CÂU GIAO TIẾP GỢI Ý'),'Notes must include classroom phrases');
assert(engine.includes('function illustration('),'Must render teaching images');
assert(engine.includes('s.addImage({data:image.data'),'SVG images must be embedded into PPTX');
assert(engine.includes("pptx.layout='LAYOUT_WIDE'"),'16:9 required');
assert(api.includes('buildBeautifulDeck('),'Export API must use visual engine');
assert(ui.includes('EDUBRIDGE SLIDE STUDIO'),'Teacher must edit slide metadata');
assert(ui.includes('quizAfterSlideIndex(j,result.slides.length,result.quiz.length)'),'Quiz editing should be in Slide');
assert(!ui.includes("label:'Quiz tương tác'"),'Separate Quiz tab should be removed');
assert(schema.includes("slideType:z.enum("),'Structured slide types must be stored');
const fake={
lessonTitleEn:'States of Matter',contentObjectives:['Recognise particle arrangement','Compare three states','Explain transitions'],
languageObjectives:['Explain in English','Ask a question'],
keyConcepts:[],vocabulary:[{termEn:'Melting',termVi:'Nóng chảy',definitionEn:'Transition from solid to liquid',exampleEn:'Ice melts'}],
classroomPhrases:[{english:'Please look at the diagram.',vietnamese:'Hãy quan sát sơ đồ.'},{english:'What do you notice?',vietnamese:'Em nhận thấy điều gì?'}],
slides:[
 {slideType:'warmup',title:'Why does ice melt?',bullets:['Observe the change'],teacherScript:'Ask for predictions',keyMessage:'Why does ice melt?',studentTask:'Think, predict and explain.'},
 {slideType:'comparison',title:'Solid and liquid',bullets:['Particles in a solid are closely packed','Liquids flow'],teacherScript:'Compare states'},
 {slideType:'diagram',title:'Particle arrangement',bullets:['Solid','Liquid','Gas'],teacherScript:'Compare these labels'},
 {slideType:'formula',title:'Thermal energy',formula:'Q = mcΔT',bullets:['Q = mcΔT','m: mass','c: specific heat'],teacherScript:'Check units'},
 {slideType:'process',title:'Observe a change',bullets:['Observe','Record','Explain'],teacherScript:'Show experiment'},
 {slideType:'example',title:'An example',bullets:['State facts','Explain','Reflect'],teacherScript:'Guide example'},
 {slideType:'activity',title:'Pair work',bullets:['Discuss'],teacherScript:'Group discussion'},
 {slideType:'concept',title:'Review',bullets:['Summary concept'],teacherScript:'Wrap up'}
],
quiz:Array.from({length:5},(_,i)=>({questionEn:'Which state flows? Number '+i,choices:['Solid','Liquid','Both','Neither'],correctIndex:1,explanationVi:'Liquid flows.'})),
qualityWarnings:['Check source']
};
const cmd=[
 "const m=await import('file://'+process.argv[1]);",
 "const data=JSON.parse(process.argv[2]);",
 "const pcm=Buffer.alloc(2400);const header=Buffer.alloc(44);header.write('RIFF',0);header.writeUInt32LE(36+pcm.length,4);header.write('WAVE',8);header.write('fmt ',12);header.writeUInt32LE(16,16);header.writeUInt16LE(1,20);header.writeUInt16LE(1,22);header.writeUInt32LE(24000,24);header.writeUInt32LE(48000,28);header.writeUInt16LE(2,32);header.writeUInt16LE(16,34);header.write('data',36);header.writeUInt32LE(pcm.length,40);const wav=Buffer.concat([header,pcm]);",
 "for(let i=0;i<data.slides.length;i++){if(!m.classifySlide(data.slides[i],i,data.slides.length))throw Error('Missing slide kind')}",
 "const buf=await m.buildBeautifulDeck(data,{title:'States of Matter',subject:'Vật lí',grade:'12'},{pronunciationGenerator:async()=>wav});",
 "if(!Buffer.isBuffer(buf)||buf.length<16000||buf[0]!==80||buf[1]!==75)throw Error('Invalid PowerPoint zip');",
 "const JSZip=(await import('jszip')).default;",
 "const zip=await JSZip.loadAsync(buf);",
 "const wavs=Object.keys(zip.files).filter(x=>x.startsWith('ppt/media/')&&x.endsWith('.wav'));",
 "if(!wavs.length)throw Error('Vocabulary audio is not embedded in PPTX');",
 "const illustrations=Object.keys(zip.files).filter(x=>x.startsWith('ppt/media/')&&(x.endsWith('.svg')||x.endsWith('.png')));",
 "if(illustrations.length<4)throw Error('Expected at least 4 embedded educational images, got '+illustrations.length);",
 "const slideXml=await Promise.all(Object.keys(zip.files).filter(x=>x.startsWith('ppt/slides/slide')&&x.endsWith('.xml')).map(x=>zip.file(x).async('string')));",
"for(let i=0;i<5;i++){if(slideXml.filter(x=>x.includes('Which state flows? Number '+i)).length!==1)throw Error('Missing or repeated PPT quiz question '+i)}",
"if(slideXml.some(x=>x.includes('Liquid flows.')))throw Error('Teacher answer leaked into PowerPoint slide');",
"const notes=Object.keys(zip.files).filter(x=>x.startsWith('ppt/notesSlides/notesSlide')&&x.endsWith('.xml'));",
 "const joined=(await Promise.all(notes.map(x=>zip.file(x).async('string')))).join('');",
 "if(!joined.includes('CLASSROOM ENGLISH')||!joined.includes('Please look at the diagram.'))throw Error('Missing bilingual teacher classroom notes');",
 "console.log('PASS SVG illustrations',illustrations.length,'speaker-note files',notes.length,'bytes',buf.length);"
].join('');
const p=spawnSync(process.execPath,['--experimental-strip-types','--input-type=module','-e',cmd,path.join(process.cwd(),'src/lib/slide-deck.ts'),JSON.stringify(fake)],{encoding:'utf8',maxBuffer:5e6});
assert.equal(p.status,0,p.stderr||p.stdout);
console.log('PASS: multi-layout slide deck and backward-compatible schema. No Gemini calls.');

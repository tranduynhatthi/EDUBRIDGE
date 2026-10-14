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
assert(engine.includes("s.addNotes("),'Teacher scripts must be in speaker notes');
assert(engine.includes("pptx.layout='LAYOUT_WIDE'"),'16:9 required');
assert(api.includes('buildBeautifulDeck('),'Export API must use visual engine');
assert(ui.includes('EDUBRIDGE SLIDE STUDIO'),'Teacher must edit slide metadata');
assert(schema.includes("slideType:z.enum("),'Structured slide types must be stored');
const fake={
lessonTitleEn:'States of Matter',contentObjectives:['Recognise particle arrangement','Compare three states','Explain transitions'],
languageObjectives:['Explain in English','Ask a question'],
keyConcepts:[],vocabulary:[{termEn:'Melting',termVi:'Nóng chảy',definitionEn:'Transition from solid to liquid',exampleEn:'Ice melts'}],
classroomPhrases:[],
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
quiz:[{questionEn:'Which state flows?',choices:['Solid','Liquid','Both','Neither'],correctIndex:1,explanationVi:'Liquid flows.'}],
qualityWarnings:['Check source']
};
const cmd=[
 "const m=await import('file://'+process.argv[1]);",
 "const data=JSON.parse(process.argv[2]);",
 "for(let i=0;i<data.slides.length;i++){if(!m.classifySlide(data.slides[i],i,data.slides.length))throw Error('Missing slide kind')}",
 "const buf=await m.buildBeautifulDeck(data,{title:'States of Matter',subject:'Vật lí',grade:'12'});",
 "if(!Buffer.isBuffer(buf)||buf.length<16000||buf[0]!==80||buf[1]!==75)throw Error('Invalid PowerPoint zip');",
 "console.log('PASS valid editable PowerPoint, bytes',buf.length);"
].join('');
const p=spawnSync(process.execPath,['--experimental-strip-types','--input-type=module','-e',cmd,path.join(process.cwd(),'src/lib/slide-deck.ts'),JSON.stringify(fake)],{encoding:'utf8',maxBuffer:5e6});
assert.equal(p.status,0,p.stderr||p.stdout);
console.log('PASS: multi-layout slide deck and backward-compatible schema. No Gemini calls.');

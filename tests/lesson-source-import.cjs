// Tests the no-Gemini, one-lesson Word/TXT import and safe PDF retry contracts.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const importer=read('src/lib/lesson-source-import.ts');
const ui=read('src/app/admin/library/page.tsx');
const api=read('src/app/api/admin/lessons/[id]/analyze-pdf/route.ts');
assert(ui.includes('importLessonSourceFile(file)'),'Draft quick import must call the file reader');
assert(ui.includes('onChange={e=>{void importDraftTextFile(e);}}'),'Draft import must have a file selector');
assert(ui.includes('Tùy chọn: nhập văn bản đã có từ Word hoặc TXT'),'Must be discoverable to teachers/admins');
assert(ui.includes('Lưu bản nháp'),'Import is only staged until explicit save');
assert(ui.includes('setConfirmed(false)'),'Editing must reset review confirmation');
assert(ui.includes("selectedRecord.is_published"),'Quick-import and OCR retries must be scoped to unpublished lessons');
assert(ui.includes('json.previewOnly'),'Rescan results must be clearly marked as preview only');
assert(!api.includes("if((lesson.source_text||'').trim())return Response.json({error:'Bản nháp đã có nội dung."),'Must not reject nonempty draft rescan');
assert(api.includes('previewOnly:true'),'Nonempty draft rescan must be a preview');
assert(api.includes(".eq('source_text','')"),'Blank-only database auto-save must remain protected');
assert(api.includes("if(lesson.is_published)return Response.json"),'Published lessons must reject AI overwrite');
assert(importer.includes("document.xml"),'DOCX importer must parse the document body');
assert(importer.includes("MAX_LESSON_CHARS=30_000"),'Text limit must match database constraints');
const program=[
 "const a=await import('file://'+process.argv[1]);",
 "const source=('Bài 1. Cấu trúc của chất\\n'+('Học sinh quan sát và mô tả cấu trúc. '.repeat(12))).trim();",
 "let txt=await a.importLessonSourceFile({size:source.length,name:'bai1.txt',text:async()=>source});",
 "if(txt.text!==source)throw Error('TXT source must remain unchanged');",
 "let md=await a.importLessonSourceFile({size:source.length,name:'bai1.md',text:async()=>source});",
 "if(md.text!==source)throw Error('Markdown source must remain unchanged');",
 "let reject=false;try{await a.importLessonSourceFile({size:4,name:'bai1.pdf',text:async()=>''})}catch(e){reject=true;}",
 "if(!reject)throw Error('PDF must not be parsed as a text file');",
 "reject=false;try{await a.importLessonSourceFile({size:50000,name:'bai1.txt',text:async()=>('a'.repeat(50000))})}catch(e){reject=true;}",
 "if(!reject)throw Error('Overlong lesson must be rejected rather than truncated');",
 "reject=false;try{await a.importLessonSourceFile({size:0,name:'bai1.txt',text:async()=>''})}catch(e){reject=true;}",
 "if(!reject)throw Error('Empty import must be rejected');",
 "console.log('PASS safe TXT, MD parsing and error handling.');"
].join('');
const r=spawnSync(process.execPath,['--experimental-strip-types','--input-type=module','-e',program,path.join(root,'src/lib/lesson-source-import.ts')],{encoding:'utf8'});
assert.equal(r.status,0,r.stderr||r.stdout);
console.log('PASS quick import, draft-only review and non-destructive PDF rescan contracts.');

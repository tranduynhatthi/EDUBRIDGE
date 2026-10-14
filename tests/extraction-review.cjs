const fs=require('node:fs');
const assert=require('node:assert/strict');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const base=path.resolve(__dirname,'..');
const route=fs.readFileSync(path.join(base,'src/app/api/admin/lessons/[id]/analyze-pdf/route.ts'),'utf8');
const ui=fs.readFileSync(path.join(base,'src/app/admin/library/page.tsx'),'utf8');
assert(route.includes('Promise.allSettled(groups.map'),'Short extraction must retry in smaller page groups');
assert(route.includes("code:'PARTIAL_EXTRACTED_NOTES'"),'Incomplete extraction needs editable partial draft');
assert(route.includes("source_text',''"),'AI must never overwrite an existing source draft');
assert(ui.includes("json.draftSourceText"),'UI must allow teacher to inspect/edit partial PDF extraction');
const program=[
 "const {reviewExtractedNotes}=await import('file://'+process.argv[1]);",
 "const r=reviewExtractedNotes({sourceText:'  Vật lí '+String.fromCharCode(0)+'   ',warnings:['  Trang 120 đọc chưa rõ.  ','']});",
 "if(r.text!=='Vật lí')throw Error('Text not preserved');",
 "if(r.warnings.length!==1||r.warnings[0]!=='Trang 120 đọc chưa rõ.')throw Error('Warning not preserved');",
 "const s=reviewExtractedNotes({sourceText:'  ',warnings:[]});",
 "if(s.text!=='')throw Error('Missing text must remain missing');",
 "console.log('Extraction review helper tests passed');"
].join('');
const p=spawnSync(process.execPath,['--experimental-strip-types','--input-type=module','-e',program,path.join(base,'src/lib/extraction-review.ts')],{encoding:'utf8'});
assert.equal(p.status,0,p.stderr||p.stdout);
console.log('PASS: partial extraction and per-page retry contract checks');

const fs=require('node:fs'),assert=require('node:assert/strict');
const path=require('node:path'),root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const m=JSON.parse(read('src/data/physics12-ktst.json'));
assert.equal(m.pdfPageCount,126);assert.equal(m.lessons.length,25);
assert.equal(m.lessons.filter(l=>l.chapter.includes('Chương I.')).length,7);
assert.equal(m.lessons.filter(l=>l.chapter.includes('Chương II.')).length,6);
assert.equal(m.lessons.filter(l=>l.chapter.includes('Chương III.')).length,7);
assert.equal(m.lessons.filter(l=>l.chapter.includes('Chương IV.')).length,5);
const bound={1:[7,10],7:[31,33],8:[35,37],13:[53,55],14:[57,61],20:[87,90],21:[92,96],25:[120,123]};
for(const a of m.lessons){assert.equal(a.sortOrder,m.lessons.indexOf(a)+1);assert(a.startPage>0 && a.startPage<=a.endPage && a.endPage<=126);assert(a.endPage-a.startPage+1<=10);assert.equal(a.startPage,a.printedStart+1);assert.equal(a.endPage,a.printedEnd+1);if(bound[a.sortOrder])assert.deepEqual([a.startPage,a.endPage],bound[a.sortOrder]);}
assert(read('supabase/03_seed_scanned_pdf.sql').includes('textbook_lessons_publish_requires_content'));
assert(read('src/app/api/admin/catalog-seed/route.ts').includes('hash!==catalog.sha256'));
assert(read('src/app/api/admin/lessons/[id]/analyze-pdf/route.ts').includes('PDFDocument.load'));
assert(read('src/app/api/admin/lessons/[id]/analyze-pdf/route.ts').includes("mimeType:'application/pdf'"));
assert(read('src/app/builder/page.tsx').includes(".eq('is_published',true)"));
console.log('PASS: 25 lesson boundaries, chapters, PDF fingerprint and staged AI review workflow.');

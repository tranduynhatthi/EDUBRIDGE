import JSZip from 'jszip';
import type {Plan5512,Worksheet,Review} from '@/lib/teaching-materials';

export type DocumentParagraph={text:string;kind?:'title'|'sub'|'section'|'question'|'answer'|'normal'|'blank'};
const esc=(value:unknown)=>String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
export function generateMaterialParagraphs(kind:'plan'|'worksheet'|'review',material:Plan5512|Worksheet|Review,lesson:{title:string;subject:string;grade:string},version:'student'|'answers'='student'):DocumentParagraph[]{
 const p:DocumentParagraph[]=[];
 const add=(text:string,style:DocumentParagraph['kind']='normal')=>p.push({text,kind:style});
 const bullet=(items:string[])=>items.forEach((s,i)=>add('• '+s,'normal'));
 const warn=()=>{add('BẢN NHÁP AI – GIÁO VIÊN CẦN HẬU KIỂM KIẾN THỨC, ĐÁP ÁN, THUẬT NGỮ TRƯỚC KHI DÙNG','sub');};
 if(kind==='plan'){
  const m=material as Plan5512;
  add('KẾ HOẠCH BÀI DẠY (PHỤ LỤC IV – CÔNG VĂN 5512/BGDĐT-GDTrH)','title');
  add('Trường: .........................................     Tổ: .........................................','normal');
  add('Giáo viên: ............................................................','normal');
  add('Tên bài dạy: '+lesson.title,'sub');
  add('Môn học: '+lesson.subject+'     Lớp: '+lesson.grade+'     Thời gian thực hiện: '+m.duration);
  add('I. MỤC TIÊU','section');add('1. Kiến thức','question');bullet(m.knowledge);add('2. Năng lực','question');bullet(m.competencies);add('3. Phẩm chất','question');bullet(m.qualities);
  add('II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU','section');add('1. Giáo viên','question');bullet(m.teacherEquipment);add('2. Học sinh','question');bullet(m.studentEquipment);
  add('III. TIẾN TRÌNH DẠY HỌC','section');
  const phases={opening:'MỞ ĐẦU / XÁC ĐỊNH VẤN ĐỀ',knowledge:'HÌNH THÀNH KIẾN THỨC MỚI',practice:'LUYỆN TẬP',application:'VẬN DỤNG'};
  m.activities.forEach((a,i)=>{
   add('Hoạt động '+(i+1)+'. '+phases[a.phase]+': '+a.name,'section');
   add('a) Mục tiêu: '+a.objective);
   add('b) Nội dung: '+a.content);
   add('c) Sản phẩm: '+a.product);
   add('d) Tổ chức thực hiện:','question');
   add('Bước 1. Chuyển giao nhiệm vụ: '+a.organization.assign);
   add('Bước 2. Thực hiện nhiệm vụ: '+a.organization.perform);
   add('Bước 3. Báo cáo, thảo luận: '+a.organization.report);
   add('Bước 4. Kết luận, nhận định: '+a.organization.conclude);
  });
  warn();return p;
 }
 if(kind==='worksheet'){
  const m=material as Worksheet;
  add('PHIẾU HỌC TẬP – '+m.title,'title');
  add('Môn: '+lesson.subject+' · Lớp: '+lesson.grade+' · Bài: '+lesson.title,'sub');
  add('Họ và tên: ................................................... Lớp: ............');
  add('Instructions: '+m.instructions);
  if(m.vocabulary?.length){
   add('KEY VOCABULARY – TỪ VỰNG TRỌNG TÂM','section');
   m.vocabulary.forEach((v,i)=>add((i+1)+'. '+v.termEn+' — '+v.termVi+' — '+v.definitionEn));
  }
  m.tasks.forEach((t,i)=>{
   add('Nhiệm vụ '+(i+1)+'. '+t.instruction,'section');add(t.question,'question');
   if(version==='answers')add('Gợi ý đáp án: '+t.expectedAnswer,'answer');
   else {add('Trả lời: ........................................................................................................','blank');add('............................................................................................................................','blank');}
  });warn();return p;
 }
 const m=material as Review;
 add(version==='answers'?'ĐÁP ÁN – CÂU HỎI ÔN TẬP SAU BÀI HỌC':'PHIẾU ÔN TẬP SAU BÀI HỌC','title');
 add('Môn: '+lesson.subject+' · Lớp: '+lesson.grade+' · Bài: '+lesson.title,'sub');
 if(version==='student')add('Họ và tên: ................................................... Lớp: ............');
 add('PHẦN I. TRẮC NGHIỆM NHIỀU LỰA CHỌN (10 câu)','section');
 m.multipleChoice.forEach((q,i)=>{
  add('Câu '+(i+1)+'. '+q.question,'question');
  q.choices.forEach((v,j)=>add('   '+String.fromCharCode(65+j)+'. '+v));
  if(version==='answers')add('Đáp án: '+String.fromCharCode(65+q.correctIndex)+'. '+q.explanation,'answer');
 });
 add('PHẦN II. CÂU HỎI ĐÚNG – SAI (2 câu, mỗi câu 4 ý)','section');
 m.trueFalse.forEach((q,i)=>{add('Câu '+(i+1)+'. '+q.context,'question');q.statements.forEach((st,j)=>{
  add('   '+String.fromCharCode(97+j)+') '+st.text+(version==='student'?'    ☐ Đúng  ☐ Sai':''));
  if(version==='answers')add('      '+(st.isTrue?'ĐÚNG':'SAI')+' – '+st.explanation,'answer');
 });});
 add('PHẦN III. CÂU TRẢ LỜI NGẮN (3 câu)','section');
 m.shortAnswer.forEach((q,i)=>{add('Câu '+(i+1)+'. '+q.question,'question');if(version==='answers')add('Đáp án: '+q.answer+'. '+q.explanation,'answer');else add('Trả lời: ........................................................................................................','blank');});
 warn();return p;
}
function paragraph(p:DocumentParagraph){
 const style=p.kind||'normal';
 const color=style==='title'?'9A3412':style==='section'?'EA580C':style==='answer'?'166534':'292524';
 const sz=style==='title'?34:style==='section'?29:style==='sub'?26:25;
 const bold=['title','section','sub','question','answer'].includes(style);
 const spacing=style==='title'?200:style==='section'?180:90;
 const text=esc(p.text);
 return '<w:p><w:pPr><w:spacing w:before="'+spacing+'" w:after="95" w:line="350" w:lineRule="auto"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="Times New Roman"/><w:sz w:val="'+sz+'"/><w:color w:val="'+color+'"/>'+(bold?'<w:b/>':'')+'</w:rPr><w:t xml:space="preserve">'+text+'</w:t></w:r></w:p>';
}
export async function materialDocx(items:DocumentParagraph[]):Promise<Buffer>{
 const zip=new JSZip();
 const document='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+items.map(paragraph).join('')+'<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1210" w:right="1100" w:bottom="1210" w:left="1300" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr></w:body></w:document>';
 zip.file('[Content_Types].xml','<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
 zip.file('_rels/.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
 zip.file('word/document.xml',document);
 const bytes=await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE'});
 return bytes;
}

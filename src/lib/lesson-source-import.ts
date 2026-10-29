/**
 * Client-side quick import of one pre-extracted lesson. Never sends a Word file to
 * Gemini or a public file store. The extracted text is only put in the review editor.
 * Native Word equations, images and tables require a human comparison with the PDF.
 */
export type ImportedLessonSource={text:string;warning:string};

const MAX_UPLOAD_BYTES=10*1024*1024;
const MAX_LESSON_CHARS=30_000;
const WORD_NS='http://schemas.openxmlformats.org/wordprocessingml/2006/main';

function verifyText(text:string):string {
 const value=text.replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n').replace(/\u0000/g,'').trim();
 if(!value)throw new Error('Tệp không có văn bản có thể đọc được.');
 if(value.length>MAX_LESSON_CHARS)throw new Error('Bài có quá 30.000 ký tự. Hãy chọn đúng một bài hoặc chia nhỏ nội dung.');
 return value;
}
export async function importLessonSourceFile(file:File):Promise<ImportedLessonSource>{
 if(file.size>MAX_UPLOAD_BYTES)throw new Error('Tệp vượt 10 MB. Hãy tách tài liệu thành từng bài nhỏ.');
 const name=file.name.toLocaleLowerCase();
 if(/\.(txt|md)$/.test(name)){
  const text=verifyText(await file.text());
  return {text,warning:'Đã đọc văn bản. Hãy đối chiếu nội dung bài với SGK trước khi duyệt.'};
 }
 if(!name.endsWith('.docx'))throw new Error('Chỉ nhận .docx, .txt hoặc .md. Tệp .doc cũ cần lưu lại thành .docx.');
 const JSZip=(await import('jszip')).default;
 const zip=await JSZip.loadAsync(await file.arrayBuffer(),{checkCRC32:true});
 const document=zip.file('word/document.xml');
 if(!document)throw new Error('Tệp Word không chứa nội dung văn bản hợp lệ.');
 const xml=await document.async('string');
 if(xml.length>5*1024*1024)throw new Error('Nội dung Word quá lớn. Hãy chia nhỏ theo bài.');
 if(typeof DOMParser==='undefined')throw new Error('Không có công cụ đọc Word trên thiết bị này.');
 const doc=new DOMParser().parseFromString(xml,'application/xml');
 if(doc.getElementsByTagName('parsererror').length)throw new Error('Không thể giải mã nội dung Word.');
 const paragraphs=Array.from(doc.getElementsByTagNameNS(WORD_NS,'p'));
 const text=verifyText(paragraphs.map(p=>{
  const chunks:string[]=[];
  // Preserve tabs and line breaks in paragraphs, but never run HTML or scripts.
  const walk=(node:Node)=>{
   if(node.nodeType===Node.ELEMENT_NODE){
    const element=node as Element;
    if(element.namespaceURI===WORD_NS&&element.localName==='t')chunks.push(element.textContent||'');
    else if(element.namespaceURI===WORD_NS&&element.localName==='tab')chunks.push('\t');
    else if(element.namespaceURI===WORD_NS&&(element.localName==='br'||element.localName==='cr'))chunks.push('\n');
    else for(const child of Array.from(element.childNodes))walk(child);
   }
  };
  walk(p);
  return chunks.join('').trim();
 }).filter(Boolean).join('\n\n'));
 return {
  text,
  warning:'Đã nhập văn bản Word để kiểm tra. Hình ảnh, công thức dạng Equation/MathType và bố cục bảng có thể chưa được giữ nguyên; hãy đối chiếu sách gốc trước khi duyệt.'
 };
}

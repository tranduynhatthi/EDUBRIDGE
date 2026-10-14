import type {LessonResult} from '@/lib/schema';

/**
 * A deterministic, source-only teaching scaffold. Never invents a translated
 * fact, answers, or other subject content. NOT a substitute for Gemini.
 */
export function makeOfflineLesson(title:string,sourceText:string):LessonResult{
 const clean=sourceText.normalize('NFC').replace(/\u0000/g,'').trim();
 if(clean.length<250||clean.length>25000)throw new Error('INVALID_OFFLINE_SOURCE');
 const snippets=clean.split(/\n+/).map(s=>s.trim()).filter(s=>s.length>25).flatMap(s=>{
  const values:string[]=[];for(let i=0;i<s.length;i+=170)values.push(s.slice(i,i+170));
  return values;
 }).slice(0,45);
 const parts=snippets.length?snippets:["Nội dung nguồn cần được giáo viên xem xét trong phần mô tả bài."];
 const group=(offset:number,limit=3)=>parts.slice(offset,offset+limit);
 const slides:LessonResult['slides']=[
  {title:'Lesson introduction (draft)',bullets:['Bài học: '+title,'Nguồn: học liệu do giáo viên chọn.','Kiểm tra kiến thức và dịch các ý chính trước khi dạy.'],teacherScript:'Today we will explore this lesson. Please review the source with your teacher before using these slides.'},
  {title:'Learning goals (to review)',bullets:['Xác định các kiến thức trọng tâm trong nguồn.','Luyện giải thích các khái niệm bằng ngôn ngữ phù hợp.','Kiểm tra và chỉnh sửa mục tiêu trước tiết dạy.'],teacherScript:'By the end of this lesson, you should be able to describe key ideas from the source. We will review them together.'},
  ...[0,3,6,9].map((start,i)=>({
   title:'Source notes '+(i+1)+' (draft)',
   bullets:group(start).length?group(start):['Không còn đoạn nguồn ở mục này; giáo viên bổ sung kiến thức đã kiểm chứng.'],
   teacherScript:'Please read these excerpts from the Vietnamese source. The teacher will verify and explain their English meaning.'
  })),
  {title:'Discussion and guided practice',bullets:['Đặt câu hỏi dựa trên phần nguồn đã được kiểm chứng.','Thảo luận theo cặp và ghi lại lời giải thích.','Giáo viên bổ sung ví dụ và đáp án phù hợp.'],teacherScript:'Work with a partner. Discuss the lesson topic and use examples that your teacher has checked.'},
  {title:'Summary and review',bullets:['Tóm tắt các ý đã học từ nguồn.','Kiểm tra thuật ngữ, công thức, dữ kiện trước khi ghi nhớ.','Hoàn thành phần câu hỏi sau khi giáo viên biên tập.'],teacherScript:'Let us review the main ideas. Please check your notes and ask questions before the lesson ends.'}
 ];
 const classroomPhrases=[
  ['Please read the source carefully.','Hãy đọc kĩ nguồn học liệu.'],
  ['What do you notice?','Em quan sát hoặc nhận thấy điều gì?'],
  ['Can you explain your answer?','Em có thể giải thích câu trả lời không?'],
  ['Work in pairs and discuss.','Làm việc theo cặp và thảo luận.'],
  ['Let us compare our ideas.','Chúng ta cùng so sánh ý kiến.'],
  ['Please check your answers.','Hãy kiểm tra câu trả lời.']
 ].map(([english,vietnamese])=>({english,vietnamese}));
 const quiz=Array.from({length:5},(_,i)=>({
  questionEn:'[CHƯA_SOẠN] Viết câu hỏi bằng tiếng Anh số '+(i+1)+' dựa trên nguồn.',
  choices:['[CHƯA_SOẠN] Đáp án đúng','[CHƯA_SOẠN] Phương án B','[CHƯA_SOẠN] Phương án C','[CHƯA_SOẠN] Phương án D'],
  correctIndex:0,
  explanationVi:'[CHƯA_SOẠN] Điền lời giải và dẫn chứng nguồn.'
 }));
 return {
  lessonTitleEn:'Draft: '+title,
  contentObjectives:['Xác định kiến thức cốt lõi từ nguồn','Giải thích nội dung sau khi đã hậu kiểm'],
  languageObjectives:['Practise explaining the topic in English','Ask and answer questions using verified subject terms'],
  keyConcepts:[],vocabulary:[],classroomPhrases,slides,quiz,
  qualityWarnings:[
   'ĐÂY LÀ BẢN KHUNG TỰ ĐỘNG, KHÔNG DÙNG AI. Không phải bài dạy tiếng Anh hoàn chỉnh.',
   'Các đoạn nguồn tiếng Việt chưa được dịch; không tự suy diễn khái niệm ngoài văn bản.',
   'Phải sửa mọi mục [CHƯA_SOẠN], tạo đáp án có căn cứ và kiểm tra kiến thức trước khi duyệt/giao bài.',
   'Bộ khung chỉ hiển thị trích đoạn nguồn chọn lọc; cần mở nguồn đầy đủ để đối chiếu.'
  ]
 };
}

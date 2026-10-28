import PptxGenJS from 'pptxgenjs';
import type {LessonResult} from '@/lib/schema';
import {makeTeachingVisual} from './lesson-visuals.ts';
import {synthesizeEnglishPronunciation} from './pronunciation-audio.ts';
import {getSubjectTeachingGuide} from './emi-clil-prompt.ts';

export type SlideKind='cover'|'objectives'|'warmup'|'concept'|'process'|'comparison'|'diagram'|'formula'|'example'|'activity'|'quiz'|'summary'|'homework';
export type DeckInfo={title:string;subject:string;grade:string;level?:string;classroomPhrases?:LessonResult['classroomPhrases']};
type Slide=ReturnType<PptxGenJS['addSlide']>;
type ContentSlide=LessonResult['slides'][number];
const W=13.333,H=7.5;
const C={orange:'EA580C',deep:'9A3412',coral:'F97316',soft:'FFEDD5',cream:'FFFBF7',paper:'FFFFFF',line:'FED7AA',dark:'292524',ink:'44403C',muted:'78716C',amber:'FDBA74'};
const font='Aptos',display='Aptos Display';
function txt(s:Slide,value:string,x:number,y:number,w:number,h:number,extra:Record<string,unknown>={}){
 s.addText(value,{x,y,w,h,fontFace:font,fontSize:20,color:C.dark,margin:0,breakLine:false,...extra} as Parameters<Slide['addText']>[1]);
}
function rect(s:Slide,x:number,y:number,w:number,h:number,fill:string,round=false,stroke?:string){
 s.addShape((round?'roundRect':'rect') as Parameters<Slide['addShape']>[0],{x,y,w,h,rectRadius:0.17,line:{color:stroke||fill,width:stroke?0.8:0},fill:{color:fill}} as Parameters<Slide['addShape']>[1]);
}
function ellipse(s:Slide,x:number,y:number,d:number,fill:string){
 s.addShape('ellipse' as Parameters<Slide['addShape']>[0],{x,y,w:d,h:d,line:{color:fill,width:0},fill:{color:fill}} as Parameters<Slide['addShape']>[1]);
}
function divider(s:Slide,x:number,y:number,w:number,color:string=C.line){
 rect(s,x,y,w,0.017,color);
}
function eyebrow(s:Slide,value:string,x:number,y:number,w:number,color=C.orange){
 txt(s,value.toUpperCase(),x,y,w,0.26,{fontSize:10.5,bold:true,charSpacing:1.4,color,fit:'shrink'});
}
function brief(value:unknown,limit=150){const t=String(value??'').trim();return t.length>limit?t.slice(0,limit-1).trimEnd()+'…':t;}
function bullets(s:Slide,items:string[],x:number,y:number,w:number,gap=0.88){
 items.filter(Boolean).slice(0,4).forEach((item,i)=>{
  ellipse(s,x,y+i*gap+0.08,0.43,i%2===0?C.orange:C.soft);
  txt(s,String(i+1),x,y+i*gap+0.17,0.43,0.18,{fontSize:11,bold:true,color:i%2===0?C.paper:C.deep,align:'center'});
  txt(s,brief(item,150),x+0.67,y+i*gap,w-0.7,0.70,{fontSize:18.2,fit:'shrink'});
 });
}
function shell(pptx:PptxGenJS,info:DeckInfo,section:string,index:number,total:number){
 const s=pptx.addSlide();s.background={color:C.cream};
 rect(s,0,0,W,0.095,C.orange);
 eyebrow(s,'EDUBRIDGE   /   SLIDE STUDIO',0.72,0.35,5.9);
 txt(s,info.subject+'  ·  GRADE '+info.grade,9.05,0.34,3.54,0.24,{fontSize:10.8,color:C.muted,align:'right'});
 divider(s,0.73,6.98,11.87);
 eyebrow(s,section,0.74,7.11,8,C.muted);
 txt(s,String(index).padStart(2,'0')+' / '+String(total).padStart(2,'0'),11.45,7.10,1.16,0.24,{fontSize:10.5,color:C.muted,align:'right'});
 return s;
}
function head(s:Slide,title:string,tag:string){
 eyebrow(s,tag,0.75,0.86,9.7);
 txt(s,brief(title,130),0.72,1.21,11.85,0.81,{fontFace:display,fontSize:30.5,bold:true,color:C.dark,fit:'shrink'});
}
const classroomTalk:Record<string,[string,string][]> = {
 cover:[['Good morning! Today we will explore a new topic.','Chào buổi sáng! Hôm nay chúng ta tìm hiểu một chủ đề mới.'],['What do you already know about this topic?','Các em đã biết gì về chủ đề này?'],['Let us begin with a question.','Chúng ta bắt đầu bằng một câu hỏi.']],
 objectives:[['By the end of this lesson, you will be able to explain the main ideas.','Cuối bài học, các em có thể giải thích các ý chính.'],['Please read the learning goals.','Hãy đọc các mục tiêu bài học.'],['Which goal is most challenging?','Mục tiêu nào khó nhất?']],
 visual:[['Look carefully at this diagram.','Hãy quan sát kĩ sơ đồ này.'],['What can you see?','Các em nhìn thấy điều gì?'],['The diagram is simplified. Can you connect it to the text?','Sơ đồ đã được đơn giản hóa. Em có thể liên hệ với nội dung bài không?']],
 concept:[['Please look at the key idea.','Hãy nhìn vào ý chính.'],['Can you explain this in your own words?','Em có thể giải thích theo cách hiểu của mình không?'],['What evidence from the lesson supports your answer?','Chi tiết nào trong bài hỗ trợ câu trả lời?']],
 vocabulary:[['Listen and repeat after me.','Hãy nghe và lặp lại theo giáo viên.'],['Use this word in a complete sentence.','Hãy dùng từ này trong một câu hoàn chỉnh.'],['What is the Vietnamese meaning?','Nghĩa tiếng Việt là gì?']],
 quiz:[['Read all the options before you answer.','Hãy đọc tất cả phương án trước khi trả lời.'],['Why did you choose that option?','Tại sao em chọn phương án đó?'],['Let us check the answer together.','Chúng ta cùng kiểm tra đáp án.']],
 summary:[['Let us summarise the lesson.','Chúng ta cùng tổng kết bài.'],['What are the three most important ideas?','Ba ý quan trọng nhất là gì?'],['Do you have any questions?','Các em có câu hỏi nào không?']],
 homework:[['Please review your notes at home.','Hãy xem lại ghi chép ở nhà.'],['Prepare one question for the next lesson.','Hãy chuẩn bị một câu hỏi cho bài sau.'],['Thank you for your participation today.','Cảm ơn các em đã tham gia học hôm nay.']]
};
function speakerNotes(item:ContentSlide):string {
 const lines=[item.teacherScript||''];
 if(item.timingMinutes)lines.push('', 'TIMING / THỜI LƯỢNG: '+item.timingMinutes+' minute(s)');
 if(item.classroomEnglish?.length)lines.push('', 'CLASSROOM INSTRUCTIONS FOR THIS SLIDE',...item.classroomEnglish.map(x=>'• '+x));
 if(item.expectedStudentResponses?.length)lines.push('', 'EXPECTED STUDENT RESPONSES / CÂU TRẢ LỜI DỰ KIẾN',...item.expectedStudentResponses.map(x=>'• '+x));
 if(item.pronunciationGuide?.trim())lines.push('', 'PRONUNCIATION / PHÁT ÂM',item.pronunciationGuide);
 return lines.join('\\n');
}
function note(s:Slide,words:string,info?:DeckInfo,phase='concept',index=0){
 const bank=classroomTalk[phase]??classroomTalk.concept;
 const source=info?.classroomPhrases??[];
 const selected=source.length?Array.from({length:Math.min(3,source.length)},(_,j)=>source[(index+j*2)%source.length]):[];
 const lines=[
  "TEACHER'S SCRIPT / KỊCH BẢN GIẢNG",
  String(words||'').slice(0,2750),
  '',
  'CLASSROOM ENGLISH / CÂU GIAO TIẾP GỢI Ý'
 ];
 for(const [en,vi] of bank)lines.push('• '+en+' — '+vi);
 if(selected.length){
  lines.push('', 'LESSON-SPECIFIC PHRASES / CÂU GIAO TIẾP CỦA BÀI');
  for(const p of selected)lines.push('• '+p.english+' — '+p.vietnamese);
 }
 lines.push('', 'TRANSITION / CHUYỂN Ý', '• Now, let us move on to the next part. — Bây giờ, chúng ta chuyển sang phần tiếp theo.');
 s.addNotes(lines.join('\n').slice(0,4300));
}

function strip(s:Slide,label:string,text:string,y=6.04){
 rect(s,0.75,y,11.83,0.57,C.soft,true);
 eyebrow(s,label,0.96,y+0.17,1.85,C.deep);
 txt(s,brief(text,165),2.73,y+0.08,9.54,0.39,{fontSize:13.6,bold:true,color:C.deep,fit:'shrink'});
}
function tile(s:Slide,x:number,y:number,w:number,h:number,title:string,body:string,i:number){
 rect(s,x,y,w,h,C.paper,true,C.line);
 rect(s,x,y,0.095,h,C.orange);
 ellipse(s,x+0.28,y+0.25,0.46,C.soft);
 txt(s,String(i).padStart(2,'0'),x+0.28,y+0.36,0.46,0.17,{fontSize:10.5,color:C.deep,bold:true,align:'center'});
 eyebrow(s,title,x+0.89,y+0.34,w-1.15);
 txt(s,brief(body,190),x+0.31,y+0.97,w-0.63,h-1.21,{fontSize:18,fit:'shrink',valign:'top'});
}

function illustration(pptx:PptxGenJS,info:DeckInfo,item:ContentSlide,kind:SlideKind,i:number,total:number,used:Set<string>){
 const s=shell(pptx,info,'SUBJECT VISUAL',i,total);
 head(s,'Visual explanation: '+item.title,'OBSERVE / EXPLAIN / DISCUSS');
 const image=makeTeachingVisual({subject:info.subject,lessonTitle:info.title,item,kind,used});
 rect(s,0.74,2.18,11.85,4.37,C.paper,true,C.line);
 s.addImage({data:image.data,x:0.97,y:2.33,w:11.38,h:3.96});
 txt(s,'SCHEMATIC • FOR TEACHER REVIEW • NOT A TEXTBOOK PHOTO',0.87,6.64,11.6,0.24,{fontSize:10.7,color:C.muted,bold:true});
 note(s,speakerNotes(item)+'\n\nVISUAL GUIDE: '+image.caption+
 '\nILLUSTRATION SUGGESTION FROM LESSON: '+(item.visualSuggestion||'Not specified')+
 '\nReview source facts, labels, units and diagram accuracy before teaching.',info,'visual',i);
}
function cover(pptx:PptxGenJS,info:DeckInfo,result:LessonResult){
 const s=pptx.addSlide();s.background={color:C.cream};
 rect(s,7.50,0,5.833,H,C.orange);rect(s,7.50,0,0.15,H,C.amber);
 eyebrow(s,'EDUBRIDGE  /  EMI + CLIL',0.78,0.66,6.2);
 rect(s,0.76,1.30,2.4,0.43,C.soft,true);
 txt(s,info.subject.toUpperCase()+'  ·  '+info.grade,0.92,1.40,2.07,0.18,{fontSize:11,bold:true,color:C.deep,fit:'shrink'});
 txt(s,brief(result.lessonTitleEn||info.title,130),0.77,2.08,6.14,2.34,{fontFace:display,fontSize:46,bold:true,fit:'shrink',valign:'top'});
 txt(s,'Explore  ·  Think  ·  Explain',0.78,5.31,5.8,0.46,{fontSize:21,color:C.orange,bold:true});
 divider(s,0.78,6.36,5.88);
 eyebrow(s,'SUBJECT + LANGUAGE + DISCOVERY',0.79,6.57,6.2,C.muted);
 // Decorative vector particles; not a claimed molecular model.
 const coords=[[8.30,1.34,0.88],[10.44,1.12,0.58],[11.52,2.86,1.12],[8.89,4.38,1.32],[11.17,5.57,0.63]];
 coords.forEach(([x,y,d],i)=>{ellipse(s,x,y,d,i%2?C.amber:C.soft);ellipse(s,x+d*0.33,y+d*0.33,d*0.34,C.orange);});
 rect(s,9.1,2.27,2.18,0.035,C.amber);rect(s,9.89,4.13,2.0,0.035,C.amber);
 eyebrow(s,'LEARN THROUGH DISCOVERY',8.20,6.69,4.6,C.paper);
 note(s,'Introduce the topic, the learning challenge and the source limitations.',info,'cover',1);
}
function objectives(pptx:PptxGenJS,info:DeckInfo,result:LessonResult,i:number,t:number){
 const s=shell(pptx,info,'LEARNING OBJECTIVES',i,t);head(s,'What will we learn today?','CONTENT + LANGUAGE');
 const sets=[['CONTENT OBJECTIVES',result.contentObjectives],['LANGUAGE OBJECTIVES',result.languageObjectives]] as const;
 sets.forEach(([title,values],k)=>{
  const x=0.75+6.04*k;rect(s,x,2.35,5.77,3.78,C.paper,true,C.line);rect(s,x,2.35,5.77,0.13,k?C.deep:C.orange);
  eyebrow(s,title,x+0.33,2.72,5.05,k?C.deep:C.orange);
  bullets(s,values,x+0.32,3.22,5.04,0.86);
 });
 note(s,'Explain content and language objectives. Confirm language support for students.',info,'objectives',i);
}
function warmup(pptx:PptxGenJS,info:DeckInfo,item:ContentSlide,i:number,t:number){
 const s=shell(pptx,info,'ENGAGE',i,t);head(s,item.title,'WARM-UP / PREDICT');
 rect(s,0.74,2.41,7.35,3.26,C.orange,true);
 eyebrow(s,'THE BIG QUESTION',1.09,2.82,6.4,C.paper);
 txt(s,brief(item.keyMessage||item.bullets[0]||item.title,230),1.07,3.32,6.64,1.88,{fontFace:display,fontSize:31,bold:true,color:C.paper,fit:'shrink',valign:'top'});
 rect(s,8.37,2.41,4.20,3.26,C.paper,true,C.line);
 ['PREDICT','DISCUSS','EXPLAIN'].forEach((a,k)=>{ellipse(s,8.74,2.87+k*0.84,0.46,k===1?C.orange:C.soft);
 txt(s,String(k+1),8.74,2.99+k*0.84,0.46,0.16,{fontSize:11,bold:true,align:'center',color:k===1?C.paper:C.deep});
 txt(s,a,9.46,2.90+k*0.84,2.74,0.37,{fontSize:20,bold:true});});
 strip(s,'PAIR TALK',item.studentTask||'Share your prediction with a partner.');
 note(s,speakerNotes(item),info,'concept',i);
}
function concept(pptx:PptxGenJS,info:DeckInfo,item:ContentSlide,i:number,t:number){
 const s=shell(pptx,info,'EXPLORE',i,t);head(s,item.title,'KEY CONCEPT');
 rect(s,0.74,2.41,5.09,3.47,C.deep,true);
 eyebrow(s,'BIG IDEA',1.07,2.79,4.35,C.amber);
 txt(s,brief(item.keyMessage||item.bullets[0]||item.title,220),1.08,3.30,4.38,1.76,{fontFace:display,fontSize:28,bold:true,color:C.paper,fit:'shrink'});
 txt(s,'OBSERVE  ·  CONNECT  ·  EXPLAIN',1.08,5.38,4.37,0.22,{fontSize:11,bold:true,color:C.amber});
 bullets(s,item.bullets,6.30,2.65,5.9,0.90);
 strip(s,'CHECKPOINT','Explain one key idea in your own words.');
 note(s,speakerNotes(item),info,'concept',i);
}
function process(pptx:PptxGenJS,info:DeckInfo,item:ContentSlide,i:number,t:number){
 const s=shell(pptx,info,'EXPLORE THE PROCESS',i,t);head(s,item.title,'STEP-BY-STEP');
 const values=item.bullets.filter(Boolean).slice(0,4);const n=Math.max(1,values.length);
 const gap=0.24,w=(11.84-(n-1)*gap)/n;
 values.forEach((v,k)=>{
  const x=0.75+k*(w+gap);rect(s,x,2.49,w,3.18,C.paper,true,C.line);
  rect(s,x,2.49,w,0.15,k%2?C.deep:C.orange);
  ellipse(s,x+0.30,2.96,0.69,C.soft);
  txt(s,String(k+1).padStart(2,'0'),x+0.3,3.16,0.69,0.24,{fontSize:17,bold:true,color:C.deep,align:'center'});
  txt(s,brief(v,180),x+0.29,4.02,w-0.55,1.26,{fontSize:18,fit:'shrink',valign:'top'});
  if(k<n-1)txt(s,'→',x+w-0.12,3.53,0.44,0.37,{fontSize:22,bold:true,color:C.orange});
 });
 strip(s,'REFLECT','Which step needs the strongest evidence?');
 note(s,speakerNotes(item),info,'concept',i);
}
function comparison(pptx:PptxGenJS,info:DeckInfo,item:ContentSlide,i:number,t:number){
 const s=shell(pptx,info,'COMPARE',i,t);head(s,item.title,'SPOT THE DIFFERENCES');
 const values=item.bullets.filter(Boolean).slice(0,3);if(!values.length)values.push(item.keyMessage||item.title);
 const gap=0.23,w=(11.84-(values.length-1)*gap)/values.length;
 values.forEach((v,k)=>tile(s,0.75+k*(w+gap),2.45,w,3.24,'FEATURE '+(k+1),v,k+1));
 strip(s,'QUESTION','What is similar and what is different?');
 note(s,speakerNotes(item),info,'concept',i);
}
function diagram(pptx:PptxGenJS,info:DeckInfo,item:ContentSlide,i:number,t:number){
 const s=shell(pptx,info,'CONCEPT MAP',i,t);head(s,item.title,'CONNECT THE IDEAS');
 const parts=item.bullets.filter(Boolean).slice(0,4);
 const positions=[[0.78,2.42],[9.08,2.42],[0.78,4.37],[9.08,4.37]];
 rect(s,4.62,3.16,4.10,1.16,C.orange,true);
 txt(s,brief(item.keyMessage||item.title,100),4.90,3.37,3.56,0.69,{fontSize:21,bold:true,color:C.paper,align:'center',fit:'shrink'});
 parts.forEach((v,k)=>{const [x,y]=positions[k];rect(s,x,y,3.48,1.31,C.paper,true,C.line);
 txt(s,brief(v,140),x+0.20,y+0.15,3.08,0.98,{fontSize:15.9,bold:true,align:'center',fit:'shrink'});});
 eyebrow(s,'EDITABLE VISUAL / TEACHER SHOULD VERIFY LINKS',0.75,6.40,10,C.muted);
 note(s,speakerNotes(item),info,'concept',i);
}
function formula(pptx:PptxGenJS,info:DeckInfo,item:ContentSlide,i:number,t:number){
 const s=shell(pptx,info,'QUANTITATIVE REASONING',i,t);head(s,item.title,'FORMULA + SYMBOLS');
 const options=[item.formula||'',...item.bullets].filter(Boolean);
 const equation=options.find(x=>/[=≈∝]/.test(x)&&x.length<=170);
 if(!equation){bullets(s,item.bullets,1.03,2.61,11.13);strip(s,'VERIFY','No equation verified in source; add it manually.');note(s,speakerNotes(item),info,'concept',i);return;}
 rect(s,0.74,2.42,8.03,2.43,C.deep,true);
 eyebrow(s,'EQUATION IN SOURCE',1.08,2.84,7,C.amber);
 txt(s,brief(equation,170),1.08,3.40,7.36,0.90,{fontFace:display,fontSize:33,bold:true,color:C.paper,align:'center',fit:'shrink'});
 rect(s,9.08,2.42,3.49,2.43,C.paper,true,C.line);
 eyebrow(s,'CHECK FIRST',9.32,2.86,2.9);
 txt(s,'Symbols\nUnits\nConditions',9.32,3.32,2.8,1.13,{fontSize:19,bold:true,color:C.ink});
 item.bullets.filter(x=>x!==equation).slice(0,3).forEach((v,k)=>{const x=0.74+k*4.04;rect(s,x,5.12,3.77,0.88,C.paper,true,C.line);txt(s,brief(v,114),x+0.2,5.22,3.32,0.64,{fontSize:14.0,fit:'shrink'});});
 note(s,speakerNotes(item)+'\nVerify mathematical meaning, SI units and sign conventions.',info,'concept',i);
}
function example(pptx:PptxGenJS,info:DeckInfo,item:ContentSlide,i:number,t:number){
 const s=shell(pptx,info,'APPLY',i,t);head(s,item.title,'EXAMPLE + REASONING');
 rect(s,0.74,2.42,3.48,3.40,C.soft,true);
 eyebrow(s,'THE TASK',1.09,2.81,2.8);
 txt(s,brief(item.keyMessage||item.bullets[0]||item.title,220),1.08,3.28,2.84,1.69,{fontFace:display,fontSize:22,bold:true,color:C.deep,fit:'shrink'});
 rect(s,4.55,2.42,8.02,3.4,C.paper,true,C.line);eyebrow(s,'WORK IT OUT',4.91,2.80,7.1);
 bullets(s,item.bullets,4.90,3.23,7.12,0.70);
 strip(s,'EXPLAIN','Show the evidence or calculations and check units.');
 note(s,speakerNotes(item),info,'concept',i);
}
function activity(pptx:PptxGenJS,info:DeckInfo,item:ContentSlide,i:number,t:number){
 const s=shell(pptx,info,'COLLABORATE',i,t);head(s,item.title,'LEARN BY DOING');
 rect(s,0.74,2.44,7.18,3.37,C.paper,true,C.line);eyebrow(s,'YOUR MISSION',1.08,2.82,6.44);
 txt(s,brief(item.studentTask||item.keyMessage||item.bullets[0]||item.title,225),1.07,3.27,6.30,1.75,{fontFace:display,fontSize:26,bold:true,fit:'shrink'});
 rect(s,8.22,2.44,4.35,3.37,C.orange,true);
 ['THINK','SHARE','EXPLAIN'].forEach((word,k)=>{txt(s,String(k+1).padStart(2,'0'),8.62,2.91+k*0.84,0.73,0.34,{fontSize:18,bold:true,color:C.soft});
 txt(s,word,9.54,2.87+k*0.84,2.65,0.45,{fontSize:23,bold:true,color:C.paper});});
 strip(s,'TEAMWORK','Support claims with evidence from the lesson.');
 note(s,speakerNotes(item),info,'concept',i);
}
function vocabulary(pptx:PptxGenJS,info:DeckInfo,terms:LessonResult['vocabulary'],i:number,t:number,audio?:Buffer|null){
 const s=shell(pptx,info,'VOCABULARY / LISTEN & REPEAT',i,t);head(s,'Learn the language of '+getSubjectTeachingGuide(info.subject).english,'HEAR / SAY / UNDERSTAND');
 terms.slice(0,6).forEach((v,k)=>{const x=0.74+(k%2)*6.07,y=2.25+Math.floor(k/2)*1.22;
  rect(s,x,y,5.77,1.12,C.paper,true,C.line);rect(s,x,y,0.09,1.12,C.orange);
  txt(s,brief(v.termEn,60),x+0.25,y+0.09,4.95,0.32,{fontSize:18,bold:true,color:C.deep,fit:'shrink'});
  txt(s,brief((v.ipa?v.ipa+'  •  ':'')+v.termVi,90),x+0.25,y+0.46,5.02,0.25,{fontSize:12.6,color:C.ink,fit:'shrink'});
  txt(s,brief(v.definitionEn,125),x+0.25,y+0.75,5.11,0.26,{fontSize:11.3,color:C.muted,fit:'shrink'});
 });
 if(audio){
  s.addMedia({type:'audio',data:'audio/wav;base64,'+audio.toString('base64'),extn:'wav',x:10.65,y:1.40,w:1.14,h:0.60});
  eyebrow(s,'CLICK AUDIO ▶',9.12,1.73,1.75,C.orange);
 }else{
  txt(s,'AUDIO UNAVAILABLE – PRACTISE ON EDUBRIDGE WEB',8.10,1.87,4.37,0.22,{fontSize:10.2,bold:true,color:C.muted,align:'right'});
 }
 strip(s,'SPEAK','Listen → Repeat → Explain the meaning with a partner.',6.20);
 note(s,'Say each English term slowly and let students repeat twice. Pause for students to explain the meaning. '+
   (audio?'Click the embedded audio object to play the model voice offline.':'Audio could not be embedded in this export; use the web pronunciation buttons.')+
   '\n'+terms.map(v=>v.termEn+(v.ipa?' ('+v.ipa+')':'')+' – '+v.termVi+'. '+v.definitionEn+' Example: '+v.exampleEn).join('\n'),info,'vocabulary',i);
}
function vocabularyPractice(pptx:PptxGenJS,info:DeckInfo,terms:LessonResult['vocabulary'],i:number,t:number){
 const s=shell(pptx,info,'VOCABULARY PRACTICE',i,t);head(s,'Use the new subject words','PAIR WORK / SPEAKING');
 const words=terms.slice(0,6);
 rect(s,0.74,2.27,11.84,1.01,C.soft,true);
 txt(s,'WORD BANK  •  '+brief(words.map(v=>v.termEn).join('  ·  '),180),1.02,2.48,11.25,0.54,{fontSize:18,bold:true,color:C.deep,fit:'shrink'});
 tile(s,0.74,3.53,3.78,2.20,'MATCH','Match each English term with its meaning in this subject.',1);
 tile(s,4.77,3.53,3.78,2.20,'SAY','Choose two new words. Say each word, then use it in a sentence.',2);
 tile(s,8.80,3.53,3.78,2.20,'EXPLAIN','With a partner, explain a subject concept using two new terms.',3);
 strip(s,'SENTENCE','“I can explain … because …”  ·  “The term … means …”',6.12);
 note(s,'Read the words aloud first, ask students to repeat, then let pairs practise. Check pronunciation and subject knowledge. '
  +words.map(v=>v.termEn+': '+v.definitionEn+' Example: '+v.exampleEn).join('\n'),info,'vocabulary',i);
}
function quiz(pptx:PptxGenJS,info:DeckInfo,q:LessonResult['quiz'][number],k:number,i:number,t:number){
 const s=shell(pptx,info,'CHECK FOR UNDERSTANDING',i,t);head(s,'Quick check '+k,'THINK / CHOOSE / EXPLAIN');
 rect(s,0.74,2.29,11.84,1.06,C.orange,true);
 txt(s,brief(q.questionEn,280),1.05,2.44,11.20,0.72,{fontFace:display,fontSize:22,bold:true,color:C.paper,fit:'shrink'});
 q.choices.slice(0,4).forEach((v,j)=>{const x=0.74+(j%2)*6.06,y=3.67+Math.floor(j/2)*1.14;
 rect(s,x,y,5.80,0.92,C.paper,true,C.line);ellipse(s,x+0.18,y+0.20,0.49,C.soft);
 txt(s,String.fromCharCode(65+j),x+0.18,y+0.33,0.49,0.17,{fontSize:12,bold:true,color:C.deep,align:'center'});
 txt(s,brief(v,178),x+0.87,y+0.12,4.65,0.66,{fontSize:16.5,fit:'shrink'});});
 eyebrow(s,'JUSTIFY YOUR ANSWER USING EVIDENCE',0.84,6.32,9.5);
 note(s,'TEACHER ONLY. Answer: '+String.fromCharCode(65+q.correctIndex)+'. '+q.explanationVi,info,'quiz',i);
}
function summary(pptx:PptxGenJS,info:DeckInfo,result:LessonResult,i:number,t:number){
 const s=shell(pptx,info,'CONSOLIDATE',i,t);head(s,'What have we learned?','KEY TAKEAWAYS');
 result.contentObjectives.slice(0,3).forEach((v,k)=>tile(s,0.75+k*4.02,2.56,3.76,2.87,'TAKEAWAY '+(k+1),v,k+1));
 strip(s,'EXIT TICKET','Explain one key idea in English using your own words.');
 note(s,'Review key objectives and identify misconceptions based on the approved material.',info,'summary',i);
}
function homework(pptx:PptxGenJS,info:DeckInfo,i:number,t:number){
 const s=shell(pptx,info,'CONTINUE LEARNING',i,t);head(s,'Keep exploring','REFLECT / PRACTISE');
 ['Review the core ideas','Use key terms in English','Prepare one question for the next lesson'].forEach((v,k)=>tile(s,0.75+k*4.02,2.58,3.76,2.84,'NEXT STEP',v,k+1));
 eyebrow(s,'SEE YOU IN THE NEXT LESSON',0.83,6.26,11.4);
 note(s,'Adapt homework to the source and local learning objectives.',info,'homework',i);
}
export function classifySlide(slide:ContentSlide,index:number,total:number):SlideKind{
 if(slide.slideType)return slide.slideType as SlideKind;
 const title=slide.title.toLowerCase();
 if(/formula|equation|công thức|định luật|law of/.test(title))return 'formula';
 if(/comparison|compare|so sánh|difference/.test(title))return 'comparison';
 if(/process|steps|cycle|quy trình|chu trình/.test(title))return 'process';
 if(/activity|discussion|thí nghiệm|hoạt động/.test(title))return 'activity';
 if(/example|practice|ví dụ|bài tập/.test(title))return 'example';
 if(/diagram|sơ đồ|structure|cấu trúc/.test(title))return 'diagram';
 if(index===0)return 'warmup';
 if(index===total-1)return 'concept';
 return index%3===0?'concept':index%3===1?'process':'comparison';
}
// A checkpoint follows the nearest lesson slide; all saved quiz questions stay in the deck.
export function quizAfterSlideIndex(quizIndex:number,slideCount:number,quizCount:number):number{
 if(slideCount<=0)return -1;
 return Math.min(slideCount-1,Math.max(0,Math.ceil((quizIndex+1)*slideCount/(quizCount+1))-1));
}
export async function buildBeautifulDeck(result:LessonResult,info:DeckInfo,options?:{pronunciationGenerator?:(words:string)=>Promise<Buffer|null>}):Promise<Buffer>{
 info={...info,classroomPhrases:result.classroomPhrases};
 const pptx=new PptxGenJS();pptx.layout='LAYOUT_WIDE';pptx.author='EDUBRIDGE';
 pptx.subject=info.subject+' · Grade '+info.grade+' · EMI/CLIL';pptx.title=info.title;
 const slideItems=result.slides.slice(0,result.durationMinutes===90?14:10);
 const vocabularyGroups:LessonResult['vocabulary'][]=[];
 for(let i=0;i<Math.min(result.vocabulary.length,12);i+=6)vocabularyGroups.push(result.vocabulary.slice(i,i+6));
 const qs=result.quiz.slice(0,30);
 const illustratedIndexes=slideItems.map((_,i)=>i).filter(i=>classifySlide(slideItems[i],i,slideItems.length)!=='summary').slice(0,result.durationMinutes===90?6:4);
 const total=1+1+slideItems.length+illustratedIndexes.length+vocabularyGroups.length+(vocabularyGroups.length?1:0)+qs.length+2;
 const generateAudio=options?.pronunciationGenerator??synthesizeEnglishPronunciation;
 const vocabularyAudio=await Promise.all(vocabularyGroups.map(terms=>generateAudio(terms.map(x=>x.termEn).join('. '))));
 const usedIllustrations=new Set<string>();
 cover(pptx,info,result);let page=2;
 objectives(pptx,info,result,page++,total);
 vocabularyGroups.forEach((v,k)=>vocabulary(pptx,info,v,page++,total,vocabularyAudio[k]));
 if(vocabularyGroups.length)vocabularyPractice(pptx,info,vocabularyGroups[0],page++,total);
 slideItems.forEach((item,idx)=>{const kind=classifySlide(item,idx,slideItems.length);
  if(kind==='warmup')warmup(pptx,info,item,page++,total);
  else if(kind==='process')process(pptx,info,item,page++,total);
  else if(kind==='comparison')comparison(pptx,info,item,page++,total);
  else if(kind==='diagram')diagram(pptx,info,item,page++,total);
  else if(kind==='formula')formula(pptx,info,item,page++,total);
  else if(kind==='example')example(pptx,info,item,page++,total);
  else if(kind==='activity')activity(pptx,info,item,page++,total);
  else concept(pptx,info,item,page++,total);
  if(illustratedIndexes.includes(idx))illustration(pptx,info,item,kind,page++,total,usedIllustrations);
  // Embed quiz checkpoints within the teaching sequence, not as a separate section.
  qs.forEach((q,k)=>{if(quizAfterSlideIndex(k,slideItems.length,qs.length)===idx)quiz(pptx,info,q,k+1,page++,total);});
 });
 if(slideItems.length===0)qs.forEach((q,k)=>quiz(pptx,info,q,k+1,page++,total));
 summary(pptx,info,result,page++,total);homework(pptx,info,page++,total);
 const out=await pptx.write({outputType:'nodebuffer'});
 return Buffer.isBuffer(out)?out:Buffer.from(out as ArrayBuffer);
}

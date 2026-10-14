import PptxGenJS from 'pptxgenjs';
import {LessonResultSchema} from '@/lib/schema';
import {requireTeacher, authFailure} from '@/lib/server-auth';
export const runtime = 'nodejs';
export const maxDuration = 60;

function safeFileName(title: string) {
  return title.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9_-]+/g, '_').slice(0, 60) || 'lesson';
}

export async function POST(request: Request) {
  let context: Awaited<ReturnType<typeof requireTeacher>>;
  try { context = await requireTeacher(request); } catch (err) { return authFailure(err); }
  let id: string;
  try {id = (await request.json()).id;} catch {return Response.json({error:'Yêu cầu không hợp lệ.'},{status:400});}
  if (typeof id !== 'string' || !/^[0-9a-fA-F-]{36}$/.test(id)) return Response.json({error: 'Mã bài học không hợp lệ.'}, {status:400});
  const {data: record, error} = await context.supabase.from('lessons').select('title,grade,generated_content').eq('id',id).single();
  if (error || !record) return Response.json({error: 'Không tìm thấy bài học hoặc không có quyền truy cập.'}, {status:404});
  const parsed = LessonResultSchema.safeParse(record.generated_content);
  if (!parsed.success) return Response.json({error:'Dữ liệu bài học không hợp lệ.'}, {status:422});
  const content = parsed.data;
  try {
    const deck = new PptxGenJS();
    deck.layout = 'LAYOUT_WIDE';
    deck.author = 'EDUBRIDGE';
    deck.subject = 'Bài giảng Vật lí bằng tiếng Anh';
    deck.title = record.title;
    deck.lang = 'en-US';
    const width = 13.333, height = 7.5;
    const navy = '14254A', accent = 'E34952', muted = '667085';
    const make = (heading: string, order: number) => {
      const s = deck.addSlide();
      s.background = {color:'FFFFFF'};
      s.addShape(deck.ShapeType.rect,{x:0,y:0,w:width,h:0.14,line:{color:accent},fill:{color:accent}});
      s.addText('EDUBRIDGE', {x:0.64,y:0.36,w:3,h:0.3,fontFace:'Aptos',fontSize:14,color:accent,bold:true,margin:0});
      s.addText(heading,{x:0.64,y:0.94,w:12,h:0.7,fontFace:'Aptos Display',fontSize:29,bold:true,color:navy,margin:0,breakLine:false});
      s.addText(String(order).padStart(2,'0'),{x:12.25,y:7.08,w:0.5,h:0.2,fontSize:11,color:muted,margin:0});
      return s;
    };
    let n = 1;
    const cover = make(content.lessonTitleEn || record.title, n++);
    cover.addText(`Physics · Grade ${record.grade}  |  EMI/CLIL`,{x:0.68,y:2.27,w:11.5,h:0.65,fontSize:23,color:navy,margin:0});
    cover.addText('Teaching content reviewed and adapted by the teacher',{x:0.68,y:5.7,w:11.6,h:0.4,fontSize:15,color:muted,margin:0});
    const objectives = make('Learning Objectives',n++);
    objectives.addText(content.contentObjectives.map((o,i)=>`${i+1}. ${o}`).join('\n\n'),{x:0.85,y:2,w:11.7,h:4,fontSize:22,color:navy,margin:0,breakLine:false});
    for (let index=0;index<content.vocabulary.length;index+=6) {
      const s = make('Key Vocabulary',n++);
      s.addText(content.vocabulary.slice(index,index+6).map(v=>`${v.termEn}  —  ${v.termVi}`).join('\n\n'),{x:0.8,y:1.9,w:11.6,h:4.75,fontSize:19,color:navy,margin:0,breakLine:false});
    }
    for (const item of content.slides) {
      const s = make(item.title.slice(0,80),n++);
      s.addText(item.bullets.slice(0,6).map(v=>'•  '+v).join('\n\n'),{x:0.85,y:1.85,w:11.4,h:4.75,fontSize:20,color:navy,margin:0,breakLine:false});
      // Teacher script is stored as editable PowerPoint speaker notes.
      s.addNotes(item.teacherScript);
    }
    const finish = make('Quick Check & Reflection',n++);
    finish.addText('What did you learn today?\n\nExplain one key concept using English.\n\nComplete the quiz in EDUBRIDGE.',{x:0.9,y:2,w:11,h:3.7,fontSize:22,color:navy,margin:0});
    const output = await deck.write({outputType:'nodebuffer'});
    const buffer = Buffer.isBuffer(output) ? output : Buffer.from(output as ArrayBuffer);
    return new Response(new Uint8Array(buffer), {status:200,headers:{
      'Content-Type':'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'Content-Disposition':`attachment; filename="EDUBRIDGE_${safeFileName(record.title)}.pptx"`,
      'Cache-Control':'no-store',
    }});
  } catch (error) {
    console.error('PPTX export error', error instanceof Error ? error.message : 'unknown');
    return Response.json({error:'Không tạo được PowerPoint. Vui lòng thử lại.'},{status:500});
  }
}

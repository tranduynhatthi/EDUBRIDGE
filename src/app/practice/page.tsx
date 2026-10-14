'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import RequireLogin from '@/components/RequireLogin';
import {supabaseBrowser} from '@/lib/supabase';
import type {LessonResult} from '@/lib/schema';
import {wordMatch} from '@/lib/speech-practice';
type Phrase={en:string;vi:string;from:string};
type SpeechEvent={results:ArrayLike<{0:{transcript:string}}>;};
type SpeechApi={lang:string;continuous:boolean;interimResults:boolean;onresult:((e:SpeechEvent)=>void)|null;onerror:((e:{error:string})=>void)|null;onend:(()=>void)|null;start:()=>void;stop:()=>void};
type SpeechWindow=Window&{webkitSpeechRecognition?:new()=>SpeechApi;SpeechRecognition?:new()=>SpeechApi};
export default function Practice(){
 const [phrases,setPhrases]=useState<Phrase[]>([]),[index,setIndex]=useState(0),[transcript,setTranscript]=useState(''),[error,setError]=useState(''),[listening,setListening]=useState(false);
 const current=useRef<SpeechApi|null>(null);
 useEffect(()=>{let active=true;(async()=>{try{const {data,error}=await supabaseBrowser().from('lessons').select('title,generated_content').limit(30);if(error)throw error;
  const rows:Phrase[]=[];for(const x of data||[]){const lesson=x.generated_content as LessonResult;for(const p of lesson?.classroomPhrases||[])rows.push({en:p.english,vi:p.vietnamese,from:x.title});}
  if(active)setPhrases(rows);
 }catch(e){if(active)setError(e instanceof Error?e.message:'Không tải được dữ liệu.');}})();return()=>{active=false;};},[]);
 useEffect(()=>()=>{current.current?.stop();if('speechSynthesis'in window)speechSynthesis.cancel();},[]);
 const phrase=phrases[index],percent=useMemo(()=>phrase&&transcript?wordMatch(phrase.en,transcript):null,[phrase,transcript]);
 function play(){if(phrase&&'speechSynthesis'in window){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(phrase.en);u.lang='en-US';u.rate=.85;speechSynthesis.speak(u);}}
 function record(){if(!phrase)return;setTranscript('');setError('');const win=window as SpeechWindow;const Rec=win.SpeechRecognition||win.webkitSpeechRecognition;
  if(!Rec){setError('Trình duyệt không hỗ trợ nhận diện lời nói. Hãy thử Chrome/Edge và cấp micro.');return;}
  try{const r=new Rec();r.lang='en-US';r.continuous=false;r.interimResults=false;r.onresult=e=>setTranscript(e.results[0][0].transcript);r.onerror=e=>{setError(e.error);setListening(false);};r.onend=()=>setListening(false);current.current=r;r.start();setListening(true);}
  catch(e){setError(e instanceof Error?e.message:'Không thể mở micro.');setListening(false);}
 }
 return <RequireLogin><AppShell subtitle="Luyện nói"><h1>Luyện nói tiếng Anh cho giáo viên</h1><p>Công cụ so sánh từ ngữ được trình duyệt nhận diện, <b>không phải chấm phát âm chuẩn</b>.</p>
 <section className="white-panel"><label>Chọn câu<select style={{width:'100%'}} value={index} onChange={e=>{setIndex(Number(e.target.value));setTranscript('');}}>{phrases.map((p,i)=><option key={i} value={i}>{p.en.slice(0,80)} — {p.from}</option>)}</select></label>
 {phrase?<><h2>{phrase.en}</h2><p>{phrase.vi}</p><div className="action-row"><button type="button" className="secondary-btn" onClick={play}>▶ Nghe mẫu</button><button type="button" className="primary-btn" disabled={listening} onClick={record}>{listening?'Đang nghe…':'🎙 Đọc thử'}</button></div>{transcript&&<div className="success-note"><b>Kết quả máy nghe được:</b> {transcript}<p>Mức khớp văn bản tham khảo: {percent}% (không phản ánh chất lượng phát âm âm vị).</p></div>}</>:<p>Chưa có câu luyện nói. <Link href="/builder">Tạo và lưu bài giảng</Link> trước.</p>}
 {error&&<p className="error">{error}</p>}</section></AppShell></RequireLogin>;
}

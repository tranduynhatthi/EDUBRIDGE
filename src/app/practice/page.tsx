'use client';
import {useEffect,useRef,useState} from 'react';
import AppShell from '@/components/AppShell';
import RequireLogin from '@/components/RequireLogin';
import {authorizedFetch} from '@/lib/supabase';
import {wordMatch} from '@/lib/speech-practice';
type Phrase={english:string;vietnamese:string;teachingTip:string};
type SpeechEvent={results:ArrayLike<{0:{transcript:string}}>;};
type SpeechApi={lang:string;continuous:boolean;interimResults:boolean;onresult:((e:SpeechEvent)=>void)|null;onerror:((e:{error:string})=>void)|null;onend:(()=>void)|null;start:()=>void;stop:()=>void};
type SpeechWindow=Window&{webkitSpeechRecognition?:new()=>SpeechApi;SpeechRecognition?:new()=>SpeechApi};
export default function Practice(){
 const [query,setQuery]=useState(''),[phrase,setPhrase]=useState<Phrase|null>(null),[transcript,setTranscript]=useState(''),[working,setWorking]=useState(false),[loading,setLoading]=useState(false),[error,setError]=useState('');
 const rec=useRef<SpeechApi|null>(null),cache=useRef(new Map<string,Phrase>());
 useEffect(()=>{
  const text=query.trim(),key=text.toLowerCase();setTranscript('');
  if(text.length<2){setPhrase(null);setLoading(false);setError('');return;}
  const cached=cache.current.get(key);if(cached){setPhrase(cached);setLoading(false);setError('');return;}
  const abort=new AbortController();
  const timer=setTimeout(async()=>{
    setLoading(true);setPhrase(null);setError('');
    try{
      const response=await authorizedFetch('/api/ai/language',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:'phrase',query:text}),signal:abort.signal});
      const data=await response.json();if(!response.ok)throw new Error(data.error||'Chưa tạo được câu luyện nói.');
      cache.current.set(key,data as Phrase);if(!abort.signal.aborted)setPhrase(data as Phrase);
    }catch(e){if(!abort.signal.aborted)setError(e instanceof Error?e.message:'Không nhận được câu luyện nói.');}
    finally{if(!abort.signal.aborted)setLoading(false);}
  },1100);
  return()=>{clearTimeout(timer);abort.abort();};
 },[query]);
 useEffect(()=>()=>{rec.current?.stop();if('speechSynthesis'in window)window.speechSynthesis.cancel();},[]);
 function hear(){if(!phrase||!('speechSynthesis'in window))return;window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(phrase.english);utterance.lang='en-US';utterance.rate=.82;window.speechSynthesis.speak(utterance);}
 function record(){if(!phrase)return;setError('');setTranscript('');
  const w=window as SpeechWindow;const Rec=w.SpeechRecognition||w.webkitSpeechRecognition;
  if(!Rec){setError('Trình duyệt không hỗ trợ nhận diện lời nói. Hãy thử Chrome/Edge, dùng HTTPS và cấp quyền micro.');return;}
  try{const r=new Rec();r.lang='en-US';r.continuous=false;r.interimResults=false;
   r.onresult=e=>setTranscript(e.results[0][0].transcript);
   r.onerror=e=>{setError('Không nhận diện được: '+e.error);setWorking(false);};
   r.onend=()=>setWorking(false);rec.current=r;r.start();setWorking(true);
  }catch(e){setError(e instanceof Error?e.message:'Không thể mở micro.');setWorking(false);}
 }
 const score=phrase&&transcript?wordMatch(phrase.english,transcript):null;
 return <RequireLogin><AppShell subtitle="Luyện nói tiếng Anh">
  <h1>Luyện nói tiếng Anh</h1><p>Nhập một từ hoặc một câu bất kỳ bằng tiếng Việt/Anh. Gemini tạo câu tiếng Anh; bạn nghe mẫu rồi luyện đọc bằng micro.</p>
  <section className="white-panel">
   <label>Từ hoặc câu muốn luyện<input style={{width:'100%'}} value={query} maxLength={300} onChange={e=>setQuery(e.target.value)} placeholder="Ví dụ: Hãy quan sát thí nghiệm hoặc Explain the law of conservation of energy"/></label>
   <p className="muted">Tự tạo câu sau khi ngừng gõ. Giọng đọc và nhận diện phụ thuộc trình duyệt.</p>
   {loading&&<p role="status">Đang chuẩn bị câu luyện nói...</p>}
   {error&&<p className="error" role="alert">{error}</p>}
   {phrase&&!loading&&<div style={{marginTop:16}}>
    <h2>{phrase.english}</h2><p>{phrase.vietnamese}</p><p><b>Gợi ý:</b> {phrase.teachingTip}</p>
    <div className="action-row">
     <button type="button" className="secondary-btn" onClick={hear}>▶ Nghe mẫu</button>
     <button type="button" className="primary-btn" onClick={record} disabled={working}>{working?'Đang nghe...':'🎙 Đọc thử'}</button>
    </div>
    {transcript&&<div className="success-note"><p><b>Máy nhận diện:</b> {transcript}</p><p><b>Độ khớp lời nói thành văn bản:</b> {score}%</p><small>Đây KHÔNG phải đánh giá phát âm âm vị hay trọng âm.</small></div>}
   </div>}
  </section>
 </AppShell></RequireLogin>;
}

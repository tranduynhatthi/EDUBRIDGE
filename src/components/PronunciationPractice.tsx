'use client';
import {useEffect,useRef,useState} from 'react';
import {Mic,Square,Volume2} from 'lucide-react';

type RecognitionResult={results:ArrayLike<{0:{transcript:string}}>;resultIndex:number};
type Recognition={
 lang:string;continuous:boolean;interimResults:boolean;
 onresult:((event:RecognitionResult)=>void)|null;
 onerror:((event:{error:string})=>void)|null;
 onend:(()=>void)|null;
 start:()=>void;stop:()=>void;
};
type RecognitionConstructor=new()=>Recognition;
type SpeechWindow=Window & {SpeechRecognition?:RecognitionConstructor;webkitSpeechRecognition?:RecognitionConstructor};
const normalise=(value:string)=>value.toLowerCase().normalize('NFKC').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
function comparison(expected:string,heard:string){
 const target=normalise(expected).split(' ').filter(Boolean);
 const got=normalise(heard).split(' ').filter(Boolean);
 const tally=new Map<string,number>();
 for(const w of target)tally.set(w,(tally.get(w)||0)+1);
 let matches=0;
 for(const w of got){const n=tally.get(w)||0;if(n>0){matches++;tally.set(w,n-1);}}
 return target.length?Math.round(100*matches/target.length):0;
}
export default function PronunciationPractice({text,label}:{text:string;label?:string}){
 const [locale,setLocale]=useState('en-US');
 const [listening,setListening]=useState(false);
 const [recognized,setRecognized]=useState('');
 const [message,setMessage]=useState('');
 const recognition=useRef<Recognition|null>(null);
 const [supported,setSupported]=useState(true);
 useEffect(()=>{setSupported(typeof window!=='undefined'&&'speechSynthesis' in window);return ()=>{recognition.current?.stop();};},[]);
 function listen(rate:number){
  if(!supported){setMessage('Trình duyệt không hỗ trợ phát âm bằng giọng máy.');return;}
  window.speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text);
  u.lang=locale;u.rate=rate;u.pitch=1;
  const voices=window.speechSynthesis.getVoices();
  const voice=voices.find(v=>v.lang.toLowerCase()===locale.toLowerCase())||voices.find(v=>v.lang.toLowerCase().startsWith('en'));
  if(voice)u.voice=voice;
  u.onerror=()=>setMessage('Không phát được âm thanh. Hãy kiểm tra giọng tiếng Anh của thiết bị.');
  window.speechSynthesis.speak(u);
  setMessage('');
 }
 function practice(){
  if(typeof window==='undefined')return;
  const api=window as SpeechWindow;
  const Recognizer=api.SpeechRecognition||api.webkitSpeechRecognition;
  if(!Recognizer){setMessage('Trình duyệt không hỗ trợ nhận diện giọng nói. Có thể dùng Chrome hoặc Edge và cho phép micro.');return;}
  if(listening){recognition.current?.stop();return;}
  const rec=new Recognizer();
  recognition.current=rec;rec.lang=locale;rec.continuous=false;rec.interimResults=false;
  rec.onresult=(event)=>{const transcript=event.results[event.resultIndex]?.[0]?.transcript||'';setRecognized(transcript);setMessage('Mức trùng khớp từ được nhận dạng: '+comparison(text,transcript)+'%. Đây không phải điểm đánh giá phát âm chính xác.');};
  rec.onerror=(event)=>{setMessage('Không thể nhận diện giọng nói ('+event.error+'). Kiểm tra quyền micro và kết nối mạng.');setListening(false);};
  rec.onend=()=>setListening(false);
  setRecognized('');setMessage('Hãy đọc rõ câu hoặc thuật ngữ bằng tiếng Anh.');setListening(true);
  try{rec.start();}catch{setListening(false);setMessage('Không thể mở micro.');}
 }
 return <div style={{display:'flex',flexDirection:'column',gap:6,marginTop:6}}>
  <div className="action-row" style={{gap:6,flexWrap:'wrap'}}>
   <select aria-label="Giọng phát âm" value={locale} onChange={e=>setLocale(e.target.value)} style={{width:115}}>
    <option value="en-US">Anh–Mỹ</option><option value="en-GB">Anh–Anh</option>
   </select>
   <button className="secondary-btn" type="button" onClick={()=>listen(1)} aria-label={'Nghe phát âm '+(label||text)} style={{padding:'7px 10px'}}><Volume2 size={15}/> Nghe</button>
   <button className="secondary-btn" type="button" onClick={()=>listen(0.75)} style={{padding:'7px 10px'}}>Chậm</button>
   <button className="secondary-btn" type="button" onClick={practice} style={{padding:'7px 10px'}}>{listening?<Square size={15}/>:<Mic size={15}/>} {listening?'Dừng':'Nói thử'}</button>
  </div>
  {recognized&&<small><strong>Máy nghe được:</strong> {recognized}</small>}
  {message&&<small role="status" style={{color:'#92400e'}}>{message}</small>}
 </div>;
}

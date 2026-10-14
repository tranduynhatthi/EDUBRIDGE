'use client';
import {useEffect,useRef,useState} from 'react';
import AppShell from '@/components/AppShell';
import RequireLogin from '@/components/RequireLogin';
import {authorizedFetch} from '@/lib/supabase';
type Entry={english:string;vietnamese:string;definitionVi:string;definitionEn:string;exampleEn:string;pronunciationHint:string};
export default function Dictionary(){
 const [query,setQuery]=useState(''),[entry,setEntry]=useState<Entry|null>(null),[loading,setLoading]=useState(false),[error,setError]=useState('');
 const cache=useRef(new Map<string,Entry>());
 useEffect(()=>{
  const term=query.trim(),key=term.toLocaleLowerCase();
  if(term.length<2){setEntry(null);setError('');setLoading(false);return;}
  if(cache.current.has(key)){setEntry(cache.current.get(key)||null);setError('');setLoading(false);return;}
  const controller=new AbortController();
  const timer=setTimeout(async()=>{
   setLoading(true);setError('');setEntry(null);
   try{
    const response=await authorizedFetch('/api/ai/language',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:'term',query:term}),signal:controller.signal});
    const data=await response.json();
    if(!response.ok)throw new Error(data.error||'Không tra được thuật ngữ.');
    cache.current.set(key,data as Entry);if(!controller.signal.aborted)setEntry(data as Entry);
   }catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Lỗi tra cứu.');}
   finally{if(!controller.signal.aborted)setLoading(false);}
  },900);
  return()=>{clearTimeout(timer);controller.abort();};
 },[query]);
 function hear(v:string){if('speechSynthesis' in window){window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(v);u.lang='en-US';u.rate=.82;window.speechSynthesis.speak(u);}}
 return <RequireLogin><AppShell subtitle="Từ điển Vật lí Anh–Việt">
  <h1>Từ điển chuyên ngành Vật lí</h1><p>Chỉ cần nhập thuật ngữ bằng tiếng Anh hoặc tiếng Việt. Gemini sẽ tra cứu mà không cần tạo bài giảng trước.</p>
  <section className="white-panel">
   <label>Tìm thuật ngữ<input value={query} onChange={e=>setQuery(e.target.value.slice(0,100))} placeholder="Ví dụ: internal energy, nội năng, magnetic flux..." aria-label="Nhập thuật ngữ" style={{width:'100%'}}/></label>
   <p className="muted">Tự tra sau khi ngừng gõ; câu trả lời AI chỉ mang tính tham khảo, cần đối chiếu kiến thức.</p>
   {loading&&<p role="status">Đang tra cứu thuật ngữ...</p>}
   {error&&<p className="error" role="alert">{error}</p>}
   {entry&&!loading&&<article style={{marginTop:20}}>
    <h2>{entry.english} <button type="button" className="secondary-btn" onClick={()=>hear(entry.english)}>▶ Nghe từ</button></h2>
    <p><b>Tiếng Việt:</b> {entry.vietnamese}</p>
    <p><b>Gợi ý phát âm:</b> {entry.pronunciationHint}</p>
    <p><b>Giải thích:</b> {entry.definitionVi}</p>
    <p><b>English definition:</b> {entry.definitionEn}</p>
    <p><b>Ví dụ:</b> {entry.exampleEn} <button type="button" onClick={()=>hear(entry.exampleEn)}>▶</button></p>
   </article>}
  </section>
 </AppShell></RequireLogin>;
}

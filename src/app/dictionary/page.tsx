'use client';
import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import RequireLogin from '@/components/RequireLogin';
import {supabaseBrowser} from '@/lib/supabase';
import type {LessonResult} from '@/lib/schema';
type Word={termEn:string;termVi:string;definitionEn:string;exampleEn:string;from:string};
export default function Dictionary(){
 const [words,setWords]=useState<Word[]>([]),[q,setQ]=useState(''),[error,setError]=useState('');
 useEffect(()=>{let active=true;(async()=>{try{
  const {data,error}=await supabaseBrowser().from('lessons').select('title,generated_content').order('created_at',{ascending:false}).limit(100);
  if(error)throw error;const found=new Set<string>();const rows:Word[]=[];
  for(const lesson of data||[]){const result=lesson.generated_content as LessonResult;
   for(const v of result?.vocabulary||[]){const key=v.termEn.toLowerCase().trim();if(key&&!found.has(key)){found.add(key);rows.push({...v,from:lesson.title});}}}
  if(active)setWords(rows.sort((a,b)=>a.termEn.localeCompare(b.termEn,'en')));
 }catch(e){if(active)setError(e instanceof Error?e.message:'Không thể đọc từ điển.');}})();return()=>{active=false;};},[]);
 const filtered=useMemo(()=>words.filter(v=>(v.termEn+' '+v.termVi+' '+v.definitionEn).toLowerCase().includes(q.toLowerCase())),[q,words]);
 function play(v:string){if('speechSynthesis'in window){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(v);u.lang='en-US';u.rate=.85;speechSynthesis.speak(u);}}
 return <RequireLogin><AppShell subtitle="Từ điển chuyên ngành"><h1>Từ điển Vật lí Anh – Việt</h1><p>Tra cứu từ các bài giảng đã lưu. Nghe mẫu bằng giọng đọc của trình duyệt.</p>
 <section className="white-panel"><input aria-label="Tìm từ" style={{width:'100%'}} value={q} onChange={e=>setQ(e.target.value)} placeholder="Nhập thuật ngữ tiếng Anh hoặc tiếng Việt..."/>
 {error&&<p className="error">{error}</p>}
 {filtered.length===0?<p>Chưa có từ phù hợp. <Link href="/builder">Tạo bài giảng</Link> để xây dựng từ điển.</p>:
 <div className="scroll-table"><table><thead><tr><th>English</th><th>Tiếng Việt</th><th>Định nghĩa và ví dụ</th><th>Nghe</th></tr></thead><tbody>{filtered.map((v,i)=><tr key={i}><td><b>{v.termEn}</b><p><small>{v.from}</small></p></td><td>{v.termVi}</td><td>{v.definitionEn}<br/><i>{v.exampleEn}</i></td><td><button type="button" onClick={()=>play(v.termEn)}>▶</button></td></tr>)}</tbody></table></div>}</section>
 </AppShell></RequireLogin>;
}

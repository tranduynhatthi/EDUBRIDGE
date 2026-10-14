'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {supabaseBrowser} from '@/lib/supabase';
export default function EmailConfirmation(){
 const [state,setState]=useState<'loading'|'success'|'failed'>('loading');
 const [message,setMessage]=useState('Đang kiểm tra kết quả xác nhận email...');
 useEffect(()=>{let active=true;
  async function run(){try{
    const url=new URL(window.location.href);
    const params=new URLSearchParams(window.location.hash.replace(/^#/,''));
    const err=url.searchParams.get('error_description')||params.get('error_description');
    if(err){if(active){setState('failed');setMessage(decodeURIComponent(err));}return;}
    const client=supabaseBrowser();
    const tokenHash=url.searchParams.get('token_hash');
    const code=url.searchParams.get('code');
    if(tokenHash){
      const result=await client.auth.verifyOtp({token_hash:tokenHash,type:'email'});
      if(result.error)throw result.error;
    }else if(code){
      const result=await client.auth.exchangeCodeForSession(code);
      if(result.error)throw result.error;
    }else if(params.get('access_token')&&params.get('refresh_token')){
      const result=await client.auth.setSession({access_token:params.get('access_token')!,refresh_token:params.get('refresh_token')!});
      if(result.error)throw result.error;
    }else{
      const {data}=await client.auth.getSession();
      if(!data.session){if(active){setState('success');setMessage('Nếu bạn đã nhấn xác nhận trong email thì tài khoản có thể đã được kích hoạt. Hãy thử đăng nhập.');}return;}
    }
    window.history.replaceState({},'',window.location.pathname);
    if(active){setState('success');setMessage('Email đã được xác nhận. Bạn có thể đăng nhập EDUBRIDGE.');}
  }catch(e){if(active){setState('failed');setMessage(e instanceof Error?e.message:'Chưa xử lý được xác nhận email.');}}}
  void run();return()=>{active=false;};
 },[]);
 return <main className="auth-page"><section className="auth-card" style={{maxWidth:600,margin:'8vh auto'}}>
  <span className="eyebrow">EDUBRIDGE / EMAIL</span>
  <h1>{state==='loading'?'Đang xác nhận...':state==='success'?'Xác nhận email':'Cần kiểm tra lại'}</h1>
  <p role="status">{message}</p>
  <p>Nếu đã xác nhận email nhưng trình duyệt chuyển tới localhost, không cần tạo tài khoản mới. Hãy trở lại website và đăng nhập.</p>
  <Link href="/login" className="primary-btn" style={{display:'inline-block',marginTop:16}}>Trở về Đăng nhập</Link>
 </section></main>;
}

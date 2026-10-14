'use client';
import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import {supabaseBrowser} from '@/lib/supabase';
export default function RequireLogin({children}:{children:React.ReactNode}) {
 const [ready,setReady]=useState(false);
 const router=useRouter();
 useEffect(()=>{
   let active=true;
   try {supabaseBrowser().auth.getUser().then(({data,error})=>{
    if (!active) return;
    if(error||!data.user){router.replace('/login');return;}
    Promise.resolve(supabaseBrowser().from('profiles').select('role').eq('id',data.user.id).single()).then(({data:profile,error:roleError})=>{
      if(!active)return;
      if(roleError){router.replace('/login');return;}
      if(profile?.role==='student'){router.replace('/student');return;}
      if(profile?.role==='teacher'||profile?.role==='admin')setReady(true);
      else router.replace('/login');
    }).catch(()=>{if(active)router.replace('/login');});
   }).catch(()=>{if(active)router.replace('/login');});}
   catch {router.replace('/login');}
   return ()=>{active=false;};
 },[router]);
 return ready ? <>{children}</> : <div className="center-spinner">Đang xác minh đăng nhập…</div>;
}

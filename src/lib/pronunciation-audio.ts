// Server-only audio synthesis. A failed TTS request never prevents the teacher exporting slides.
const DEFAULT_TTS_MODEL='gemini-3.8-flash-lite-tts';
const MAX_AUDIO_BYTES=3_500_000;
export function pcm16ToWav(pcm:Buffer,sampleRate=24000):Buffer{
 if(pcm.length<2||pcm.length%2)throw new Error('Invalid PCM sample data');
 const header=Buffer.alloc(44);
 header.write('RIFF',0,'ascii');header.writeUInt32LE(36+pcm.length,4);header.write('WAVE',8,'ascii');
 header.write('fmt ',12,'ascii');header.writeUInt32LE(16,16);header.writeUInt16LE(1,20);
 header.writeUInt16LE(1,22);header.writeUInt32LE(sampleRate,24);header.writeUInt32LE(sampleRate*2,28);
 header.writeUInt16LE(2,32);header.writeUInt16LE(16,34);
 header.write('data',36,'ascii');header.writeUInt32LE(pcm.length,40);
 return Buffer.concat([header,pcm]);
}
export function normalizedAudioToWav(base64:string,mimeType:string):Buffer{
 if(!/^[a-zA-Z0-9+/=\r\n]+$/.test(base64)||base64.length>MAX_AUDIO_BYTES*2)throw new Error('Invalid audio response');
 const bytes=Buffer.from(base64,'base64');
 if(bytes.length>MAX_AUDIO_BYTES||bytes.length<64)throw new Error('TTS audio size out of bounds');
 if(bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WAVE')return bytes;
 if(/pcm|l16|audio\/raw/i.test(mimeType))return pcm16ToWav(bytes);
 throw new Error('Unexpected TTS audio format');
}
export async function synthesizeEnglishPronunciation(text:string):Promise<Buffer|null>{
 const key=process.env.GEMINI_API_KEY;
 if(!key||!text.trim())return null;
 const model=(process.env.GEMINI_TTS_MODEL||DEFAULT_TTS_MODEL).replace(/^models\//,'');
 if(!/^[A-Za-z0-9_.-]+$/.test(model))return null;
 const phrase=text.replace(/[\x00-\x1f\x7f]/g,' ').trim().slice(0,720);
 try{
  const response=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':generateContent',{
   method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},
   body:JSON.stringify({
    contents:[{parts:[{text:'Pronounce the following English science terms clearly for students to listen and repeat. Keep the same words and order, with a short pause between terms. Read the terms only: '+phrase}]}],
    generationConfig:{responseModalities:['AUDIO'],speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:'Kore'}}}}
   }),
   signal:AbortSignal.timeout(12_000)
  });
  if(!response.ok){console.warn('EDUBRIDGE speech export unavailable, status',response.status);return null;}
  const json=await response.json() as {candidates?:Array<{content?:{parts?:Array<{inlineData?:{data?:string;mimeType?:string}}>} }>};
  const voice=json.candidates?.[0]?.content?.parts?.find(p=>p.inlineData?.data)?.inlineData;
  if(!voice?.data)return null;
  return normalizedAudioToWav(voice.data,voice.mimeType||'audio/wav');
 }catch(e){console.warn('EDUBRIDGE speech export unavailable',e instanceof Error?e.name:'unknown');return null;}
}

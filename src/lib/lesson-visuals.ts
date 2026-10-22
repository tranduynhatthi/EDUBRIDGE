/**
 * SVG illustrations embedded into PowerPoint (no external fetch, no image API).
 * Fact-specific templates are used only for Physics; all other illustrations
 * restate actual slide bullets as an infographic, not as invented facts.
 */
const svgHeader='<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="650" viewBox="0 0 1200 650">';
const ink='#292524',orange='#EA580C',deep='#9A3412',cream='#FFFBF7',lineColor='#FED7AA';
function escaped(v:unknown){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&apos;'}[c]));}
function short(v:unknown,n=120){const t=String(v??'').replace(/\s+/g,' ').trim();return t.length>n?t.slice(0,n-1).trimEnd()+'…':t;}
function textSvg(v:unknown,x:number,y:number,size=28,color=ink,weight=600,anchor='start'){
 return '<text x="'+x+'" y="'+y+'" font-family="Arial,sans-serif" font-size="'+size+'" font-weight="'+weight+'" text-anchor="'+anchor+'" fill="'+color+'">'+escaped(v)+'</text>';
}
function boxSvg(x:number,y:number,w:number,h:number,fill='#FFFFFF',stroke=lineColor){
 return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="19" fill="'+fill+'" stroke="'+stroke+'" stroke-width="3"/>';
}
function circleSvg(x:number,y:number,r:number,fill=orange){return '<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+fill+'"/>';}
function framedSvg(content:string,label:string){
 return svgHeader+'<rect width="1200" height="650" fill="'+cream+'"/><rect width="1200" height="13" fill="'+orange+'"/>'
 +boxSvg(45,35,1110,82)+textSvg(short(label,51),80,88,35,deep,750)
 +content+textSvg('EDUBRIDGE • Conceptual diagram • Not to scale • Teacher review required',48,622,17,'#78716C',450)+'</svg>';
}
function brokenLines(value,max=24,lines=4){const words=short(value,190).split(' '),out=[];let line='';for(const word of words){if((line+' '+word).trim().length>max&&line){out.push(line);line=word;}else line=(line+' '+word).trim();}if(line)out.push(line);return out.slice(0,lines);}
type VisualItem={title:string;bullets:string[];keyMessage?:string;formula?:string};
function slideInfographic(item:VisualItem,kind:string){
 const rows=(item.bullets||[]).filter(Boolean).slice(0,4);if(!rows.length)rows.push(item.keyMessage||item.title);
 const parts=[];
 const n=Math.min(4,rows.length),gap=17,w=(1080-(n-1)*gap)/n;
 if(kind==='formula'&&item.formula){
  parts.push(boxSvg(75,167,1050,146,deep,deep),textSvg(short(item.formula,60),600,260,43,'#FFFFFF',750,'middle'));
  const terms=rows.filter(x=>x!==item.formula).slice(0,3);terms.forEach((v,i)=>{const x=82+i*370;parts.push(boxSvg(x,357,342,133));brokenLines(v,23,3).forEach((line,j)=>parts.push(textSvg(line,x+171,405+j*28,22,ink,630,'middle')));});
 }else{
  for(let i=0;i<n;i++){
   const x=62+i*(w+gap);parts.push(boxSvg(x,195,w,320),boxSvg(x+16,213,w-32,65,'#FFEDD5'));
   parts.push(textSvg((kind==='process'?'STEP ':kind==='comparison'?'POINT ':'IDEA ')+(i+1),x+w/2,254,22,deep,720,'middle'));
   brokenLines(rows[i],n===4?17:24,5).forEach((l,j)=>parts.push(textSvg(l,x+w/2,337+j*33,n===4?21:25,ink,620,'middle')));
  }
 }
 return framedSvg(parts.join(''),kind==='process'?'Visual steps: '+item.title:kind==='comparison'?'Concept comparison: '+item.title:'Illustrated lesson concept: '+item.title);
}
function particlesSvg(){
 const parts=[];
 const states=[['SOLID',80,'regular'],['LIQUID',445,'close'],['GAS',810,'sparse']];
 for(const [label,left,mode] of states){
  const x=Number(left);
  parts.push(boxSvg(x,197,310,321),textSvg(label,x+155,241,29,deep,720,'middle'),boxSvg(x+29,285,252,164,'#FFF7ED','#FDBA74'));
  const points=[];
  if(mode==='regular'){for(let r=0;r<4;r++)for(let c=0;c<5;c++)points.push([x+75+c*37,311+r*35]);}
  else if(mode==='close'){for(let r=0;r<4;r++)for(let c=0;c<5;c++)points.push([x+64+c*43+(r%2)*7,331+r*29]);}
  else points.push(...[[46,20],[165,41],[226,17],[64,100],[192,131],[132,84],[243,99],[33,147]].map(v=>[x+29+v[0],285+v[1]]));
  for(const p of points)parts.push(circleSvg(p[0],p[1],10,mode==='regular'?orange:mode==='close'?'#FB923C':deep));
 }
 parts.push(textSvg('Arrangement illustration; particles are not drawn to scale.',600,565,23,'#78716C',450,'middle'));
 return framedSvg(parts.join(''),'States of matter — particle model');
}
function curveSvg(boyle){
 const parts=[textSvg(boyle?'Pressure and volume (constant temperature)':'Volume and absolute temperature (constant pressure)',600,158,27,ink,600,'middle')];
 parts.push('<path d="M190 205 L190 515 L1070 515" fill="none" stroke="'+ink+'" stroke-width="5"/>');
 parts.push(textSvg(boyle?'Pressure (p)':'Volume (V)',86,205,24,ink),textSvg(boyle?'Volume (V)':'Temperature (K)',1030,558,24,ink));
 const pts=[];for(let i=0;i<=55;i++){const u=i/55,x=250+u*730,y=boyle?215+270*(1-1/(1+5*u)):490-u*262;pts.push((i===0?'M':'L')+x.toFixed(1)+' '+y.toFixed(1));}
 parts.push('<path d="'+pts.join(' ')+'" fill="none" stroke="'+orange+'" stroke-width="10" stroke-linecap="round"/>');
 parts.push(textSvg(boyle?'p × V = constant':'V / T = constant',600,592,27,deep,750,'middle'));
 return framedSvg(parts.join(''),boyle?'Boyle’s law — schematic':'Charles’s law — schematic');
}
function nucleusSvg(){
 const parts=['<circle cx="610" cy="365" r="158" fill="#FFF7ED" stroke="#FDBA74" stroke-width="6"/>'];
 const cells=[[567,300,orange],[636,305,deep],[527,366,deep],[605,369,orange],[677,369,deep],[557,433,orange],[631,436,deep],[601,494,orange]];
 for(const p of cells){parts.push(circleSvg(p[0],p[1],34,p[2]),textSvg(p[2]===orange?'+':'n',p[0],p[1]+9,29,'#FFFFFF',750,'middle'));}
 parts.push(boxSvg(52,273,263,112),circleSvg(102,322,15,orange),textSvg('Proton (+)',130,331,26));
 parts.push(boxSvg(890,374,258,112),circleSvg(940,424,15,deep),textSvg('Neutron (n)',970,432,25));
 return framedSvg(parts.join(''),'Nucleus: protons and neutrons');
}
function magneticSvg(){
 const parts=[textSvg('Magnetic field outside a bar magnet: N to S',600,158,27,ink,600,'middle')];
 for(const h of [55,98,145]){
  parts.push('<path d="M455 327 C'+(450-h)+' '+(255-h/2)+' '+(760+h)+' '+(255-h/2)+' 746 327" fill="none" stroke="'+deep+'" stroke-width="4"/>');
  parts.push('<path d="M455 424 C'+(450-h)+' '+(500+h/2)+' '+(760+h)+' '+(500+h/2)+' 746 424" fill="none" stroke="'+deep+'" stroke-width="4"/>');
 }
 parts.push('<rect x="455" y="327" width="150" height="97" fill="'+orange+'"/><rect x="605" y="327" width="141" height="97" fill="#CBD5E1"/>',
 textSvg('N',527,390,42,'#FFFFFF',700,'middle'),textSvg('S',673,390,42,ink,700,'middle'));
 return framedSvg(parts.join(''),'Magnetic field — conceptual diagram');
}
function waveSvg(){
 const parts=['<path d="M110 405 L1110 405" stroke="'+ink+'" stroke-width="4"/>'];const pts=[];
 for(let i=0;i<=160;i++){const x=125+i*6.0,y=405-120*Math.sin((i/160)*Math.PI*4);pts.push((i===0?'M':'L')+x.toFixed(1)+' '+y.toFixed(1));}
 parts.push('<path d="'+pts.join(' ')+'" fill="none" stroke="'+orange+'" stroke-width="10"/>');
 parts.push('<path d="M365 405 L365 285" stroke="'+deep+'" stroke-width="4"/>',textSvg('Amplitude',386,313,23,deep),
 '<path d="M130 540 L610 540" stroke="'+deep+'" stroke-width="4"/>',textSvg('One wavelength (λ)',375,580,26,deep,650,'middle'));
 return framedSvg(parts.join(''),'Waveform — not experimental data');
}
function diagramVariant(subject:string,lessonTitle:string,slideTitle:string){
 if(!/Vật lí|Physics/i.test(subject))return null;
 const t=(slideTitle+' '+lessonTitle).toLowerCase();
 if(/boyle/.test(t))return 'boyle';
 if(/charles/.test(t))return 'charles';
 if(/cấu trúc của chất|chuyển thể|states of matter|state of matter|solid|liquid|gas molecules|particle arrangement/.test(t))return 'particles';
 if(/magnetic|từ trường|cảm ứng từ/.test(t))return 'magnetic';
 if(/nucleus|hạt nhân|proton|neutron/.test(t))return 'nucleus';
 if(/wave|sóng điện từ|sóng cơ/.test(t))return 'wave';
 return null;
}
/** Create an embedded SVG picture illustrating source content without outside network calls. */
export function makeTeachingVisual({subject,lessonTitle,item,kind,used}:{subject:string;lessonTitle:string;item:VisualItem;kind:string;used:Set<string>}){
 const variant=diagramVariant(subject,lessonTitle,item.title);
 const specific=variant&&!used.has(variant)?variant:null;
 if(specific)used.add(specific);
 const graphic=specific==='particles'?particlesSvg():specific==='boyle'?curveSvg(true):specific==='charles'?curveSvg(false):specific==='magnetic'?magneticSvg():specific==='nucleus'?nucleusSvg():specific==='wave'?waveSvg():slideInfographic(item,kind);
 return {
  data:'data:image/svg+xml;base64,'+Buffer.from(graphic,'utf8').toString('base64'),
  variant:specific||'source-infographic',
  caption:specific?'Scientific schematic; verify it against the approved lesson source.':'Visual summary of statements from this lesson slide.'
 };
}

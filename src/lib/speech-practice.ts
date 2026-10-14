/** Transcript matching is NOT a formal pronunciation assessment. */
export function wordMatch(reference:string,observed:string):number {
 const norm=(s:string)=>s.toLocaleLowerCase('en-US').normalize('NFKC').replace(/[^\p{L}\p{N}\s]/gu,' ').trim().split(/\s+/).filter(Boolean);
 const a=norm(reference),b=norm(observed),n=a.length,m=b.length;if(!n)return 0;
 let prev=Array.from({length:m+1},(_,i)=>i);
 for(let i=1;i<=n;i++){const cur=[i];for(let j=1;j<=m;j++)cur[j]=Math.min(cur[j-1]+1,prev[j]+1,prev[j-1]+Number(a[i-1]!==b[j-1]));prev=cur;}
 return Math.max(0,Math.round(100*(1-prev[m]/n)));
}

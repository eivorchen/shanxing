export function sourceMatches(source, query, service) {
  const term=query.trim().toLowerCase();
  if(!term)return true;
  const names=[source.mountain,...(source.aliases||[])].map(s=>s.toLowerCase());
  if(names.some(name=>name.includes(term)||term.includes(name)))return true;
  if(/^(大峰|二峰|三峰)$/.test(term)&&source.mountain==='四姑娘山')return true;
  return service==='certificates' && /四川|四姑娘|大峰|二峰|三峰/.test(term) && source.mountain==='四川山峰';
}
export function publishedDate(value) {
  const match=String(value||'').match(/(20\d{2})[年/-](\d{1,2})[月/-](\d{1,2})/);
  return match?`${match[1]}-${match[2].padStart(2,'0')}-${match[3].padStart(2,'0')}`:'';
}
export function sourceTypes(source) {return source.types||[source.type];}
export function selectSources(sources,service,mountain,asOf) {
  const date=publishedDate(asOf);
  const cutoff=date?new Date(`${date}T00:00:00Z`).getTime()-30*86400000:0;
  const result=sources.filter(source=>{
    const included=sourceTypes(source).includes(service)||(service==='guide'&&['taishan-book','huangshan-book'].includes(source.id));
    if(!included||!sourceMatches(source,mountain,service))return false;
    if(service==='news') {
      const issued=publishedDate(source.published);
      return issued && new Date(`${issued}T00:00:00Z`).getTime()>=cutoff && issued<=date;
    }
    return true;
  }).sort((a,b)=>{
    if(service==='guide') {
      const rank=s=>(s.type==='guide'?2:0)+(/概况|概览|核心景区|户外徒步/.test(s.title)?2:0);
      const difference=rank(b)-rank(a);if(difference)return difference;
    }
    return publishedDate(b.published).localeCompare(publishedDate(a.published));
  });
  if(service==='guide'&&!mountain.trim()) {
    const seen=new Set(),first=[],rest=[];
    for(const source of result){if(seen.has(source.mountain))rest.push(source);else{seen.add(source.mountain);first.push(source);}}
    return [...first,...rest];
  }
  return result;
}

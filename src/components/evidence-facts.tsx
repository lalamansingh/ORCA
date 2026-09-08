/** Bounded, text-only rendering of service facts. Never interpret returned HTML or code. */
export function EvidenceFacts({value,depth=0}:{value:unknown;depth?:number}) {
  if(value==null)return <span>Unavailable</span>;
  if(typeof value!=="object")return <span className={/^(HIGH|EXTREME|PROHIBITED|RESTRICTED|UNAVAILABLE|DEMO)$/.test(String(value))?"result-warning":""}>{String(value)}</span>;
  if(depth>4)return <span>Additional detail available in source evidence.</span>;
  if(Array.isArray(value))return <div>{value.slice(0,12).map((item,index)=><div className="fact-item" key={index}><EvidenceFacts value={item} depth={depth+1}/></div>)}</div>;
  const entries=Object.entries(value).filter(([key])=>!["geometry","coordinates","metadata","metadata_","forecast","hourly","raw_payload"].includes(key));
  return <dl className="evidence-facts">{entries.slice(0,30).map(([key,item])=><div key={key}><dt>{key.replaceAll("_"," ")}</dt><dd><EvidenceFacts value={item} depth={depth+1}/></dd></div>)}</dl>;
}

export function ServiceFacts({name,value}:{name:string;value:unknown}) {
  const facts = value && typeof value==="object" && !Array.isArray(value) ? value as Record<string,unknown> : {};
  const items = Array.isArray(facts.pfzs)?facts.pfzs:Array.isArray(facts.candidates)?facts.candidates:[];
  return <section className="result-facts"><h4>{name.replaceAll("_"," ")}</h4><div className="service-summary">
    <p><strong>{String(facts.level??facts.overall_status??facts.result_state??facts.status??"Service result").replaceAll("_"," ")}</strong></p>
    {items.slice(0,3).map((item,index)=>{const entry=item as Record<string,unknown>;return <p key={index}><strong>{String(entry.name??`Candidate ${index+1}`)}</strong><br/>{typeof entry.distance_km==="number"?`${entry.distance_km.toFixed(1)} km · `:""}{String(entry.status??entry.eligibility??"")}<br/>{String(entry.source??"")}</p>;})}
    {name==="pfz"&&<p>PFZ advisories indicate potential fish aggregation and do not guarantee catch.</p>}
    {name==="pfz_recommendation"&&<p>ORCA operational ranking; not fish or catch probability.</p>}
    {Array.isArray(facts.warnings)&&facts.warnings.map((warning,index)=><p className="result-warning" key={index}>{String(warning)}</p>)}
  </div><details><summary>Measurements, source and validity details</summary><EvidenceFacts value={value}/></details></section>;
}

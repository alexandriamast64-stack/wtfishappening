
const TRACKERS = [
  ["conflict","Direct conflict","war missile drone ceasefire military escalation"],
  ["conflict","Great-power spillover","NATO Russia Ukraine China Taiwan Iran Israel"],
  ["conflict","Military posture","deployment carrier bomber warship mobilization"],
  ["conflict","Nuclear risk","nuclear IAEA enrichment nuclear facility"],
  ["earth","Severe weather","tornado hurricane typhoon cyclone severe weather flood"],
  ["earth","Earthquakes","earthquake aftershock tsunami"],
  ["earth","Wildfire","wildfire bushfire smoke"],
  ["earth","Volcano / environment","volcano eruption air quality"],
  ["energy","Oil prices","oil prices WTI Brent crude OPEC"],
  ["energy","U.S. fuel prices","gasoline diesel pump prices"],
  ["energy","Shipping chokepoints","Hormuz Red Sea Suez Malacca tanker shipping"],
  ["energy","Energy supply","LNG refinery pipeline energy supply disruption"],
  ["cyber","Critical infrastructure","cyberattack ransomware critical infrastructure power grid telecom"],
  ["cyber","Major outages","outage internet telecom payments"],
  ["cyber","CISA / exploitation","CISA zero day vulnerability exploit"]
];

function decodeXml(s=""){
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1")
          .replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'")
          .replace(/&lt;/g,"<").replace(/&gt;/g,">");
}
function sourceFrom(title, source, link){
  const hay=(source+" "+title+" "+link).toLowerCase();
  if(hay.includes("reuters")) return "Reuters";
  if(hay.includes("associated press") || hay.includes("ap news") || hay.includes("apnews.com")) return "Associated Press";
  return "";
}
function stripSource(title){
  return title.replace(/\s+-\s+(Reuters|Associated Press|AP News)\s*$/i,"").trim();
}
function parseRss(xml, cat, tracker){
  const out=[];
  const items=xml.match(/<item>[\s\S]*?<\/item>/g)||[];
  for(const item of items){
    const get=(tag)=>{
      const m=item.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`,"i"));
      return m?decodeXml(m[1].trim()):"";
    };
    const title=get("title"), link=get("link"), pub=get("pubDate");
    const source=get("source");
    const src=sourceFrom(title,source,link);
    if(!src || !title || !link) continue;
    out.push({
      cat, tracker, source:src, title:stripSource(title), url:link,
      publishedAt: Number.isFinite(Date.parse(pub)) ? new Date(pub).toISOString() : null
    });
  }
  return out;
}
function dedupe(items){
  const out=[], seen=new Set();
  for(const a of items.sort((x,y)=>(Date.parse(y.publishedAt||0)||0)-(Date.parse(x.publishedAt||0)||0))){
    const k=a.title.toLowerCase().replace(/\W+/g," ").trim().slice(0,140);
    if(seen.has(k)) continue;
    seen.add(k); out.push(a);
  }
  return out;
}

export default async function handler(req,res){
  try{
    const jobs=[];
    for(const [cat,tracker,terms] of TRACKERS){
      // Split publisher searches: much more reliable than OR-ing site filters.
      for(const site of ["reuters.com","apnews.com"]){
        const q=`site:${site} ${terms} when:2d`;
        const url=`https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;
        jobs.push((async()=>{
          const r=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0 WTFisHappening/0.1"}});
          if(!r.ok) return [];
          return parseRss(await r.text(),cat,tracker);
        })());
      }
    }
    const settled=await Promise.allSettled(jobs);
    const items=dedupe(settled.flatMap(x=>x.status==="fulfilled"?x.value:[])).slice(0,60);
    res.setHeader("Cache-Control","s-maxage=300, stale-while-revalidate=600");
    res.status(200).json({ok:true,count:items.length,items});
  }catch(e){
    res.status(500).json({ok:false,error:"headline_fetch_failed",items:[]});
  }
}

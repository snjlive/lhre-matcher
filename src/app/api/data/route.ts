import {NextResponse} from 'next/server';
import type {Availability,Request,Villa} from '../../../lib/match';
export const dynamic='force-dynamic';
export const maxDuration=30;
const BASE=process.env.AIRTABLE_BASE_ID||'app4WOqlN3WR5uI5u';
const TABLES={requests:'tbldWAXwxCkXYWUSN',objects:'tblynFhimCOyUGMqP',availability:'tblhqw7fkyODNxztN'};
type Row={id:string;fields:Record<string,unknown>;createdTime:string};
const str=(v:unknown)=>typeof v==='string'?v:'';
const option=(v:unknown)=>typeof v==='object'&&v!==null&&'name' in v?String(v.name):str(v);
const refs=(v:unknown)=>Array.isArray(v)?v.filter((x):x is string=>typeof x==='string'):[];
const list=(v:unknown)=>Array.isArray(v)?v.map(x=>typeof x==='string'?x:option(x)).join(', '):option(v);
type Query={formula?:string;sortField?:string};
async function read(table:string,fields:string[],cap:number,opts:Query={}):Promise<Row[]>{
 const rows:Row[]=[];let offset='';
 do{
  const url=new URL(`https://api.airtable.com/v0/${BASE}/${table}`);
  url.searchParams.set('pageSize',String(Math.min(100,cap-rows.length)));
  fields.forEach(f=>url.searchParams.append('fields[]',f));
  if(opts.formula)url.searchParams.set('filterByFormula',opts.formula);
  if(opts.sortField){url.searchParams.set('sort[0][field]',opts.sortField);url.searchParams.set('sort[0][direction]','desc')}
  if(offset)url.searchParams.set('offset',offset);
  let response:Response|undefined;
  for(let attempt=0;attempt<3;attempt++){
   response=await fetch(url,{headers:{Authorization:`Bearer ${process.env.AIRTABLE_TOKEN}`},cache:'no-store'});
   if(response.status!==429)break;
   await new Promise(resolve=>setTimeout(resolve,1100*(attempt+1)));
  }
  if(!response?.ok)throw new Error(`Airtable returned ${response?.status||'no response'} for ${table}`);
  const body=await response.json();
  rows.push(...body.records);offset=body.offset||'';
 }while(offset&&rows.length<cap);
 return rows;
}
export async function GET(){
 // Application password removed; hosted deployments retain Vercel protection.
 if(!process.env.AIRTABLE_TOKEN)return NextResponse.json({error:'AIRTABLE_TOKEN is not configured'},{status:503});
 try{
  const aa=await read(TABLES.availability,['Name','AVAIL / UNAV','доступно с','доступно по / занято с','занято по','ОБЪЕКТ','ОБЪЕКТЫ','Created'],200);
  const availability:Availability[]=aa.flatMap(r=>{
   const links=[...new Set([...refs(r.fields['ОБЪЕКТ']),...refs(r.fields['ОБЪЕКТЫ'])])];
   return links.map(objectId=>({
    id:r.id,objectId,
    status:/занят|unav/i.test(option(r.fields['AVAIL / UNAV']))?'unavailable' as const:'available' as const,
    from:str(r.fields['доступно с']),to:str(r.fields['доступно по / занято с']),
    blockedUntil:str(r.fields['занято по']),label:str(r.fields.Name),created:str(r.fields.Created)
   }));
  });
  const ids=[...new Set(availability.map(a=>a.objectId))];
  const villaFormula=ids.length?`OR(${ids.map(id=>`RECORD_ID()='${id}'`).join(',')})`:'';
  const [rr,oo]=await Promise.all([
   // Only recent requests whose checkout has not passed. Limits API calls on a large historical base.
   read(TABLES.requests,['summary-','✏️ ИМЯ','Start','End','req_status','✏️ THB','✏️  BRs/ количество спален','🕙  Created','hide req'],300,{formula:"IS_AFTER({End}, DATEADD(TODAY(), -1, 'day'))",sortField:'🕙  Created'}),
   ids.length?read(TABLES.objects,['object_name','BRs','Last Modified'],Math.max(ids.length,100),{formula:villaFormula}):Promise.resolve([] as Row[])
  ]);
  const requests:Request[]=rr.map(r=>({
   id:r.id,name:str(r.fields['summary-'])||str(r.fields['✏️ ИМЯ'])||r.id,
   from:str(r.fields.Start),to:str(r.fields.End),status:option(r.fields.req_status),
   budget:Number(r.fields['✏️ THB'])||undefined,created:str(r.fields['🕙  Created'])||r.createdTime,
   bedrooms:list(r.fields['✏️  BRs/ количество спален']),hidden:Boolean(r.fields['hide req'])
  })).filter(r=>r.from&&r.to&&!r.hidden&&!/obsolete|closed|deal closed/i.test(r.status));
  const villas:Villa[]=oo.map(r=>({
   id:r.id,name:str(r.fields.object_name)||r.id,bedrooms:list(r.fields.BRs),
   lastModified:str(r.fields['Last Modified'])
  }));
  return NextResponse.json({requests,villas,availability,loadedAt:new Date().toISOString()},{headers:{'Cache-Control':'private, no-store'}});
 }catch(e){
  return NextResponse.json({error:e instanceof Error?e.message:'Failed to load Airtable'},{status:502,headers:{'Cache-Control':'private, no-store'}});
 }
}

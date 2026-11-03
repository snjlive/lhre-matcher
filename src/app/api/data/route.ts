import {NextResponse} from 'next/server';
import type {Availability,Request,Villa} from '../../../lib/match';
export const dynamic='force-dynamic';
const BASE=process.env.AIRTABLE_BASE_ID||'app4WOqlN3WR5uI5u';
const TABLES={requests:'tbldWAXwxCkXYWUSN',objects:'tblynFhimCOyUGMqP',availability:'tblhqw7fkyODNxztN'};
type Row={id:string;fields:Record<string,unknown>;createdTime:string};
const str=(v:unknown)=>typeof v==='string'?v:'';
const option=(v:unknown)=>typeof v==='object'&&v!==null&&'name' in v?String(v.name):str(v);
const refs=(v:unknown)=>Array.isArray(v)?v.filter((x):x is string=>typeof x==='string'):[];
const list=(v:unknown)=>Array.isArray(v)?v.map(x=>typeof x==='string'?x:option(x)).join(', '):option(v);
async function all(table:string,fields:string[],cap:number):Promise<Row[]>{
 const rows:Row[]=[];let offset='';do{
  const url=new URL(`https://api.airtable.com/v0/${BASE}/${table}`);
  url.searchParams.set('pageSize','100');fields.forEach(f=>url.searchParams.append('fields[]',f));if(offset)url.searchParams.set('offset',offset);
  const response=await fetch(url,{headers:{Authorization:`Bearer ${process.env.AIRTABLE_TOKEN}`},cache:'no-store'});
  if(!response.ok)throw new Error(`Airtable returned ${response.status} for ${table}`);
  const body=await response.json();rows.push(...body.records);offset=body.offset||'';
 }while(offset&&rows.length<cap);return rows;
}
export async function GET(req:globalThis.Request){
 // Deny before reading live records. Never deploy live data without access gate.
 const pass=process.env.MATCHER_ACCESS_PASSWORD;
 if(!pass)return NextResponse.json({error:'MATCHER_ACCESS_PASSWORD is not configured'},{status:503});
 if(req.headers.get('x-matcher-password')!==pass)return NextResponse.json({error:'Access denied'},{status:401});
 if(!process.env.AIRTABLE_TOKEN)return NextResponse.json({error:'AIRTABLE_TOKEN is not configured'},{status:503});
 try{
 const [rr,oo,aa]=await Promise.all([
  all(TABLES.requests,['summary-','✏️ ИМЯ','Start','End','req_status','✏️ THB','✏️  BRs/ количество спален','🕙  Created','hide req'],1700),
  all(TABLES.objects,['object_name','BRs','Last Modified'],3000),
  all(TABLES.availability,['Name','AVAIL / UNAV','доступно с','доступно по / занято с','занято по','ОБЪЕКТ','ОБЪЕКТЫ','Created'],1000)
 ]);
 const requests:Request[]=rr.map(r=>({id:r.id,name:str(r.fields['summary-'])||str(r.fields['✏️ ИМЯ'])||r.id,from:str(r.fields.Start),to:str(r.fields.End),status:option(r.fields.req_status),budget:Number(r.fields['✏️ THB'])||undefined,created:str(r.fields['🕙  Created'])||r.createdTime,bedrooms:list(r.fields['✏️  BRs/ количество спален']),hidden:Boolean(r.fields['hide req'])})).filter(r=>r.from&&r.to&&!r.hidden&&!/obsolete|closed|deal closed/i.test(r.status));
 const villas:Villa[]=oo.map(r=>({id:r.id,name:str(r.fields.object_name)||r.id,bedrooms:list(r.fields.BRs),lastModified:str(r.fields['Last Modified'])}));
 const availability:Availability[]=aa.flatMap(r=>refs(r.fields['ОБЪЕКТ']||r.fields['ОБЪЕКТЫ']).map(objectId=>({id:r.id,objectId,status:/занят|unav/i.test(option(r.fields['AVAIL / UNAV']))?'unavailable' as const:'available' as const,from:str(r.fields['доступно с']),to:str(r.fields['доступно по / занято с']),blockedUntil:str(r.fields['занято по']),label:str(r.fields.Name),created:str(r.fields.Created)})));
 return NextResponse.json({requests,villas,availability,loadedAt:new Date().toISOString()},{headers:{'Cache-Control':'private, no-store'}});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Failed to load Airtable'},{status:502});}
}

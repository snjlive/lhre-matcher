import {NextResponse} from 'next/server';
export const dynamic='force-dynamic';
// Checks permissions and actual field names without returning personal records.
export async function GET(){
 const token=process.env.AIRTABLE_TOKEN,base=process.env.AIRTABLE_BASE_ID||'app4WOqlN3WR5uI5u';
 const headers={'Cache-Control':'no-store'};
 if(!token)return NextResponse.json({airtable:'not_configured'},{status:503,headers});
 const tables=[
  {name:'requests',id:'tbldWAXwxCkXYWUSN',fields:['summary-','✏️ ИМЯ','Start','End','req_status','✏️ THB','✏️  BRs/ количество спален','🕙  Created','hide req']},
  {name:'villas',id:'tblynFhimCOyUGMqP',fields:['object_name','BRs','Last Modified']},
  {name:'availability',id:'tblhqw7fkyODNxztN',fields:['Name','AVAIL / UNAV','доступно с','доступно по / занято с','занято по','ОБЪЕКТ','ОБЪЕКТЫ','Created']}
 ];
 try{
  const checks=await Promise.all(tables.map(async table=>{
   const url=new URL(`https://api.airtable.com/v0/${base}/${table.id}`);
   url.searchParams.set('maxRecords','1');
   table.fields.forEach(field=>url.searchParams.append('fields[]',field));
   const response=await fetch(url,{headers:{Authorization:`Bearer ${token}`},cache:'no-store'});
   return {table:table.name,ok:response.ok,status:response.status};
  }));
  const connected=checks.every(c=>c.ok);
  return NextResponse.json({airtable:connected?'connected':'error',checks,checkedAt:new Date().toISOString()},{status:connected?200:503,headers});
 }catch{return NextResponse.json({airtable:'unreachable'},{status:503,headers})}
}

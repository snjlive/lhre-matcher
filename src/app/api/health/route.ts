import {NextResponse} from 'next/server';
export const dynamic='force-dynamic';
// Connectivity-only probe: returns no records or credentials.
export async function GET(){
 const token=process.env.AIRTABLE_TOKEN;
 const base=process.env.AIRTABLE_BASE_ID||'app4WOqlN3WR5uI5u';
 if(!token)return NextResponse.json({airtable:'not_configured'},{status:503,headers:{'Cache-Control':'no-store'}});
 try{
  const url=new URL(`https://api.airtable.com/v0/${base}/tbldWAXwxCkXYWUSN`);
  url.searchParams.set('maxRecords','1');
  const result=await fetch(url,{headers:{Authorization:`Bearer ${token}`},cache:'no-store'});
  if(!result.ok)return NextResponse.json({airtable:'error',upstreamStatus:result.status},{status:503,headers:{'Cache-Control':'no-store'}});
  return NextResponse.json({airtable:'connected',checkedAt:new Date().toISOString()},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({airtable:'unreachable'},{status:503,headers:{'Cache-Control':'no-store'}})}
}

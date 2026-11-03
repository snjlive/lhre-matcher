export type Availability={id:string;objectId:string;status:'available'|'unavailable';from?:string;to?:string;blockedUntil?:string;label:string;created?:string};
export type Request={id:string;name:string;from:string;to:string;status:string;budget?:number;created?:string;bedrooms?:string;hidden?:boolean};
export type Villa={id:string;name:string;bedrooms?:string;area?:string;lastModified?:string};
export type MatchResult={kind:'full'|'partial'|'blocked'|'unknown';reason:string;coveredDays:number;totalDays:number;blockedDays:number};
const day=(d:string)=>{const n=Date.parse(d.slice(0,10)+'T00:00:00Z');return Number.isFinite(n)?Math.floor(n/86400000):NaN};
// All intervals are checkout-exclusive, with unknown nights never counted as available.
export function matchDates(req:Request,rows:Availability[]):MatchResult {
 const a=day(req.from),b=day(req.to);
 if(!Number.isFinite(a)||!Number.isFinite(b)||b<=a)return {kind:'unknown',reason:'Некорректные даты запроса',coveredDays:0,totalDays:0,blockedDays:0};
 const totalDays=b-a;const yes=new Set<number>(),no=new Set<number>();
 for(const r of rows){
  const first=r.from?day(r.from):-Infinity,last=r.to?day(r.to):Infinity;
  if(Number.isNaN(first)||Number.isNaN(last))continue;
  for(let d=Math.max(a,first);d<Math.min(b,last);d++){if(r.status==='available')yes.add(d);else no.add(d)}
  // A separate `занято по` on an available interval can mark a following blocked span;
  // for now it is deliberately not inferred because date semantics need verification.
 }
 for(const d of no)yes.delete(d);
 const coveredDays=yes.size,blockedDays=no.size;
 if(coveredDays===totalDays)return {kind:'full',reason:`Все ${totalDays} ночей покрыты доступностью`,coveredDays,totalDays,blockedDays};
 if(blockedDays===totalDays)return {kind:'blocked',reason:'Все даты отмечены как занятые',coveredDays,totalDays,blockedDays};
 if(coveredDays>0)return {kind:'partial',reason:`Доступно ${coveredDays} из ${totalDays} ночей${blockedDays?`, занято ${blockedDays}`:''}`,coveredDays,totalDays,blockedDays};
 return {kind:'unknown',reason:blockedDays?`Занято ${blockedDays} ночей, остальные даты требуют проверки`:'Нет подтверждённых данных на период',coveredDays,totalDays,blockedDays};
}

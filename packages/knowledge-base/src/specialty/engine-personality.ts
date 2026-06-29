import type { SharedContext } from './shared/context.js';
import type { AnalysisItem, SpecContext } from './types.js';
import { readFileSync } from 'fs'; import { fileURLToPath } from 'url'; import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
let _c: any = null; function C(): any { if(!_c) _c=JSON.parse(readFileSync(join(__dirname,'content','personality.json'),'utf-8')); return _c; }
const ORDER = ['木','火','土','金','水'];
function elIsJi(d:number,o:number,ctx:SharedContext):boolean{return ctx.jiShen.includes(ORDER[(d+o)%5]);}
export function personalityEngine(ctx:SpecContext):string[]{return[`日主${ctx.dayGan}：身${ctx.dayStrength}。`];}
export function analyzePersonality(ctx:SharedContext):AnalysisItem[]{
  const items:AnalysisItem[]=[]; const dg=ctx.dayGan, di=ORDER.indexOf(ctx.dayEl);
  const totalScore=Object.values(ctx.elementBalance.scores).reduce((a:number,b:number)=>a+b,0)||1;
  const trait=C().dayGanTraits?.[dg]; if(trait)items.push({level:'确定',layer1:trait.l1,layer2:trait.l2,layer3:trait.l3});
  const jc=ctx.jiShen.length; const t2=ctx.dayStrength==='身强'?(jc>0?C().strongJi:C().strongYong):(jc>0?C().weakJi:C().weakYong);
  if(t2)items.push({level:'确定',layer1:t2.l1,layer2:t2.l2,layer3:t2.l3});
  function pick(p:string,s:number,o:number):any{const strong=s>totalScore*0.1;const key=p+(strong?'strong':'weak')+(elIsJi(di,o,ctx)?'Ji':'Yong');return C()[key];}
  if(ctx.officials.strength!=='无'){const t=pick('officials_',ctx.officials.score,3);if(t)items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});}
  if(ctx.outputStars.strength!=='无'){const t=pick('output_',ctx.outputStars.score,1);if(t)items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});}
  if(ctx.seals.strength!=='无'){const t=pick('seals_',ctx.seals.score,4);if(t)items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});}
  if(ctx.peers.strength!=='无'){const t=pick('peers_',ctx.peers.score,0);if(t)items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});}
  for(const el of ctx.elementBalance.missing){const t=C().missingElements?.[el];if(t)items.push({level:'参考',layer1:t.l1,layer2:t.l2,layer3:t.l3});}
  return items;
}

import type { SharedContext } from './shared/context.js';
import type { AnalysisItem, SpecContext } from './types.js';
import { fileURLToPath } from 'url'; import { dirname, join } from 'path';
import { loadContent, loadBase, isStarJi } from './shared/content-loader.js';
const __dirname = dirname(fileURLToPath(import.meta.url));
const CDIR = join(__dirname, 'content'); const DIM = 'personality';
function Y():any{return loadContent(CDIR,DIM,'yong');}
function J():any{return loadContent(CDIR,DIM,'ji');}
function B():any{return loadBase(CDIR,DIM);}
export function personalityEngine(ctx:SpecContext):string[]{return[`日主${ctx.dayGan}：身${ctx.dayStrength}。`];}
export function analyzePersonality(ctx:SharedContext):AnalysisItem[]{
  const items:AnalysisItem[]=[]; const dg=ctx.dayGan;
  const totalScore=Object.values(ctx.elementBalance.scores).reduce((a:number,b:number)=>a+b,0)||1;
  const trait=B().dayGanTraits?.[dg]; if(trait)items.push({level:'确定',layer1:trait.l1,layer2:trait.l2,layer3:trait.l3});
  const jc=ctx.jiShen.length; const t2=ctx.dayStrength==='身强'?(jc>0?J().strong:Y().strong):(jc>0?J().weak:Y().weak);
  if(t2)items.push({level:'确定',layer1:t2.l1,layer2:t2.l2,layer3:t2.l3});
  function pick(prefix:string,s:number,offset:number):any{const strong=s>totalScore*0.1;const t=isStarJi(ctx,offset)?J():Y();const key=prefix+(strong?'_strong':'_weak');return t[key]||t[prefix];}
  if(ctx.officials.strength!=='无'){const t=pick('officials',ctx.officials.score,3);if(t)items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});}
  if(ctx.outputStars.strength!=='无'){const t=pick('output',ctx.outputStars.score,1);if(t)items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});}
  if(ctx.seals.strength!=='无'){const t=pick('seals',ctx.seals.score,4);if(t)items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});}
  if(ctx.peers.strength!=='无'){const t=pick('peers',ctx.peers.score,0);if(t)items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});}
  for(const el of ctx.elementBalance.missing){const t=B().missingElements?.[el];if(t)items.push({level:'参考',layer1:t.l1,layer2:t.l2,layer3:t.l3});}
  return items;
}

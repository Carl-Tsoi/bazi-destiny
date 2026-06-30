import type { SharedContext } from './shared/context.js';
import type { AnalysisItem, SpecContext } from './types.js';
import { fileURLToPath } from 'url'; import { dirname, join } from 'path';
import { loadContent, loadBase, isStarJi } from './shared/content-loader.js';
const __dirname = dirname(fileURLToPath(import.meta.url));
const CDIR = join(__dirname, 'content'); const DIM = 'personality';
function Y():any{return loadContent(CDIR,DIM,'yong');}
function J():any{return loadContent(CDIR,DIM,'ji');}
function B():any{return loadBase(CDIR,DIM);}
const ORD=['木','火','土','金','水'];
export function personalityEngine(ctx:SpecContext):string[]{return[`日主${ctx.dayGan}：身${ctx.dayStrength}。`];}
export function analyzePersonality(ctx:SharedContext):AnalysisItem[]{
  const items:AnalysisItem[]=[]; const dg=ctx.dayGan, di=ORD.indexOf(ctx.dayEl);
  const total=ctx.totalScore;
  function elScore(off:number):number{return ctx.elementScores[ORD[(di+off)%5]]||0;}
  function pick(prefix:string,off:number):any{
    const t=isStarJi(ctx,off)?J():Y(); const s=elScore(off)>total*0.1;
    return t[prefix+(s?'_strong':'_weak')]||t[prefix];
  }
  const trait=B().dayGanTraits?.[dg]; if(trait)items.push({level:'确定',layer1:trait.l1,layer2:trait.l2,layer3:trait.l3});
  const jc=ctx.jiShen.length; const t2=ctx.dayStrength==='身强'?(jc>0?J().strong:Y().strong):(jc>0?J().weak:Y().weak);
  if(t2)items.push({level:'确定',layer1:t2.l1,layer2:t2.l2,layer3:t2.l3});
  if(ctx.officials.present){const t=pick('officials',3);if(t)items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});}
  if(ctx.outputStars.present){const t=pick('output',1);if(t)items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});}
  if(ctx.seals.present){const t=pick('seals',4);if(t)items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});}
  if(ctx.peers.present){const t=pick('peers',0);if(t)items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});}
  for(const el of ctx.missingElements){const t=B().missingElements?.[el];if(t)items.push({level:'参考',layer1:t.l1,layer2:t.l2,layer3:t.l3});}
  return items;
}

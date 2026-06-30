import type { SharedContext } from './shared/context.js';
import type { AnalysisItem, SpecContext } from './types.js';
import { fileURLToPath } from 'url'; import { dirname, join } from 'path';
import { loadContent, isStarJi } from './shared/content-loader.js';
const __dirname = dirname(fileURLToPath(import.meta.url));
const CDIR = join(__dirname, 'content'); const DIM = 'wealth';
function Y():any{return loadContent(CDIR,DIM,'yong');}
function J():any{return loadContent(CDIR,DIM,'ji');}
const ORD=['木','火','土','金','水'];
export function wealthEngine(ctx:SpecContext):string[]{return[''];};
export function analyzeWealth(ctx:SharedContext):AnalysisItem[]{
  const items:AnalysisItem[]=[]; const di=ORD.indexOf(ctx.dayEl);
  const total=ctx.totalScore;
  function elScore(off:number):number{return ctx.elementScores[ORD[(di+off)%5]]||0;}
  function s(off:number):boolean{return elScore(off)>total*0.1;}
  if(ctx.wealthStars.present){const ji=isStarJi(ctx,2);const key='财星_'+(s(2)?'strong':'weak');const t=(ji?J():Y())[key];if(t)items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});}
  if(ctx.outputStars.present){const ji=isStarJi(ctx,1);const t=(ji?J():Y())['食伤生财'];if(t)items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});}
  if(ctx.peers.present){const t=J()['比劫夺财'];if(t)items.push({level:'参考',layer1:t.l1,layer2:t.l2,layer3:t.l3});}
  return items;
}

import type { SharedContext } from './shared/context.js';
import type { AnalysisItem, SpecContext } from './types.js';
import { fileURLToPath } from 'url'; import { dirname, join } from 'path';
import { loadContent, isStarJi } from './shared/content-loader.js';
const __dirname = dirname(fileURLToPath(import.meta.url));
const CDIR = join(__dirname, 'content'); const DIM = 'benefactors';
function Y():any{return loadContent(CDIR,DIM,'yong');}
function J():any{return loadContent(CDIR,DIM,'ji');}
const ORD=['木','火','土','金','水'];
export function benefactorsEngine(ctx:SpecContext):string[]{return[''];};
export function analyzeBenefactors(ctx:SharedContext):AnalysisItem[]{
  const items:AnalysisItem[]=[]; const di=ORD.indexOf(ctx.dayEl);
  const total=Object.values(ctx.elementScores).reduce((a,b)=>a+b,0)||1;
  // 比劫 → 朋友/同事/合伙人
  if(ctx.peers.present){
    const peerScore=ctx.elementScores[ctx.dayEl]||0; const s=peerScore>total*0.1;
    const ji=isStarJi(ctx,0); const key='peers_'+(s?'strong':'weak');
    const t=(ji?J():Y())[key]; if(t)items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});
  }
  // 官杀 → 上司/贵人提携
  if(ctx.officials.present){
    const ji=isStarJi(ctx,3); const t=(ji?J():Y())['officials'];
    if(t)items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});
  }
  // 印星 → 长辈/师长/靠山
  if(ctx.seals.present){
    const ji=isStarJi(ctx,4); const t=(ji?J():Y())['seals'];
    if(t)items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});
  }
  return items;
}

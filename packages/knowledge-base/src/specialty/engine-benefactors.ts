import type { SharedContext } from './shared/context.js';
import type { AnalysisItem, SpecContext } from './types.js';
import { fileURLToPath } from 'url'; import { dirname, join } from 'path';
import { loadContent, loadBase, isStarJi } from './shared/content-loader.js';
const __dirname = dirname(fileURLToPath(import.meta.url));
const CDIR = join(__dirname, 'content'); const DIM = 'benefactors';
function Y():any{return loadContent(CDIR,DIM,'yong');}
function J():any{return loadContent(CDIR,DIM,'ji');}
function B():any{return loadBase(CDIR,DIM);}
const ORD=['木','火','土','金','水'];
export function benefactorsEngine(ctx:SpecContext):string[]{return[''];};
export function analyzeBenefactors(ctx:SharedContext):AnalysisItem[]{
  const items:AnalysisItem[]=[]; const di=ORD.indexOf(ctx.dayEl);
  const total=ctx.totalScore;
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
  // 兜底：无特定贵人星时，输出通用人际建议
  if(items.length===0){
    const g=B().general; if(g)items.push({level:'参考',layer1:g.l1,layer2:g.l2,layer3:g.l3});
  }
  return items;
}

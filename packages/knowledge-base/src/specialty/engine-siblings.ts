import type { SharedContext } from './shared/context.js';
import type { AnalysisItem, SpecContext } from './types.js';
import { fileURLToPath } from 'url'; import { dirname, join } from 'path';
import { loadContent, loadBase, isStarJi } from './shared/content-loader.js';
const __dirname = dirname(fileURLToPath(import.meta.url));
const CDIR = join(__dirname, 'content'); const DIM = 'siblings';
function Y():any{return loadContent(CDIR,DIM,'yong');}
function J():any{return loadContent(CDIR,DIM,'ji');}
function B():any{return loadBase(CDIR,DIM);}
const ORD=['木','火','土','金','水'];
export function siblingsEngine(ctx:SpecContext):string[]{return[''];};
export function analyzeSiblings(ctx:SharedContext):AnalysisItem[]{
  const items:AnalysisItem[]=[]; const di=ORD.indexOf(ctx.dayEl);
  if(ctx.peers.present){
    const ji=isStarJi(ctx,0);
    const peerScore=ctx.elementScores[ctx.dayEl]||0;
    const total=ctx.totalScore;
    const s=peerScore>total*0.1;
    const key='peers_'+(s?'strong':'weak');
    const t=(ji?J():Y())[key]||(ji?J():Y())['peers'];
    if(t)items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});
  } else {
    // 兜底：无比劫时输出一般性解读
    const g=B().noPeers; if(g)items.push({level:'参考',layer1:g.l1,layer2:g.l2,layer3:g.l3});
  }
  // 月柱为兄弟宫
  if(ctx.siblingsPalace.isYongShen){
    const t=Y()['monthPalace']; if(t)items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});
  }else if(ctx.siblingsPalace.isJiShen){
    const t=J()['monthPalace']; if(t)items.push({level:'参考',layer1:t.l1,layer2:t.l2,layer3:t.l3});
  }
  return items;
}

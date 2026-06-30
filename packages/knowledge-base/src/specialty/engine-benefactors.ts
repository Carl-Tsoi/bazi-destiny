import type { SharedContext } from './shared/context.js';
import type { AnalysisItem, SpecContext } from './types.js';
import { fileURLToPath } from 'url'; import { dirname, join } from 'path';
import { loadContent } from './shared/content-loader.js';
const __dirname = dirname(fileURLToPath(import.meta.url));
const CDIR = join(__dirname, 'content'); const DIM = 'benefactors';
function Y():any{return loadContent(CDIR,DIM,'yong');}
function J():any{return loadContent(CDIR,DIM,'ji');}
const ORDER=['木','火','土','金','水'];
function strong(s:number,ctx:SharedContext):boolean{const t=Object.values(ctx.elementBalance.scores).reduce((a:number,b:number)=>a+b,0)||1;return s>t*0.1;}
export function benefactorsEngine(ctx:SpecContext):string[]{return[''];};
export function analyzeBenefactors(ctx:SharedContext):AnalysisItem[]{
  const items:AnalysisItem[]=[],di=ORDER.indexOf(ctx.dayEl);
  if(ctx.peers.present){
    const ji=ctx.jiShen.includes(ORDER[di]); const s=strong(ctx.peers.score,ctx);
    const key='peers_'+(s?'strong':'weak');
    const t=(ji?J():Y())[key]; if(t)items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});
  }
  return items;
}

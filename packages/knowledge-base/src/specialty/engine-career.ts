import type { SharedContext } from './shared/context.js';
import type { AnalysisItem, SpecContext } from './types.js';
import { fileURLToPath } from 'url'; import { dirname, join } from 'path';
import { loadContent, loadBase } from './shared/content-loader.js';
const __dirname = dirname(fileURLToPath(import.meta.url));
const CDIR = join(__dirname, 'content'); const DIM = 'career';
function Y():any{return loadContent(CDIR,DIM,'yong');}
function J():any{return loadContent(CDIR,DIM,'ji');}
function B():any{return loadBase(CDIR,DIM);}
const ORDER=['木','火','土','金','水'];
function elJi(dayIdx:number,offset:number,ctx:SharedContext):boolean{return ctx.jiShen.includes(ORDER[(dayIdx+offset)%5]);}
function strong(score:number,ctx:SharedContext):boolean{const t=Object.values(ctx.elementBalance.scores).reduce((a:number,b:number)=>a+b,0)||1;return score>t*0.1;}
export function careerEngine(ctx:SpecContext):string[]{return['事业分析需结合命局。'];}
export function analyzeCareer(ctx:SharedContext):AnalysisItem[]{
  const items:AnalysisItem[]=[],di=ORDER.indexOf(ctx.dayEl);
  // 官杀(克我 offset 3)
  if(ctx.officials.strength!=='无'){
    const ji=elJi(di,3,ctx),s=strong(ctx.officials.score,ctx);
    const t=(ji?J():Y())['官杀有力']; if(t)items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});
  }
  // 食伤(我生 offset 1)
  if(ctx.outputStars.strength!=='无'){
    const ji=elJi(di,1,ctx); const t=(ji?J():Y())['食伤生财'];
    if(t)items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});
  }
  // 印星(生我 offset 4)
  if(ctx.seals.strength!=='无'){
    const s=strong(ctx.seals.score,ctx); const t=Y()['印星为用_'+(s?'strong':'weak')];
    if(t)items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});
  }
  // 官印相生 (both present)
  if(ctx.officials.strength!=='无'&&ctx.seals.strength!=='无'){
    const ji=elJi(di,3,ctx); const t=(ji?J():Y())['官印相生'];
    if(t)items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});
  }
  // 行业方向
  const ind=B().industryDirections?.[ctx.yongShen];
  if(ind)items.push({level:'参考',layer1:`用神为${ctx.yongShen}，宜${ind}`,layer2:'与用神五行相符的行业更容易发挥优势',layer3:'优先考虑该方向'});
  return items;
}

import type { SharedContext } from './shared/context.js';
import type { AnalysisItem, SpecContext } from './types.js';
import { fileURLToPath } from 'url'; import { dirname, join } from 'path';
import { loadContent, loadBase, isStarJi } from './shared/content-loader.js';
const __dirname = dirname(fileURLToPath(import.meta.url));
const CDIR = join(__dirname, 'content'); const DIM = 'career';
function Y():any{return loadContent(CDIR,DIM,'yong');}
function J():any{return loadContent(CDIR,DIM,'ji');}
function B():any{return loadBase(CDIR,DIM);}
function strong(score:number,ctx:SharedContext):boolean{const t=Object.values(ctx.elementBalance.scores).reduce((a:number,b:number)=>a+b,0)||1;return score>t*0.1;}
export function careerEngine(ctx:SpecContext):string[]{return['事业分析需结合命局。'];}
export function analyzeCareer(ctx:SharedContext):AnalysisItem[]{
  const items:AnalysisItem[]=[];
  // 官杀(克我 offset 3)
  if(ctx.officials.strength!=='无'){
    const ji=isStarJi(ctx,3),s=strong(ctx.officials.score,ctx);
    const t=(ji?J():Y())['官杀有力']; if(t)items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});
  }
  // 食伤(我生 offset 1)
  if(ctx.outputStars.strength!=='无'){
    const ji=isStarJi(ctx,1); const t=(ji?J():Y())['食伤生财'];
    if(t)items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});
  }
  // 印星(生我 offset 4)
  if(ctx.seals.strength!=='无'){
    const ji=isStarJi(ctx,4),s=strong(ctx.seals.score,ctx);
    const t=(ji?J():Y())['印星_'+(s?'strong':'weak')];
    if(t&&t.l1)items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});
  }
  // 官印相生 (both present)
  if(ctx.officials.strength!=='无'&&ctx.seals.strength!=='无'){
    const ji=isStarJi(ctx,3); const t=(ji?J():Y())['官印相生'];
    if(t)items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});
  }
  // 行业方向 (取主用神)
  const primaryYong = ctx.yongShen[0];
  const ind=B().industryDirections?.[primaryYong];
  if(ind)items.push({level:'参考',layer1:`用神为${primaryYong}，宜${ind}`,layer2:'与用神五行相符的行业更容易发挥优势',layer3:'优先考虑该方向'});
  return items;
}

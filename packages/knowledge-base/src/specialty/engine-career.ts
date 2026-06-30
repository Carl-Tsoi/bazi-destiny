import type { SharedContext } from './shared/context.js';
import type { AnalysisItem, SpecContext } from './types.js';
import { fileURLToPath } from 'url'; import { dirname, join } from 'path';
import { loadContent, loadBase, isStarJi } from './shared/content-loader.js';
const __dirname = dirname(fileURLToPath(import.meta.url));
const CDIR = join(__dirname, 'content'); const DIM = 'career';
function Y():any{return loadContent(CDIR,DIM,'yong');}
function J():any{return loadContent(CDIR,DIM,'ji');}
function B():any{return loadBase(CDIR,DIM);}
const ORD=['木','火','土','金','水'];
export function careerEngine(ctx:SpecContext):string[]{return['事业分析需结合命局。'];}
export function analyzeCareer(ctx:SharedContext):AnalysisItem[]{
  const items:AnalysisItem[]=[],di=ORD.indexOf(ctx.dayEl);
  const total=ctx.totalScore;
  function es(off:number):number{return ctx.elementScores[ORD[(di+off)%5]]||0;}
  function strong(off:number):boolean{return es(off)>total*0.1;}

  // 官杀: 只在该星有力时才输出
  if(ctx.officials.present && strong(3)){
    const ji=isStarJi(ctx,3);const t=(ji?J():Y())['官杀有力'];
    if(t)items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});
  }
  // 食伤生财: 无强弱要求
  if(ctx.outputStars.present){
    const ji=isStarJi(ctx,1);const t=(ji?J():Y())['食伤生财'];
    if(t)items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});
  }
  // 印星: 按强弱选 key
  if(ctx.seals.present){
    const ji=isStarJi(ctx,4);const s=strong(4);
    const t=(ji?J():Y())['印星_'+(s?'strong':'weak')];
    if(t&&t.l1)items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});
  }
  // 官印相生: 需两者都有力
  if(ctx.officials.present&&ctx.seals.present&&strong(3)&&strong(4)){
    const ji=isStarJi(ctx,3);const t=(ji?J():Y())['官印相生'];
    if(t)items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});
  }
  // 行业方向
  const primaryYong=ctx.yongShen[0];const ind=B().industryDirections?.[primaryYong];
  if(ind)items.push({level:'参考',layer1:`用神为${primaryYong}，宜${ind}`,layer2:'与用神五行相符的行业更容易发挥优势',layer3:'优先考虑该方向'});
  return items;
}

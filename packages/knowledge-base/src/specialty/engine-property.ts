import type { SharedContext } from './shared/context.js';
import type { AnalysisItem, SpecContext } from './types.js';
import { fileURLToPath } from 'url'; import { dirname, join } from 'path';
import { loadContent, isStarJi } from './shared/content-loader.js';
const __dirname = dirname(fileURLToPath(import.meta.url));
const CDIR = join(__dirname, 'content'); const DIM = 'property';
function Y():any{return loadContent(CDIR,DIM,'yong');}
function J():any{return loadContent(CDIR,DIM,'ji');}
const ORD=['木','火','土','金','水'];
export function propertyEngine(ctx:SpecContext):string[]{return[''];};
export function analyzeProperty(ctx:SharedContext):AnalysisItem[]{
  const items:AnalysisItem[]=[],di=ORD.indexOf(ctx.dayEl);
  const total=ctx.totalScore;
  function isStrong(off:number):boolean{return(ctx.elementScores[ORD[(di+off)%5]]||0)>total*0.1;}
  // 印星 → 房产/不动产
  if(ctx.seals.present){
    const s=isStrong(4); const ji=isStarJi(ctx,4);
    const key=(ji?'ji':'yong')+'_'+(s?'strong':'weak');
    const t=(ji?J():Y())[key]; if(t)items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});
  }
  // 财星 → 置业能力/资产积累
  if(ctx.wealthStars.present){
    const s=isStrong(2); const ji=isStarJi(ctx,2);
    const key='wealth_'+(s?'strong':'weak');
    const t=(ji?J():Y())[key]; if(t)items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});
  }
  // 官杀 → 房产法律/贷款/产权
  if(ctx.officials.present){
    const ji=isStarJi(ctx,3); const t=(ji?J():Y())['officials'];
    if(t)items.push({level:'参考',layer1:t.l1,layer2:t.l2,layer3:t.l3});
  }
  return items;
}

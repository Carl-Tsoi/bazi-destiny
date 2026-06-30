import type { SharedContext } from './shared/context.js';
import type { AnalysisItem, SpecContext } from './types.js';
import { fileURLToPath } from 'url'; import { dirname, join } from 'path';
import { loadContent, loadBase } from './shared/content-loader.js';
const __dirname = dirname(fileURLToPath(import.meta.url));
const CDIR = join(__dirname, 'content'); const DIM = 'health';
function Y():any{return loadContent(CDIR,DIM,'yong');}
function J():any{return loadContent(CDIR,DIM,'ji');}
function B():any{return loadBase(CDIR,DIM);}
export function healthEngine(ctx:SpecContext):string[]{return[''];};
export function analyzeHealth(ctx:SharedContext):AnalysisItem[]{
  const items:AnalysisItem[]=[],organs=B().elementOrgans||{};
  const avg=Object.values(ctx.elementScores).filter(v=>v>0).reduce((a,b)=>a+b,0)/(Object.values(ctx.elementScores).filter(v=>v>0).length||1);
  // 五行缺失 → 优先查找元素特定条目，fallback 到通用模板
  for(const el of ctx.missingElements){
    const o=organs[el]||el;
    const t=B()['deficient_'+el]||B().deficient; if(t)items.push({level:'确定',layer1:t.l1.replace('{el}',el).replace('{organ}',o),layer2:t.l2.replace('{el}',el),layer3:t.l3.replace('{el}',el)});
  }
  // 五行过旺 → 优先查找元素特定条目
  for(const el of Object.keys(ctx.elementScores)){
    const v=ctx.elementScores[el]||0; if(v<=avg*2) continue;
    const o=organs[el]||el;
    if(ctx.jiShen.includes(el)){
      const t=J()['excess_'+el]||J().excess; if(t)items.push({level:'确定',layer1:t.l1.replace('{el}',el).replace('{organ}',o),layer2:t.l2.replace('{el}',el),layer3:t.l3.replace('{el}',el)});
    }else{
      const t=B()['deficient_'+el]||B().deficient; if(t)items.push({level:'参考',layer1:t.l1.replace('{el}',el).replace('{organ}',o),layer2:t.l2.replace('{el}',el),layer3:t.l3.replace('{el}',el)});
    }
  }
  return items;
}

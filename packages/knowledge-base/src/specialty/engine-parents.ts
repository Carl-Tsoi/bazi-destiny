/**
 * 专项引擎: 父母 (7/11) v2: 喜忌双轨
 */
import type { SharedContext } from './shared/context.js';
import type { AnalysisItem, SpecContext } from './types.js';
import { readFileSync } from 'fs'; import { fileURLToPath } from 'url'; import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
let _c: any = null; function C(): any { if(!_c) _c=JSON.parse(readFileSync(join(__dirname,'content','parents.json'),'utf-8')); return _c; }
export function parentsEngine(ctx:SpecContext):string[]{return['父母分析需结合具体命局。'];}
export function analyzeParents(ctx:SharedContext):AnalysisItem[]{
  const items:AnalysisItem[]=[];
  if(ctx.parentsPalace.isYongShen){const r=C().yearYong;if(r)items.push({level:'确定',layer1:r.l1,layer2:r.l2,layer3:r.l3});}
  else if(ctx.parentsPalace.isJiShen){const r=C().yearJi;if(r)items.push({level:'确定',layer1:r.l1,layer2:r.l2,layer3:r.l3});}
  const sealIsJi=ctx.jiShen.some(j=>ctx.seals.positions.join('').includes(j));
  if(ctx.seals.strength==='强'||ctx.seals.strength==='一般'){
    if(sealIsJi){const r=C().sealJi;if(r)items.push({level:'确定',layer1:r.l1,layer2:r.l2,layer3:r.l3});}
    else{const r=C().sealYong;if(r)items.push({level:'确定',layer1:r.l1,layer2:r.l2,layer3:r.l3});}
  }
  return items;
}

/**
 * 专项引擎: 健康 (5/11)
 */
import type { SharedContext } from './shared/context.js';
import type { AnalysisItem, SpecContext } from './types.js';
import { readFileSync } from 'fs'; import { fileURLToPath } from 'url'; import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
let _c: any = null; function C(): any { if(!_c) _c=JSON.parse(readFileSync(join(__dirname,'content','health.json'),'utf-8')); return _c; }
export function healthEngine(ctx:SpecContext):string[]{const c:string[]=[];c.push('健康需结合五行平衡和大运流年看。');return c;}
export function analyzeHealth(ctx:SharedContext):AnalysisItem[]{
  const items:AnalysisItem[]=[];
  const bal=ctx.elementBalance,organs=C().elementOrgans||{};
  for(const el of bal.excess){
    const organ=organs[el]||el; const t=C().excess;
    if(t)items.push({level:'确定',layer1:t.l1.replace('{el}',el).replace('{organ}',organ),layer2:t.l2.replace('{el}',el),layer3:t.l3.replace('{el}',el)});
  }
  for(const el of [...bal.missing,...bal.weak]){
    const organ=organs[el]||el; const t=C().deficient;
    if(t)items.push({level:'确定',layer1:t.l1.replace('{el}',el).replace('{organ}',organ),layer2:t.l2.replace('{el}',el),layer3:t.l3.replace('{el}',el)});
  }
  if(ctx.spousePalace.clashes.length>0){const t=C().clashHealth;if(t)items.push({level:'参考',layer1:t.l1,layer2:t.l2,layer3:t.l3});}
  return items;
}

import type { SharedContext } from './shared/context.js';
import type { AnalysisItem, SpecContext } from './types.js';
import { readFileSync } from 'fs'; import { fileURLToPath } from 'url'; import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
let _c:any=null;function C():any{if(!_c)_c=JSON.parse(readFileSync(join(__dirname,'content','health.json'),'utf-8'));return _c;}
const ORDER=['木','火','土','金','水'];
export function healthEngine(ctx:SpecContext):string[]{return[''];};
export function analyzeHealth(ctx:SharedContext):AnalysisItem[]{
  const items:AnalysisItem[]=[],bal=ctx.elementBalance,organs=C().elementOrgans||{};
  for(const el of bal.missing){
    const o=organs[el]||el,t=C().deficient;if(t)items.push({level:'确定',layer1:t.l1.replace('{el}',el).replace('{organ}',o),layer2:t.l2.replace('{el}',el),layer3:t.l3.replace('{el}',el)});
  }
  for(const el of bal.excess){
    const o=organs[el]||el; const isJi=ctx.jiShen.includes(el);
    if(isJi){const t=C().excess_ji;if(t)items.push({level:'确定',layer1:t.l1.replace('{el}',el).replace('{organ}',o),layer2:t.l2.replace('{el}',el),layer3:t.l3.replace('{el}',el)});}
    else{const t=C().deficient;if(t)items.push({level:'参考',layer1:t.l1.replace('{el}',el).replace('{organ}',o),layer2:t.l2.replace('{el}',el),layer3:t.l3.replace('{el}',el)});}
  }
  return items;
}

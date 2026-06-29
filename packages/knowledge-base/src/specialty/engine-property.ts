import type { SharedContext } from './shared/context.js';
import type { AnalysisItem, SpecContext } from './types.js';
import { readFileSync } from 'fs'; import { fileURLToPath } from 'url'; import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
let _c: any = null; function C(): any { if(!_c) _c=JSON.parse(readFileSync(join(__dirname,'content','property.json'),'utf-8')); return _c; }
export function propertyEngine(ctx:SpecContext):string[]{return[''];};
export function analyzeProperty(ctx:SharedContext):AnalysisItem[]{
  const items:AnalysisItem[]=[];
  if(ctx.seals.present){
    const sealJi=ctx.seals.strength!=='无'&&ctx.jiShen.some(j=>['木','火','土','金','水'][(['木','火','土','金','水'].indexOf(ctx.dayEl)+4)%5]===j);
    const t=sealJi?C().sealJi:C().sealYong; if(t) items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});
  }
  return items;
}

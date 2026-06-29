import type { SharedContext } from './shared/context.js';
import type { AnalysisItem, SpecContext } from './types.js';
import { readFileSync } from 'fs'; import { fileURLToPath } from 'url'; import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
let _c: any = null; function C(): any { if(!_c) _c=JSON.parse(readFileSync(join(__dirname,'content','later-life.json'),'utf-8')); return _c; }
export function laterLifeEngine(ctx:SpecContext):string[]{return[''];};
export function analyzeLaterLife(ctx:SharedContext):AnalysisItem[]{
  const items:AnalysisItem[]=[];
  if(ctx.childrenPalace.isYongShen){const t=C().hourYong;if(t)items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});}
  else if(ctx.childrenPalace.isJiShen){const t=C().hourJi;if(t)items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});}
  return items;
}

/**
 * 专项引擎: 婚姻 (4/11)
 */
import type { SharedContext } from './shared/context.js';
import type { AnalysisItem, SpecContext } from './types.js';
import { readFileSync } from 'fs'; import { fileURLToPath } from 'url'; import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
let _c: any = null; function C(): any { if(!_c) _c=JSON.parse(readFileSync(join(__dirname,'content','marriage.json'),'utf-8')); return _c; }
export function marriageEngine(ctx:SpecContext):string[]{const c:string[]=[];c.push('婚姻需综合分析配偶星和夫妻宫。');return c;}
export function analyzeMarriage(ctx:SharedContext):AnalysisItem[]{
  const items:AnalysisItem[]=[];
  const sp=ctx.spousePalace,ssKey=ctx.officials.strength==='强'||ctx.wealthStars.strength==='强'?'强':ctx.officials.present||ctx.wealthStars.present?'一般':'弱';
  const ss=C().spouseStar?.[ssKey]; if(ss){items.push({level:'确定',layer1:ss.l1,layer2:ss.l2,layer3:ss.l3});}
  const gd=C().gender?.[ctx.gender]; if(gd){items.push({level:'确定',layer1:gd.l1,layer2:gd.l2,layer3:gd.l3});}
  if(sp.isYongShen){const p=C().spousePalace?.['用神'];if(p)items.push({level:'确定',layer1:p.l1,layer2:p.l2,layer3:p.l3});}
  else if(sp.isJiShen){const p=C().spousePalace?.['忌神'];if(p)items.push({level:'确定',layer1:p.l1,layer2:p.l2,layer3:p.l3});}
  if(sp.clashes.length>0){const p=C().spousePalace?.['逢冲'];if(p)items.push({level:'参考',layer1:p.l1,layer2:p.l2,layer3:p.l3});}
  return items;
}

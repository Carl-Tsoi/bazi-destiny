/**
 * 专项引擎: 田宅 (10/11)
 */
import type { SharedContext } from './shared/context.js';
import type { AnalysisItem, SpecContext } from './types.js';
import { readFileSync } from 'fs'; import { fileURLToPath } from 'url'; import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
let _c: any = null; function C(): any { if(!_c) _c=JSON.parse(readFileSync(join(__dirname,'content','property.json'),'utf-8')); return _c; }
export function propertyEngine(ctx:SpecContext):string[]{return ['田宅分析需结合具体命局。'];}
export function analyzeProperty(ctx:SharedContext):AnalysisItem[]{
  const items:AnalysisItem[]=[];
  const rules=C();
    if(ctx.seals.strength==='强'||ctx.seals.strength==='一般'){ const r=rules.sealGood; if(r)items.push({level:'确定',layer1:r.l1||'',layer2:r.l2||'',layer3:r.l3||''}); }
  if(ctx.wealthStars.strength==='强'){ const r=rules.wealthGood; if(r)items.push({level:'确定',layer1:r.l1||'',layer2:r.l2||'',layer3:r.l3||''}); }
  if(ctx.parentsPalace.isYongShen){ const r=rules.yearGood; if(r)items.push({level:'确定',layer1:r.l1||'',layer2:r.l2||'',layer3:r.l3||''}); }
  return items;
}

/**
 * 专项引擎: 子女 (6/11)
 */
import type { SharedContext } from './shared/context.js';
import type { AnalysisItem, SpecContext } from './types.js';
import { readFileSync } from 'fs'; import { fileURLToPath } from 'url'; import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
let _c: any = null; function C(): any { if(!_c) _c=JSON.parse(readFileSync(join(__dirname,'content','children.json'),'utf-8')); return _c; }
export function childrenEngine(ctx:SpecContext):string[]{return ['子女分析需结合具体命局。'];}
export function analyzeChildren(ctx:SharedContext):AnalysisItem[]{
  const items:AnalysisItem[]=[];
  const rules=C();
    if(ctx.outputStars.strength==='强'||ctx.outputStars.strength==='一般'){ const r=rules.outputStrong; if(r)items.push({level:'确定',layer1:r.l1||'',layer2:r.l2||'',layer3:r.l3||''}); }
  if(ctx.outputStars.strength==='无'||ctx.outputStars.strength==='弱'){ const r=rules.outputWeak; if(r)items.push({level:'确定',layer1:r.l1||'',layer2:r.l2||'',layer3:r.l3||''}); }
  if(ctx.childrenPalace.isYongShen){ const r=rules.hourGood; if(r)items.push({level:'确定',layer1:r.l1||'',layer2:r.l2||'',layer3:r.l3||''}); }
  if(ctx.childrenPalace.isJiShen){ const r=rules.hourBad; if(r)items.push({level:'确定',layer1:r.l1||'',layer2:r.l2||'',layer3:r.l3||''}); }
  return items;
}

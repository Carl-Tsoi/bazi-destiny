/**
 * 专项引擎: 兄弟 (9/11)
 */
import type { SharedContext } from './shared/context.js';
import type { AnalysisItem, SpecContext } from './types.js';
import { readFileSync } from 'fs'; import { fileURLToPath } from 'url'; import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
let _c: any = null; function C(): any { if(!_c) _c=JSON.parse(readFileSync(join(__dirname,'content','siblings.json'),'utf-8')); return _c; }
export function siblingsEngine(ctx:SpecContext):string[]{return ['兄弟分析需结合具体命局。'];}
export function analyzeSiblings(ctx:SharedContext):AnalysisItem[]{
  const items:AnalysisItem[]=[];
  const rules=C();
    if(ctx.peers.strength==='强'||ctx.peers.strength==='一般'){ const r=rules.peersMany; if(r)items.push({level:'确定',layer1:r.l1||'',layer2:r.l2||'',layer3:r.l3||''}); }
  if(ctx.peers.strength==='无'||ctx.peers.strength==='弱'){ const r=rules.peersFew; if(r)items.push({level:'确定',layer1:r.l1||'',layer2:r.l2||'',layer3:r.l3||''}); }
  if(ctx.siblingsPalace.isYongShen){ const r=rules.monthGood; if(r)items.push({level:'确定',layer1:r.l1||'',layer2:r.l2||'',layer3:r.l3||''}); }
  return items;
}

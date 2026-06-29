import type { SharedContext } from './shared/context.js';
import type { AnalysisItem, SpecContext } from './types.js';
import { readFileSync } from 'fs'; import { fileURLToPath } from 'url'; import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
let _c: any = null; function C(): any { if(!_c) _c=JSON.parse(readFileSync(join(__dirname,'content','siblings.json'),'utf-8')); return _c; }
export function siblingsEngine(ctx:SpecContext):string[]{return[''];};
export function analyzeSiblings(ctx:SharedContext):AnalysisItem[]{
  const items:AnalysisItem[]=[];
  if(ctx.peers.present){
    const peersJi=ctx.peers.strength!=='无'&&ctx.jiShen.includes(ctx.dayEl);
    const t=peersJi?C().peersJi:C().peersYong; if(t) items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});
  }
  return items;
}

import type { SharedContext } from './shared/context.js';
import type { AnalysisItem, SpecContext } from './types.js';
import { readFileSync } from 'fs'; import { fileURLToPath } from 'url'; import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
let _c: any = null; function C(): any { if(!_c) _c=JSON.parse(readFileSync(join(__dirname,'content','benefactors.json'),'utf-8')); return _c; }
export function benefactorsEngine(ctx:SpecContext):string[]{return['人际关系需结合具体命局。'];}
export function analyzeBenefactors(ctx:SharedContext):AnalysisItem[]{
  const items:AnalysisItem[]=[];
  const peersJi=ctx.peers.strength!=='无'&&ctx.jiShen.includes(ctx.dayEl); //比劫同五行
  if(ctx.peers.present){
    const t=peersJi?C().peersBad:C().peersGood; if(t) items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});
  }
  const outJi=ctx.outputStars.strength!=='无'&&ctx.jiShen.some(j=>['木','火','土','金','水'][(ctx.dayEl.charCodeAt(0))%5]===j); // simplified
  if(ctx.outputStars.present){
    const t=outJi?C().outputBad:C().outputGood; if(t) items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});
  }
  return items;
}

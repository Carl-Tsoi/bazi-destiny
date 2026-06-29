import type { SharedContext } from './shared/context.js';
import type { AnalysisItem, SpecContext } from './types.js';
import { readFileSync } from 'fs'; import { fileURLToPath } from 'url'; import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
let _c:any=null;function C():any{if(!_c)_c=JSON.parse(readFileSync(join(__dirname,'content','wealth.json'),'utf-8'));return _c;}
const ORDER=['木','火','土','金','水'];
function elJi(d:number,o:number,ctx:SharedContext):boolean{return ctx.jiShen.includes(ORDER[(d+o)%5]);}
function strong(s:number,ctx:SharedContext):boolean{const t=Object.values(ctx.elementBalance.scores).reduce((a:number,b:number)=>a+b,0)||1;return s>t*0.1;}
export function wealthEngine(ctx:SpecContext):string[]{return[''];};
export function analyzeWealth(ctx:SharedContext):AnalysisItem[]{
  const items:AnalysisItem[]=[],di=ORDER.indexOf(ctx.dayEl);
  // 财星(我克 offset 2)
  if(ctx.wealthStars.strength!=='无'){
    const ji=elJi(di,2,ctx),s=strong(ctx.wealthStars.score,ctx);
    const key='财星_'+(ji?'ji':'yong')+'_'+(s?'strong':'weak');
    const t=C()[key]; if(t)items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});
  }
  // 食伤生财
  if(ctx.outputStars.strength!=='无'){
    const ji=elJi(di,1,ctx); const t=ji?C()['食伤生财_ji']:C()['食伤生财_yong'];
    if(t)items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});
  }
  // 比劫夺财
  if(ctx.peers.strength==='强'||ctx.peers.strength==='一般'){
    const t=C()['比劫夺财']; if(t)items.push({level:'参考',layer1:t.l1,layer2:t.l2,layer3:t.l3});
  }
  return items;
}

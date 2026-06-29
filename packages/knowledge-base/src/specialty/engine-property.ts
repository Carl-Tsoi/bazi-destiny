import type { SharedContext } from './shared/context.js';
import type { AnalysisItem, SpecContext } from './types.js';
import { readFileSync } from 'fs'; import { fileURLToPath } from 'url'; import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
let _c:any=null;function C():any{if(!_c)_c=JSON.parse(readFileSync(join(__dirname,'content','property.json'),'utf-8'));return _c;}
const ORDER=['木','火','土','金','水'];
function strong(s:number,ctx:SharedContext):boolean{const t=Object.values(ctx.elementBalance.scores).reduce((a:number,b:number)=>a+b,0)||1;return s>t*0.1;}
export function propertyEngine(ctx:SpecContext):string[]{return[''];};
export function analyzeProperty(ctx:SharedContext):AnalysisItem[]{
  const items:AnalysisItem[]=[],di=ORDER.indexOf(ctx.dayEl);
  if(ctx.seals.present){
    const ji=ctx.jiShen.includes(ORDER[(di+4)%5]); const s=strong(ctx.seals.score,ctx);
    const key='yong_'+(ji?'ji':'yong')+'_'+(s?'strong':s?'strong':'weak');
    const t=C()[key]; if(t)items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});
  }
  return items;
}

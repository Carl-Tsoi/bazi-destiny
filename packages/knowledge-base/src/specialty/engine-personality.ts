/**
 * 专项引擎: 性格 (1/11) v2: 喜忌双轨
 */
import type { SharedContext } from './shared/context.js';
import type { AnalysisItem, SpecContext } from './types.js';
import { readFileSync } from 'fs'; import { fileURLToPath } from 'url'; import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
let _c: any = null; function C(): any { if(!_c) _c=JSON.parse(readFileSync(join(__dirname,'content','personality.json'),'utf-8')); return _c; }

const ORDER = ['木','火','土','金','水'];
function elIsJi(dayIdx: number, offset: number, ctx: SharedContext): boolean {
  const el = ORDER[(dayIdx + offset) % 5];
  return ctx.jiShen.includes(el);
}
function elIsYong(dayIdx: number, offset: number, ctx: SharedContext): boolean {
  const el = ORDER[(dayIdx + offset) % 5];
  return ctx.xiShen.includes(el);
}

export function personalityEngine(ctx:SpecContext):string[]{
  const p:string[]=[];
  p.push(`日主${ctx.dayGan}（${ctx.dayEl}）：身${ctx.dayStrength}，格局${ctx.pattern}。`);
  return p;
}

export function analyzePersonality(ctx:SharedContext):AnalysisItem[]{
  const items:AnalysisItem[]=[];
  const dg=ctx.dayGan, dayIdx=ORDER.indexOf(ctx.dayEl);

  // 1. 日干体性（不依赖喜忌）
  const trait=C().dayGanTraits?.[dg];
  if(trait) items.push({level:'确定',layer1:trait.l1,layer2:trait.l2,layer3:trait.l3});

  // 2. 身强/弱 + 喜忌
  const jiCount=ctx.jiShen.length, yongCount=ctx.xiShen.length;
  if(ctx.dayStrength==='身强'){
    const t=jiCount>yongCount?C().strongJi:C().strongYong;
    if(t) items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});
  } else {
    const t=jiCount>yongCount?C().weakJi:C().weakYong;
    if(t) items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});
  }

  // 辅助：pick template by strength + 喜忌
  function pick(prefix:string, strength:string, offset:number): any {
    const strong = strength==='强'||strength==='一般';
    const isJi = elIsJi(dayIdx, offset, ctx);
    const key = prefix + (strong?'strong':(strength==='弱'?'weak':'weak')) + (isJi?'Ji':'Yong');
    return C()[key];
  }

  // 3. 官杀 (offset 3)
  if(ctx.officials.strength!=='无'){const t=pick('officials_',ctx.officials.strength,3);if(t)items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});}
  // 4. 食伤 (offset 1)
  if(ctx.outputStars.strength!=='无'){const t=pick('output_',ctx.outputStars.strength,1);if(t)items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});}
  // 5. 印星 (offset 4)
  if(ctx.seals.strength!=='无'){const t=pick('seals_',ctx.seals.strength,4);if(t)items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});}
  // 6. 比劫 (offset 0)
  if(ctx.peers.strength!=='无'){const t=pick('peers_',ctx.peers.strength,0);if(t)items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});}

  // 7. 五行缺失
  for(const el of ctx.elementBalance.missing){
    const t=C().missingElements?.[el]; if(t) items.push({level:'参考',layer1:t.l1,layer2:t.l2,layer3:t.l3});
  }

  return items;
}

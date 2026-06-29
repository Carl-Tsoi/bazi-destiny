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

  // 3. 官杀 → 自律/冲动 (offset 3 =克日主)
  if(ctx.officials.strength==='强'||ctx.officials.strength==='一般'){
    const ji=elIsJi(dayIdx,3,ctx), t=ji?C().officialsJi:C().officialsYong;
    if(t) items.push({level:ji?'确定':'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});
  }

  // 4. 食伤 → 才华/叛逆 (offset 1 =日主生)
  if(ctx.outputStars.strength==='强'||ctx.outputStars.strength==='一般'){
    const ji=elIsJi(dayIdx,1,ctx), t=ji?C().outputJi:C().outputYong;
    if(t) items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});
  }

  // 5. 印星 → 学习/依赖 (offset 4 =生日主)
  if(ctx.seals.strength==='强'||ctx.seals.strength==='一般'){
    const ji=elIsJi(dayIdx,4,ctx), t=ji?C().sealsJi:C().sealsYong;
    if(t) items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});
  }

  // 6. 比劫 → 社交/损友 (offset 0 =同)
  if(ctx.peers.strength==='强'||ctx.peers.strength==='一般'){
    const ji=elIsJi(dayIdx,0,ctx), t=ji?C().peersJi:C().peersYong;
    if(t) items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});
  }

  // 7. 五行缺失
  for(const el of ctx.elementBalance.missing){
    const t=C().missingElements?.[el]; if(t) items.push({level:'参考',layer1:t.l1,layer2:t.l2,layer3:t.l3});
  }

  return items;
}

/** 婚姻引擎 */
import type { SpecContext } from './types.js';

export function marriageEngine(ctx: SpecContext): string[] {
  const m: string[] = [];
  m.push(`日支${ctx.dayZhi}为夫妻宫。`);
  if (['子','午','卯','酉'].includes(ctx.dayZhi)) m.push(`日坐四正桃花（${ctx.dayZhi}），配偶外貌气质出众。但桃花主动荡，感情需经营，否则外缘干扰大。`);
  if (ctx.isMale) {
    const ws=ctx.caiStars.filter(c=>c.shishen.includes('财'));
    if (ws.length>0) {
      m.push(`男命财星为妻，${ws.map(c=>`${c.pos}${c.gan}${c.zhi}`).join('、')}代表妻缘。`);
      if (ws.length>1) m.push('财星多现，异性缘多，易有感情纠葛。早婚波折，宜晚成家。');
    } else m.push('财星全无，男命无妻星。婚姻需大运财星引动，或日支夫妻宫得力方有良缘。');
  } else {
    const ss=[...ctx.officials,...ctx.killers];
    if (ss.length>0) {
      m.push(`女命官杀为夫，${ss.map(c=>`${c.pos}${c.gan}${c.zhi}`).join('、')}代表夫缘。`);
      if (ss.length>1) m.push('官杀混杂，感情经历丰富。正官为夫七杀为情人，需明辨良缘。');
    } else m.push('**官杀全无**，《渊海子平》云女命无官杀则夫星不显。婚姻缘分薄，需大运引动。');
  }
  const mz=ctx.monthZhi;const dz=ctx.dayZhi;
  if ((mz+dz==='子午'||mz+dz==='午子'||mz+dz==='卯酉'||mz+dz==='酉卯')) m.push('⚠ 月支冲日支（夫妻宫），《滴天髓》"夫妻宫逢冲，婚姻不顺"。易因外部因素感情破裂。');
  return m;
}

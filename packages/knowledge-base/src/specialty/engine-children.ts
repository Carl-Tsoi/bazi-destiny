/** 子女引擎 */
import type { SpecContext } from './types.js';

export function childrenEngine(ctx: SpecContext): string[] {
  const c: string[] = [];
  c.push(`时柱${ctx.ps.时柱.gan}${ctx.ps.时柱.zhi}为子女宫。`);
  if (ctx.foodHurtStars.length>0) c.push(`食伤为子女星（${ctx.foodHurtStars.map(f=>f.shishen).join('、')}），子女缘分深厚。${ctx.foodHurtStars.length>1?'子女较多，家庭热闹。':'独子或独女缘佳。'}`);
  else c.push('**食伤不显**：子女缘薄。时柱状态好虽迟但有，否则需防无子或少子。');
  if (['子','午','卯','酉'].includes(ctx.ps.时柱.zhi)) c.push('时支四正，子女貌美有出息。');
  const tc=ctx.allZhis.some(z=>['子午','午子','丑未','未丑','寅申','申寅','卯酉','酉卯','辰戌','戌辰','巳亥','亥巳'].includes(z+ctx.ps.时柱.zhi));
  if (tc) c.push('⚠ 时支逢冲，子女运有波折。养育需多加注意，亲子沟通是关键。');
  return c;
}

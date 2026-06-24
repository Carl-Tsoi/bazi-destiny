/** 父母引擎 */
import type { SpecContext } from './types.js';
import { hasSS } from './types.js';

export function parentsEngine(ctx: SpecContext): string[] {
  const p: string[] = [];
  p.push(`月柱${ctx.ps.月柱.gan}${ctx.ps.月柱.zhi}为父母宫。《渊海子平》"月为父母"。`);
  const zhengYin=hasSS(ctx.ps,'正印',true); const pianCai=hasSS(ctx.ps,'偏财',true);
  if (ctx.isMale) {
    if (pianCai.length>0) p.push(`男命偏财为父，${pianCai.map(c=>c.pos+c.gan+c.zhi).join('、')}透出，父缘深厚。`);
    else p.push('男命偏财不显，父缘或较淡薄，与父亲的连接需后天经营。');
  } else {
    const zc=ctx.caiStars.filter(c=>c.shishen.includes('正财'));
    if (zc.length>0) p.push(`女命正财为父，${zc.map(c=>c.pos+c.gan+c.zhi).join('、')}透出，父亲在经济或价值观方面影响较大。`);
  }
  if (zhengYin.length>0) p.push(`正印为母，${zhengYin.map(c=>c.pos+c.gan+c.zhi).join('、')}透出。母亲慈爱，在教育上影响深远。`);
  else if (ctx.yins.length>0) p.push(`印星为母（${ctx.yins.map(c=>c.shishen).join('、')}），母亲缘分不弱。`);
  else p.push('**印星全无**：母缘极薄。或早年与母亲分离、缺乏母爱滋养，性格中缺乏安全感。');
  return p;
}

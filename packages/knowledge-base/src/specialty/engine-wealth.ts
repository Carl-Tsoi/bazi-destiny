/** 财运引擎 */
import type { SpecContext } from './types.js';

export function wealthEngine(ctx: SpecContext): string[] {
  const w: string[] = [];
  if (ctx.caiStars.length>0) {
    w.push(`财星透出（${ctx.caiStars.map(c=>`${c.pos}${c.gan}${c.zhi}(${c.shishen})`).join('、')}），有求财意识与理财能力。`);
    if (ctx.isStrong) w.push('《子平真诠》"身强财旺，富格"。身强可担财，求财能力强。正财宜稳健储蓄，偏财可投资。');
    else w.push('身弱财旺，《神峰通考》言此"富屋贫人"。财多身弱反为财累，有钱也守不住。宜比劫运帮身担财。');
  } else w.push('**财星全无**：不擅理财，缺乏赚钱敏锐度。靠死工资过活，难有意外之财。宜食伤生财（技术变现）弥补。');
  if (ctx.foodHurtStars.length>0&&ctx.caiStars.length>0) w.push('食伤生财，财有源头如活水。善于将创意技术转化为财富，适合自主创业或副业。');
  if (ctx.biJie.length>=3) {
    if (ctx.isStrong) w.push('比劫林立克财，破财风险大。不宜合伙投资、担保借贷，朋友借钱需谨慎。');
    else w.push('比劫帮身，可通过合作方式求财。单打独斗不如团队作战。');
  }
  return w;
}

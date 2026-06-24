/** 健康引擎 */
import type { SpecContext } from './types.js';

export function healthEngine(ctx: SpecContext): string[] {
  const h: string[] = [];
  if (ctx.hurts.length>0) h.push('伤官泄身，需防精力透支、神经衰弱、失眠。宜劳逸结合，不可过度消耗。');
  if (ctx.killers.length>0) h.push('七杀攻身，有意外伤害、手术风险。宜加强锻炼，以运动化杀。');
  if (ctx.elements.size<=2) h.push(`**五行偏枯**：全局仅${ctx.elements.size}行，${[...ctx.elements].join('、')}过旺。对应脏腑长期超负荷，中年后必有健康问题。`);
  if (ctx.isStrong) h.push('身强体健，但有"过刚易折"之患。饮食不节、烟酒过度是主要风险。');
  else h.push('身弱体质需注重保养。规律作息、适度运动是保命之道。');
  return h;
}

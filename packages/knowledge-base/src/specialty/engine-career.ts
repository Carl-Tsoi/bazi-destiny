/** 事业引擎 */
import type { SpecContext } from './types.js';

export function careerEngine(ctx: SpecContext): string[] {
  const c: string[] = [];
  if (ctx.isStrong) {
    c.push('身强能担事，适合体制内、大企业管理、创业等高压岗位。《子平真诠》"身强方能任财官"。');
    if (ctx.killers.length>0) c.push('七杀透出，有魄力和开拓精神，适合军警、法务、金融等竞争性行业。');
    if (ctx.officials.length>0) c.push('正官透出，管理才能突出，公务员、行政管理等稳定且有社会地位的职业。');
  } else {
    c.push('身弱忌官杀克身。不适合体制内高压环境，宜自由职业、技术岗、中小型创业。');
    if (ctx.yins.length>0) c.push('印星护身，适合学术研究、教育、文化传媒等以知识为核心的行业。');
  }
  if (ctx.foodHurtStars.length>0&&ctx.caiStars.length>0) c.push('食伤生财格，技术变现能力强。适合工商贸易、互联网产品、技术创业。"凭本事吃饭"。');
  else if (ctx.foodHurtStars.length>0&&ctx.caiStars.length===0) c.push('有食伤才华但缺财星转化，会做事不会变现。需财星大运方可致富。');
  if (ctx.killers.length>0&&ctx.yins.length>0) c.push('杀印相生，文武双全。技术总监、法务主管、研究院所等权威技术岗位。');
  if (ctx.officials.length>0&&ctx.yins.length>0) c.push('官印相生，贵气十足。公务员、教师、行政管理，仕途较顺。');
  if (ctx.biJie.length>=3&&ctx.isStrong) c.push('比劫林立竞争激烈。不宜与人合伙创业，适合独立发展或借助平台。');
  return c;
}

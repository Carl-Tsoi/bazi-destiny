/** 贵人引擎 */
import type { SpecContext } from './types.js';

export function benefactorsEngine(ctx: SpecContext): string[] {
  const b: string[] = [];
  const tianYi:Record<string,string[]>={甲:['丑','未'],乙:['子','申'],丙:['亥','酉'],丁:['亥','酉'],戊:['丑','未'],己:['子','申'],庚:['丑','未'],辛:['午','寅'],壬:['卯','巳'],癸:['卯','巳']};
  const tyZhis=tianYi[ctx.dayGan]??[];
  const tyMatch=Object.entries(ctx.ps).filter(([,p])=>tyZhis.includes(p.zhi));
  if (tyMatch.length>0) b.push(`天乙贵人临${tyMatch.map(([k])=>k).join('、')}。一生遇难有助，关键时刻总有贵人。`);
  else b.push('**天乙贵人不临**：命中无贵人星，凡事靠自己。多行善事广结人脉弥补。');
  if (ctx.yins.length>0) b.push('印星为喜，多得长辈、师长提携。《渊海子平》"印绶者，生我者也"。');
  if (ctx.biJie.length>0&&ctx.isWeak) b.push('比劫帮身，朋友同辈中有贵人。');
  return b;
}

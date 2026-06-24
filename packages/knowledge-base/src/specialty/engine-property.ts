/** 田宅引擎 */
import type { SpecContext } from './types.js';

export function propertyEngine(ctx: SpecContext): string[] {
  const p: string[] = [];
  const kuZhi=['辰','戌','丑','未'];
  const kuMatch=Object.entries(ctx.ps).filter(([,p])=>kuZhi.includes(p.zhi));
  if (kuMatch.length>0) p.push(`命带${kuMatch.length}库（${kuMatch.map(([,p])=>p.zhi).join('、')}），《三命通会》"库者藏也"。不动产缘佳，有储蓄置产之象。${kuMatch.length>=3?'库多者家业丰厚，房产多。':''}`);
  else p.push('**命中无库**：不擅储蓄，钱财左手进右手出。置产需强制储蓄或大运补库。');
  if (ctx.yins.length>0) p.push('印星为房产之神，有置业安家之意。');
  if (ctx.caiStars.length>0) p.push('财星有力，具备购房置产的经济能力。');
  return p;
}

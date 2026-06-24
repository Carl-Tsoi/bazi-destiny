/**
 * Engine 6:三命奇格引擎 — 特殊格局检测
 */
import type { LayeredContext, EngineResult } from './types.js';

export function sanmingEngine(ctx: LayeredContext): EngineResult {
  const pillars = ctx.base.pillars;
  const zhis = [pillars.年柱.zhi, pillars.月柱.zhi, pillars.日柱.zhi, pillars.时柱.zhi];

  const patterns: string[] = [];

  const sets = [
    {name:'子午卯酉', members:['子','午','卯','酉']},
    {name:'寅申巳亥', members:['寅','申','巳','亥']},
    {name:'辰戌丑未', members:['辰','戌','丑','未']},
  ];
  for (const s of sets) { if (s.members.every(m=>zhis.includes(m))) patterns.push(`四位纯全(${s.name})`); }

  const kuiGang = ['庚辰','壬辰','戊戌','庚戌'];
  if (kuiGang.includes(pillars.日柱.gan+pillars.日柱.zhi)) patterns.push('魁罡');

  const luMap: Record<string,string> = {甲:'寅',乙:'卯',丙:'巳',丁:'午',戊:'巳',己:'午',庚:'申',辛:'酉',壬:'亥',癸:'子'};
  if (pillars.时柱.zhi === (luMap[pillars.日柱.gan]??'')) patterns.push('日禄归时');

  return {
    engine: '三命奇格',
    yongShen: null,
    diagnostics: patterns.length > 0 ? patterns : ['无特殊格局'],
    specialPattern: patterns.length > 0,
  };
}

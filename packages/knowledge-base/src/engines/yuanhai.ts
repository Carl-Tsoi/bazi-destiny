/**
 * Engine 5:渊海神煞引擎 — 补充注释
 */
import type { LayeredContext, EngineResult } from './types.js';

const GAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];

export function yuanhaiEngine(ctx: LayeredContext): EngineResult {
  const pillars = ctx.base.pillars;
  const dayGan = pillars.日柱.gan;
  const yearZhi = pillars.年柱.zhi;

  const shensha: string[] = [];
  const tianYi: Record<string,string[]> = {甲:['丑','未'],乙:['子','申'],丙:['亥','酉'],丁:['亥','酉'],戊:['丑','未'],己:['子','申'],庚:['丑','未'],辛:['午','寅'],壬:['卯','巳'],癸:['卯','巳']};
  if ((tianYi[dayGan]??[]).some(z=>Object.values(pillars).some(p=>p.zhi===z))) shensha.push('天乙贵人');

  const yangRen: Record<string,string> = {甲:'卯',丙:'午',戊:'午',庚:'酉',壬:'子'};
  if (Object.values(pillars).some(p=>p.zhi===(yangRen[dayGan]??''))) shensha.push('羊刃');

  return {
    engine: '渊海神煞',
    yongShen: null,
    diagnostics: shensha.length > 0 ? shensha : ['无特殊神煞'],
  };
}

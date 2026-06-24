/**
 * Engine 1:子平格局引擎 — 主框架
 *
 * 《子平真诠》:"八字用神，专求月令"
 * 月令定格 → 格局用神 → 成败救应
 * 此引擎的输出作为后续引擎的框架基础。
 */
import type { LayeredContext, EngineResult } from './types.js';

export function zipingEngine(ctx: LayeredContext): EngineResult {
  const pillars = ctx.base.pillars;
  const monthZhi = pillars.月柱.zhi;
  const monthCang = pillars.月柱.canggan;
  const allGans = [pillars.年柱.gan, pillars.月柱.gan, pillars.日柱.gan, pillars.时柱.gan];

  let pattern = '', patternSource = '';

  // 月令本气透干→定格局
  const mainQi = monthCang[0];
  if (mainQi && mainQi.tenGod !== '比肩' && mainQi.tenGod !== '劫财') {
    if (allGans.includes(mainQi.stem)) {
      pattern = mainQi.tenGod + '格';
      patternSource = '本气透干';
    }
  }
  // 余气透干
  if (!pattern) {
    const secQi = monthCang[1];
    if (secQi && secQi.tenGod !== '比肩' && secQi.tenGod !== '劫财') {
      if (allGans.includes(secQi.stem)) {
        pattern = secQi.tenGod + '格';
        patternSource = '余气透干';
      }
    }
  }
  // 均不透→取本气
  if (!pattern) {
    pattern = (mainQi?.tenGod ?? '') + '格';
    patternSource = '本气';
  }

  // 格局成败简判
  let status = '成格', remedy = '';
  if (pattern.includes('正官') || pattern.includes('七杀')) {
    const hasShangGuan = Object.values(pillars).some(p => p.shishen === '伤官');
    if (hasShangGuan) {
      status = '败格';
      const hasYin = Object.values(pillars).some(p => p.shishen.includes('印'));
      if (hasYin) { status = '败中有成'; remedy = '印制伤官护官'; }
    }
  }

  // 格局用神 = 月令主气十神对应的五行方向
  const dayEl = ctx.fuyi.elementScores ? '' : '';
  const yongShen = mainQi?.tenGod ? mainQi.tenGod : '';

  return {
    engine: '子平格局',
    yongShen: null, // 格局用神是框架,不直接输出元素
    yongShenType: '格局用神',
    diagnostics: [`格局:${pattern}(${patternSource})`, `状态:${status}${remedy ? ', 救应:' + remedy : ''}`],
  };
}

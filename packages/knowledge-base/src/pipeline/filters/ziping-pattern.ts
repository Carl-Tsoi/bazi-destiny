/**
 * 子平格局拦截器 (Priority 100)
 *
 * 基于《子平真诠》月令格局体系：
 * 1. 月令本气透干→定格局
 * 2. 判定格局成败（成格/败格/成中有败/败中有成）
 * 3. 给出格局层次的用神建议
 * 4. 产出资质标记（有情/无情、有力/无力）
 */
import type { AnalysisFilter, AnalysisContext, FilterOutput } from '../types.js';
import { BookName, setAnnotation } from '../../attributes/base-types.js';
import type { ZiPingAttributes } from '../../attributes/ziping.js';

//十神名称→五行关系
const PATTERN_SHISHEN = ['正官','七杀','正财','偏财','正印','偏印','食神','伤官','比肩','劫财'];

export const zipingPatternFilter: AnalysisFilter = {
  name: '子平格局',
  priority: 100,
  enabled: true,

  analyze(ctx: AnalysisContext): FilterOutput {
    const pillars = ctx.chart.base.pillars;
    const monthZhi = pillars.月柱.zhi;
    const monthGan = pillars.月柱.gan;
    const monthCang = pillars.月柱.canggan;

    // 月令本气
    const mainQi = monthCang[0];
    const mainShiShen = mainQi?.tenGod ?? '';
    // 余气
    const secondaryQi = monthCang[1];
    const secShiShen = secondaryQi?.tenGod ?? '';

    let pattern = '';
    let patternSource: ZiPingAttributes['patternSource'] = '本气';

    // 1. 本气透干？
    if (mainQi && mainShiShen !== '比肩' && mainShiShen !== '劫财') {
      const allGans = [pillars.年柱.gan, monthGan, pillars.日柱.gan, pillars.时柱.gan];
      if (allGans.some(g => g === mainQi.stem)) {
        pattern = mainShiShen + '格';
        patternSource = '本气透干';
      }
    }
    // 2. 余气透干？
    if (!pattern && secondaryQi && secShiShen !== '比肩' && secShiShen !== '劫财') {
      const allGans = [pillars.年柱.gan, monthGan, pillars.日柱.gan, pillars.时柱.gan];
      if (allGans.some(g => g === secondaryQi.stem)) {
        pattern = secShiShen + '格';
        patternSource = '余气透干';
      }
    }
    // 3. 均不透→取本气
    if (!pattern) {
      pattern = mainShiShen + '格';
      patternSource = '本气';
    }

    // 成格/败格简单判定
    let patternStatus: ZiPingAttributes['patternStatus'] = '成格';
    let remedy: string | null = null;

    // 败格条件(简化版)
    if (pattern.includes('正官') || pattern.includes('七杀')) {
      // 官杀格:忌食伤克官、忌官杀混杂
      const hasShangGuan = Object.values(pillars).some(p => p.shishen === '伤官');
      if (hasShangGuan) {
        patternStatus = '败格';
        // 救应:有印制伤官
        const hasYin = Object.values(pillars).some(p => p.shishen.includes('印'));
        if (hasYin) { patternStatus = '败中有成'; remedy = '印制伤官护官'; }
      }
    } else if (pattern.includes('印')) {
      // 印格:忌财破印
      const hasCaiTransparent = Object.values(pillars).some(p => p.shishen.includes('财') && PATTERN_SHISHEN.includes(p.shishen));
      if (hasCaiTransparent) {
        patternStatus = '败格';
        const hasGuan = Object.values(pillars).some(p => p.shishen === '正官');
        if (hasGuan) { patternStatus = '败中有成'; remedy = '官星通关财印'; }
      }
    }

    const attrs: ZiPingAttributes = {
      pattern,
      patternSource,
      yongShen: mainShiShen,
      xiangShen: remedy ? '官杀' : null,
      patternStatus,
      remedy,
      purity: { isPure: patternStatus === '成格', score: patternStatus === '成格' ? 80 : 50, mixedBy: [] },
      luckTransitions: [],
    };

    setAnnotation(ctx.chart, BookName.ZiPing, attrs as unknown as Record<string, unknown>);

    return {
      filterName: '子平格局',
      priority: 100,
      annotation: ctx.chart.annotations.find(a => a.book === BookName.ZiPing),
      diagnostics: [`格局:${pattern}(${patternSource}), 状态:${patternStatus}${remedy ? ', 救应:' + remedy : ''}`],
    };
  },
};

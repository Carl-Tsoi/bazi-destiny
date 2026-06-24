/**
 * 神峰病药拦截器 (Priority 400)
 *
 * 基于《神峰通考》病药说:有病方为贵
 * 结合现有的 method-bingyao.ts 结果，增加四病四药标注
 * Ref: docs/神峰通考_notebook.md
 */
import type { AnalysisFilter, AnalysisContext, FilterOutput } from '../types.js';
import { BookName, setAnnotation } from '../../attributes/base-types.js';
import type { ShenFengAttributes } from '../../attributes/shenfeng.js';

const ORDER = ['木','火','土','金','水'];

export const shenfengBingyaoFilter: AnalysisFilter = {
  name: '神峰病药',
  priority: 400,
  enabled: true,

  analyze(ctx: AnalysisContext): FilterOutput {
    const bingyao = ctx.baseYongShen.bingyao;
    const fuyi = ctx.baseYongShen.fuyi;
    const hasBing = bingyao.yongShen !== '通关';

    // 四病标记
    const scores = fuyi.elementScores;
    const total = Object.values(scores).reduce((a,b)=>a+b,0);
    const dayEl = ORDER.find(e => (scores[e] ?? 0) === fuyi.dayScore) ?? '';
    const maxEl = Object.entries(scores).sort(([,a],[,b])=>b-a)[0][0];

      const isWang = (scores[maxEl] ?? 0) >= total * 0.4;
    const isRuo = fuyi.dayStrength.includes('弱');

    const attrs: ShenFengAttributes = {
      fourBing: {
        diao: maxEl === dayEl && fuyi.dayStrength.includes('强'),
        ku: fuyi.dayScore <= 3,
        wang: isWang,
        ruo: isRuo,
      },
      fourYao: {
        sun: isWang ? bingyao.yongShen : null,
        yi: isRuo ? ORDER[(ORDER.indexOf(dayEl)+4)%5] : null,
        sheng: isWang ? ORDER[(ORDER.indexOf(maxEl)+4)%5] : null,
        zhang: isRuo ? dayEl : null,
      },
      bingYaoPair: hasBing ? { disease: maxEl, medicine: bingyao.yongShen, severity: (scores[maxEl]??0)>=total*0.5?'重':'中' } : null,
      yinYangFactor: { isYangStem: ['甲','丙','戊','庚','壬'].includes(ctx.chart.base.pillars.日柱.gan), monthYang: ['寅','卯','辰','巳','午','未'].includes(ctx.chart.base.pillars.月柱.zhi) },
      patternRank: hasBing ? ((scores[maxEl]??0)>=total*0.5 ? '大病大药' : '小病小药') : '中和无病',
    };

    setAnnotation(ctx.chart, BookName.ShenFeng, attrs as unknown as Record<string, unknown>);

    return {
      filterName: '神峰病药',
      priority: 400,
      annotation: ctx.chart.annotations.find(a => a.book === BookName.ShenFeng),
      diagnostics: [hasBing ? `病:${maxEl}(${scores[maxEl]}) 药:${bingyao.yongShen}` : '中和无病', `等级:${attrs.patternRank}`],
    };
  },
};

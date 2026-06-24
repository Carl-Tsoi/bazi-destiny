/**
 * 穷通调候拦截器 (Priority 300)
 *
 * 基于《穷通宝鉴》十干十二月调候 + 寒暖燥湿状态机
 * 重点：初春余寒影响生克效力、己土寅月冻土需丙火等
 * Ref: docs/穷通宝鉴_notebook.md
 */
import type { AnalysisFilter, AnalysisContext, FilterOutput } from '../types.js';
import { BookName, setAnnotation } from '../../attributes/base-types.js';
import type { QiongTongAttributes } from '../../attributes/qiongtong.js';

// 十干十二月调候表
const TIAOHOU: Record<string, Record<string, {pri:string;sec:string;avoid:string}>> = {
  甲:{寅:{pri:'丙',sec:'癸',avoid:'庚'},卯:{pri:'庚',sec:'丙丁戊己',avoid:''},辰:{pri:'庚',sec:'丁壬',avoid:''},巳:{pri:'癸',sec:'丁庚',avoid:''},午:{pri:'癸',sec:'丁庚',avoid:''},未:{pri:'癸',sec:'庚丁',avoid:''},申:{pri:'庚',sec:'丁',avoid:''},酉:{pri:'庚',sec:'丁丙',avoid:'丙'},戌:{pri:'庚',sec:'甲丁',avoid:''},亥:{pri:'庚',sec:'丁丙戊',avoid:''},子:{pri:'丁',sec:'庚丙',avoid:'癸'},丑:{pri:'丁',sec:'庚丙',avoid:'癸'}},
  乙:{寅:{pri:'丙',sec:'癸',avoid:''},卯:{pri:'丙',sec:'癸',avoid:''},辰:{pri:'丙',sec:'癸',avoid:''},巳:{pri:'癸',sec:'',avoid:''},午:{pri:'癸',sec:'',avoid:''},未:{pri:'癸',sec:'',avoid:''},申:{pri:'丙',sec:'癸',avoid:''},酉:{pri:'丙',sec:'癸',avoid:''},戌:{pri:'癸',sec:'',avoid:''},亥:{pri:'丙',sec:'',avoid:''},子:{pri:'丙',sec:'',avoid:'癸'},丑:{pri:'丙',sec:'',avoid:'癸'}},
  丙:{寅:{pri:'壬',sec:'庚',avoid:''},卯:{pri:'壬',sec:'己',avoid:''},辰:{pri:'壬',sec:'甲',avoid:''},巳:{pri:'壬',sec:'庚',avoid:''},午:{pri:'壬',sec:'庚',avoid:''},未:{pri:'壬',sec:'庚',avoid:''},申:{pri:'壬',sec:'戊',avoid:''},酉:{pri:'壬',sec:'癸',avoid:''},戌:{pri:'壬',sec:'甲',avoid:''},亥:{pri:'壬',sec:'戊庚',avoid:''},子:{pri:'壬',sec:'戊己',avoid:'癸'},丑:{pri:'壬',sec:'甲',avoid:'癸'}},
  丁:{寅:{pri:'甲',sec:'庚',avoid:''},卯:{pri:'甲',sec:'庚',avoid:''},辰:{pri:'甲',sec:'庚',avoid:''},巳:{pri:'甲',sec:'庚',avoid:''},午:{pri:'壬',sec:'庚癸',avoid:''},未:{pri:'甲',sec:'壬庚',avoid:''},申:{pri:'甲',sec:'庚丙戊',avoid:''},酉:{pri:'甲',sec:'庚丙戊',avoid:''},戌:{pri:'甲',sec:'庚戊',avoid:''},亥:{pri:'甲',sec:'庚',avoid:'癸'},子:{pri:'甲',sec:'庚',avoid:'癸'},丑:{pri:'甲',sec:'庚',avoid:'癸'}},
  戊:{寅:{pri:'丙',sec:'甲癸',avoid:''},卯:{pri:'丙',sec:'甲癸',avoid:''},辰:{pri:'甲',sec:'丙癸',avoid:''},巳:{pri:'甲',sec:'丙癸',avoid:''},午:{pri:'壬',sec:'甲丙',avoid:''},未:{pri:'癸',sec:'丙甲',avoid:''},申:{pri:'丙',sec:'癸甲',avoid:''},酉:{pri:'丙',sec:'癸',avoid:''},戌:{pri:'甲',sec:'丙癸',avoid:''},亥:{pri:'甲',sec:'丙',avoid:'癸'},子:{pri:'丙',sec:'甲',avoid:'癸'},丑:{pri:'丙',sec:'甲',avoid:'癸'}},
  己:{寅:{pri:'丙',sec:'甲癸',avoid:'壬'},卯:{pri:'甲',sec:'丙癸',avoid:''},辰:{pri:'丙',sec:'甲癸',avoid:''},巳:{pri:'癸',sec:'丙',avoid:''},午:{pri:'癸',sec:'丙',avoid:''},未:{pri:'癸',sec:'丙',avoid:''},申:{pri:'丙',sec:'癸',avoid:''},酉:{pri:'丙',sec:'癸',avoid:''},戌:{pri:'甲',sec:'丙癸',avoid:''},亥:{pri:'丙',sec:'甲',avoid:'癸'},子:{pri:'丙',sec:'甲',avoid:'癸'},丑:{pri:'丙',sec:'甲',avoid:'癸'}},
  庚:{寅:{pri:'丙',sec:'丁甲',avoid:'癸'},卯:{pri:'丁',sec:'甲丙',avoid:''},辰:{pri:'甲',sec:'丁',avoid:''},巳:{pri:'壬',sec:'戊丙丁',avoid:''},午:{pri:'壬',sec:'癸',avoid:''},未:{pri:'壬',sec:'丁甲',avoid:''},申:{pri:'丁',sec:'甲',avoid:''},酉:{pri:'丁',sec:'甲丙',avoid:''},戌:{pri:'甲',sec:'壬',avoid:''},亥:{pri:'丁',sec:'丙',avoid:''},子:{pri:'丙',sec:'丁甲',avoid:'癸'},丑:{pri:'丙',sec:'丁甲',avoid:'癸'}},
  辛:{寅:{pri:'己',sec:'壬',avoid:''},卯:{pri:'壬',sec:'甲',avoid:''},辰:{pri:'壬',sec:'甲',avoid:''},巳:{pri:'壬',sec:'甲癸',avoid:''},午:{pri:'壬',sec:'己癸',avoid:''},未:{pri:'壬',sec:'甲',avoid:''},申:{pri:'壬',sec:'甲',avoid:'癸'},酉:{pri:'壬',sec:'癸',avoid:''},戌:{pri:'壬',sec:'甲',avoid:''},亥:{pri:'壬',sec:'',avoid:''},子:{pri:'丙',sec:'壬戊',avoid:'癸'},丑:{pri:'丙',sec:'',avoid:'癸'}},
  壬:{寅:{pri:'庚',sec:'丙戊',avoid:''},卯:{pri:'戊',sec:'辛',avoid:''},辰:{pri:'甲',sec:'庚',avoid:''},巳:{pri:'壬',sec:'辛',avoid:''},午:{pri:'癸',sec:'庚辛',avoid:''},未:{pri:'辛',sec:'甲',avoid:''},申:{pri:'戊',sec:'丁',avoid:'丙'},酉:{pri:'戊',sec:'丁',avoid:'丙'},戌:{pri:'甲',sec:'丙',avoid:''},亥:{pri:'戊',sec:'丙庚',avoid:''},子:{pri:'戊',sec:'丙',avoid:''},丑:{pri:'丙',sec:'丁甲',avoid:'癸'}},
  癸:{寅:{pri:'辛',sec:'丙',avoid:''},卯:{pri:'庚',sec:'辛',avoid:''},辰:{pri:'丙',sec:'辛甲',avoid:''},巳:{pri:'辛',sec:'',avoid:''},午:{pri:'庚',sec:'壬癸',avoid:''},未:{pri:'庚',sec:'辛壬',avoid:''},申:{pri:'丁',sec:'',avoid:'甲'},酉:{pri:'辛',sec:'',avoid:''},戌:{pri:'辛',sec:'甲壬癸',avoid:''},亥:{pri:'庚',sec:'辛丁',avoid:'癸'},子:{pri:'丙',sec:'辛',avoid:'癸'},丑:{pri:'丙',sec:'丁',avoid:'癸'}},
};

export const qiongtongClimateFilter: AnalysisFilter = {
  name: '穷通调候',
  priority: 300,
  enabled: true,

  analyze(ctx: AnalysisContext): FilterOutput {
    const pillars = ctx.chart.base.pillars;
    const dayGan = pillars.日柱.gan;
    const monthZhi = pillars.月柱.zhi;

    const rule = TIAOHOU[dayGan]?.[monthZhi];
    if (!rule) return { filterName: '穷通调候', priority: 300, diagnostics: ['无调候数据'] };

    // 寒暖燥湿评分
    const isWinter = ['亥','子','丑'].includes(monthZhi);
    const isSummer = ['巳','午','未'].includes(monthZhi);
    const isSpring = ['寅','卯','辰'].includes(monthZhi);
    let coldWarmScore = 0;
    if (isWinter) coldWarmScore = -5;
    if (isSummer) coldWarmScore = +5;
    if (isSpring && monthZhi === '寅') coldWarmScore = -2; // 初春余寒

    const attrs: QiongTongAttributes = {
      tiaoHouPrimary: rule.pri,
      tiaoHouSecondary: rule.sec,
      tiaoHouAvoid: rule.avoid,
      coldWarmScore,
      dryWetScore: isSummer ? +3 : isWinter ? -2 : 0,
      climateUrgency: (isWinter || isSummer) ? 'emergency' : isSpring ? 'moderate' : 'normal',
      woodState: null, fireState: null, earthState: null, metalState: null, waterState: null,
      seasonEffectModifier: {},
    };

    // 初春余寒:木生火力弱
    if (monthZhi === '寅') {
      attrs.seasonEffectModifier['木'] = { '生火': '初春余寒，木生火力打折' };
      attrs.seasonEffectModifier['火'] = { '生土': '寒火微温，生土力弱' };
      attrs.earthState = '寒湿';
    }

    setAnnotation(ctx.chart, BookName.QiongTong, attrs as unknown as Record<string, unknown>);

    const yongShenAdj = ctx.baseYongShen.fuyi.dayStrength.includes('弱') && (isWinter || isSummer)
      ? { yongShen: rule.pri, reason: `穷通调候:${isWinter ? '冬' : '夏'}月身弱，调候优先用${rule.pri}` }
      : undefined;

    return {
      filterName: '穷通调候',
      priority: 300,
      annotation: ctx.chart.annotations.find(a => a.book === BookName.QiongTong),
      yongShenAdjustment: yongShenAdj,
      diagnostics: [`调候:${rule.pri}`, `寒暖:${coldWarmScore}`, monthZhi==='寅'?'初春余寒→木生火力弱':''].filter(Boolean),
    };
  },
};

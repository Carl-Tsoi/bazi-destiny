/**
 * 滴天髓平衡拦截器 (Priority 200)
 *
 * 五行旺衰动态平衡 + 源流分析 + 从格检测
 * Ref: docs/滴天髓_notebook.md
 */
import type { AnalysisFilter, AnalysisContext, FilterOutput } from '../types.js';
import { BookName, setAnnotation } from '../../attributes/base-types.js';
import type { DiTianSuiAttributes } from '../../attributes/ditiansui.js';

const ORDER = ['木','火','土','金','水'];
const ZWX: Record<string,string> = {
  '子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火',
  '午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水',
};

export const ditiansuiBalanceFilter: AnalysisFilter = {
  name: '滴天髓平衡',
  priority: 200,
  enabled: true,

  analyze(ctx: AnalysisContext): FilterOutput {
    const { chart, baseYongShen } = ctx;
    const pillars = chart.base.pillars;
    const scores = baseYongShen.fuyi.elementScores;
    const dayEl = ORDER.find(e => (baseYongShen.fuyi.yongShen !== '' ? e : '')) ?? '';

    // 源流分析:找最高分和最低分
    const entries = Object.entries(scores).sort(([,a], [,b]) => b - a);
    const source = entries[0][0];
    const sink = entries[entries.length - 1][0];
    const totalScore = entries.reduce((s, [,v]) => s + v, 0);
    const healthScore = Math.min(100, Math.round((totalScore - Math.abs(entries[0][1] - entries[4][1])) / totalScore * 100));

    // 从格检测:日主极弱+全局克泄独大
    const dayScore = scores[dayEl] ?? 0;
    const maxOther = entries[0][0] === dayEl ? (entries[1]?.[1] ?? 0) : entries[0][1];
    const isExtremeWeak = dayScore <= 2 && maxOther >= dayScore * 10;
    const isExtremeStrong = dayScore >= totalScore * 0.7;

    let specialType: DiTianSuiAttributes['specialState']['type'] = null;
    let specialDetails = '';
    if (isExtremeWeak) { specialType = '真从格'; specialDetails = `日主${dayEl}极弱(${dayScore}分)，全局${entries[0][0]}(${entries[0][1]}分)一方独大`; }
    else if (isExtremeStrong) { specialType = '专旺格'; specialDetails = `日主${dayEl}极强(${dayScore}分,占比${Math.round(dayScore/totalScore*100)}%)`; }

    // 冲战力分析
    const zhis = [pillars.年柱.zhi, pillars.月柱.zhi, pillars.日柱.zhi, pillars.时柱.zhi];
    const chongPairs: Record<string, {pair:[string,string];winner:string|null;loser:string|null;severity:'拔除'|'激发'|'两败俱伤'}> = {};
    const CHONG_MAP: Record<string,string> = {'子午':'子','午子':'午','丑未':'丑','未丑':'未','寅申':'申','申寅':'寅','卯酉':'酉','酉卯':'卯','辰戌':'戌','戌辰':'辰','巳亥':'亥','亥巳':'巳'};
    for (let i=0;i<zhis.length-1;i++) for (let j=i+1;j<zhis.length;j++) {
      const combo = zhis[i]+zhis[j];
      if (CHONG_MAP[combo]) {
        const elA = ZWX[zhis[i]] ?? '', elB = ZWX[zhis[j]] ?? '';
        const scA = scores[elA] ?? 0, scB = scores[elB] ?? 0;
        let severity: '拔除'|'激发'|'两败俱伤' = '两败俱伤';
        if (scA > scB * 2) severity = '拔除';
        else if (scB > scA * 2) severity = '激发';
        chongPairs[combo] = {pair:[zhis[i],zhis[j]],winner:scA>scB?zhis[i]:zhis[j],loser:scA<scB?zhis[i]:zhis[j],severity};
      }
    }

    const attrs: DiTianSuiAttributes = {
      livingWood: dayEl === '木',
      sourceFlow: { sourceElement: source, sinkElement: sink, pathClear: healthScore > 70, blockages: [], healthScore },
      specialState: { type: specialType, details: specialDetails, breakable: specialType !== null },
      chongAnalysis: chongPairs,
      clarity: { score: healthScore, isPure: healthScore > 70, impurityFactors: [], canBeCleared: healthScore > 50 },
    };

    setAnnotation(ctx.chart, BookName.DiTianSui, attrs as unknown as Record<string, unknown>);

    return {
      filterName: '滴天髓平衡',
      priority: 200,
      annotation: ctx.chart.annotations.find(a => a.book === BookName.DiTianSui),
      stopPropagation: specialType !== null, // 从格/专旺时中断后续
      diagnostics: [specialType ? `特殊格局:${specialType}` : '正格', `健康度:${healthScore}`, `源:${source}→流:${sink}`],
    };
  },
};

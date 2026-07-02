/**
 * 数据提取公共层 v2 — 统一评估所有十神和宫位
 *
 * L3 给分数, L4 给喜忌, L5a 用 evaluateStar() 统一评估十神品质+力量+喜忌
 */

import type { ChartResult, ScoreResult, AnalysisResult } from '../../analysis/types.js';
import {
  evaluateStar, evaluatePalace, evaluateAllStars, countStarPillars,
  isSpecialPattern,
  type StarEvaluation, type PalaceEvaluation, type TenGodStar,
} from './evaluator.js';

// ── 类型 ──────────────────────────────────────────

export type { StarEvaluation, PalaceEvaluation, TenGodStar };

export interface DayunContext {
  current: { gan: string; zhi: string; ganShishen: string; zhiShishen: string; startAge: number; endAge: number } | null;
  next: { gan: string; zhi: string; ganShishen: string; zhiShishen: string; startAge: number; endAge: number } | null;
}

export interface SharedContext {
  // 十神评估（StarEvaluation 替代 StarPresence）
  officials: StarEvaluation;
  seals: StarEvaluation;
  wealthStars: StarEvaluation;
  outputStars: StarEvaluation;
  peers: StarEvaluation;

  // 宫位评估（PalaceEvaluation 替代 PalaceInfo）
  spousePalace: PalaceEvaluation;
  parentsPalace: PalaceEvaluation;
  childrenPalace: PalaceEvaluation;
  siblingsPalace: PalaceEvaluation;

  // 五行
  elementScores: Record<string, number>;
  totalScore: number;
  missingElements: string[];
  excessElements: string[];

  // 全局
  dayGan: string;
  dayEl: string;
  dayStrength: string;
  yongShen: string[];
  jiShen: string[];
  pattern: string;
  dayunContext: DayunContext;
  gender: 'M' | 'F';
  age: number;
  mixedOfficials: boolean;

  // 衍生标记
  isStrong: boolean;
  isWeak: boolean;
  specialPattern: boolean;

  // 十神统计
  starCount: Record<TenGodStar, number>;
}

// ── 常量 ──────────────────────────────────────────

const WX_MAP: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土',
  '庚': '金', '辛': '金', '壬': '水', '癸': '水',
};
const ZWX_MAP: Record<string, string> = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
  '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水',
};
const ELEMENT_ORDER = ['木', '火', '土', '金', '水'];

function getEl(gan: string): string { return WX_MAP[gan] ?? ''; }

// ── 主入口 ────────────────────────────────────────

export function buildContext(
  chart: ChartResult,
  score: ScoreResult,
  analysis: AnalysisResult,
  options?: { gender?: 'M' | 'F'; age?: number },
): SharedContext {
  const pillars = chart.pillars;
  const dayGan = chart.dayGan;
  const dayEl = getEl(dayGan);
  const yongShenAll = [analysis.yongShen, ...analysis.xiShen];
  const totalScore = Object.values(score.elementScores).reduce((a: number, b: number) => a + b, 0) || 1;

  // ── 从 score.details 提取刑冲会合 ──
  const clashes: string[] = [];
  const combos: string[] = [];
  for (const d of score.details) {
    if (d.includes('六冲') || d.includes('相刑') || d.includes('三刑')) clashes.push(d);
    if (d.includes('六合') || d.includes('半合') || d.includes('拱合') || d.includes('三合') || d.includes('三会')) combos.push(d);
  }

  // ── 统一评估所有十神 ──
  const evalInput = {
    pillars,
    dayEl,
    dayStrength: score.dayStrength,
    pattern: chart.pattern,
    elementScores: score.elementScores,
    totalScore,
    jiShen: analysis.jiShen,
    scoreDetails: score.details,
  };
  const stars = evaluateAllStars(evalInput);

  // 七杀/正官独立（用于官杀混杂判断）
  // 直接使用 officials 的评估结果
  const officials = stars.officials;

  // ── 宫位评估 ──
  const spousePalace = evaluatePalace(
    chart.dayZhi, dayEl, yongShenAll, analysis.jiShen,
    clashes, combos, score.elementScores,
  );
  const parentsPalace = evaluatePalace(
    pillars.年柱.zhi, dayEl, yongShenAll, analysis.jiShen,
    clashes, combos, score.elementScores,
  );
  const childrenPalace = evaluatePalace(
    pillars.时柱.zhi, dayEl, yongShenAll, analysis.jiShen,
    clashes, combos, score.elementScores,
  );
  const siblingsPalace = evaluatePalace(
    pillars.月柱.zhi, dayEl, yongShenAll, analysis.jiShen,
    clashes, combos, score.elementScores,
  );

  // ── 五行缺失/过旺 ──
  const appeared = new Set<string>();
  for (const p of Object.values(pillars)) {
    appeared.add(WX_MAP[p.gan] ?? '');
    appeared.add(ZWX_MAP[p.zhi] ?? '');
    for (const h of p.canggan) appeared.add(WX_MAP[h.stem] ?? '');
  }
  const missingElements = ELEMENT_ORDER.filter(e => (score.elementScores[e] ?? 0) <= 0 && !appeared.has(e));
  const avgScore = totalScore / (Object.values(score.elementScores).filter(v => v > 0).length || 1);
  const excessElements = Object.keys(score.elementScores).filter(
    e => (score.elementScores[e] ?? 0) > avgScore * 2
  );

  // ── 官杀混杂 ──
  let zg = false, qs = false;
  for (const p of Object.values(pillars)) {
    if (p.shishen === '正官') zg = true;
    if (p.shishen === '七杀') qs = true;
    for (const h of p.canggan) {
      if (h.tenGod === '正官') zg = true;
      if (h.tenGod === '七杀') qs = true;
    }
  }

  // ── 大运上下文 ──
  const steps = chart.dayun.steps;
  const currentAge = options?.age ?? 30;
  let current: DayunContext['current'] = null;
  let next: DayunContext['next'] = null;
  for (let i = 0; i < steps.length; i++) {
    if (steps[i].startAge <= currentAge && steps[i].endAge >= currentAge) {
      current = {
        gan: steps[i].gan, zhi: steps[i].zhi,
        ganShishen: steps[i].ganShishen, zhiShishen: steps[i].zhiShishen,
        startAge: steps[i].startAge, endAge: steps[i].endAge,
      };
      if (i + 1 < steps.length) {
        const ns = steps[i + 1];
        next = {
          gan: ns.gan, zhi: ns.zhi,
          ganShishen: ns.ganShishen, zhiShishen: ns.zhiShishen,
          startAge: ns.startAge, endAge: ns.endAge,
        };
      }
      break;
    }
  }

  // ── 十神计数 ──
  const starCount: Record<TenGodStar, number> = {
    officials: countStarPillars('officials', pillars),
    seals: countStarPillars('seals', pillars),
    wealth: countStarPillars('wealth', pillars),
    output: countStarPillars('output', pillars),
    peers: countStarPillars('peers', pillars),
  };

  return {
    officials,
    seals: stars.seals,
    wealthStars: stars.wealth,
    outputStars: stars.output,
    peers: stars.peers,
    spousePalace, parentsPalace, childrenPalace, siblingsPalace,
    elementScores: score.elementScores,
    totalScore,
    missingElements,
    excessElements,
    dayGan, dayEl,
    dayStrength: score.dayStrength,
    yongShen: yongShenAll,
    jiShen: analysis.jiShen,
    pattern: chart.pattern,
    dayunContext: { current, next },
    gender: options?.gender ?? 'M',
    age: options?.age ?? 30,
    mixedOfficials: zg && qs,
    isStrong: score.dayStrength.includes('强') || score.dayStrength.includes('旺'),
    isWeak: score.dayStrength.includes('弱'),
    specialPattern: isSpecialPattern(chart.pattern),
    starCount,
  };
}

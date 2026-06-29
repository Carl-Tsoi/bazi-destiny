/**
 * 扶抑法 — 日主强弱定扶抑
 *
 * 输入: 已计分结果 (ScoreResult from L3)
 * 输出: 扶抑用神
 */
import type { ScoreResult } from './analysis/types.js';

const ELEMENT_ORDER = ['木','火','土','金','水'];

const WUXING: Record<string, string> = {
  '甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水',
};

export interface FuYiInput {
  dayGan: string;
  score: ScoreResult;
}

export interface FuYiOutput {
  yongShen: string;
  reason: string;
  dayStrength: string;
  dayScore: number;
  elementScores: Record<string, number>;
  details: string[];
}

export function methodFuYi(input: FuYiInput): FuYiOutput {
  const { dayGan, score } = input;
  const dayEl = WUXING[dayGan] ?? '';
  const dayIdx = ELEMENT_ORDER.indexOf(dayEl);
  const dayScore = score.dayScore;
  const allScores = Object.entries(score.elementScores).sort(([,a],[,b])=>b-a);
  const topEls = allScores.map(([el,s])=>`${el}(${s})`).join(' ');

  const shengWo = ELEMENT_ORDER[(dayIdx + 4) % 5];
  const shengScore = (score.elementScores as Record<string, number>)[shengWo] ?? 0;
  const effectiveDay = shengScore > dayScore
    ? dayScore + Math.floor(shengScore / 2)
    : dayScore;

  let yongShen: string, reason: string;

  if (score.dayStrength === '身强') {
    yongShen = ELEMENT_ORDER[(dayIdx + 1) % 5]; // 食伤泄秀
    reason = `力量分布: ${topEls}。日主${dayEl}${dayScore}分+印${effectiveDay - dayScore}=有效${effectiveDay}分，身强。宜食伤泄秀、顺势流通。`;
  } else {
    yongShen = dayEl; // 比劫帮身
    reason = `力量分布: ${topEls}。日主${dayEl}${dayScore}分，身弱。急需印绶生身、比劫扶助。`;
  }

  return {
    yongShen,
    reason,
    dayStrength: score.dayStrength,
    dayScore,
    elementScores: score.elementScores,
    details: score.details,
  };
}

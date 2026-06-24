/**
 * 扶抑法 — 日主强弱定扶抑
 * 蒋文正批断流程 Step 5
 *
 * 计算五行力量分布，判定日主强弱，给出扶抑用神。
 * 当其他方法不触发时，扶抑结果为默认用神。
 */
import { calculatePower } from './power-distribution.js';

const WUXING: Record<string, string> = {
  '甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水',
};

const ELEMENT_ORDER = ['木','火','土','金','水'];

interface Pillar {
  gan: string; zhi: string; shishen: string;
  canggan: Array<{stem: string; tenGod: string}>;
}

export interface FuYiInput {
  pillars: Record<string, Pillar>;
  extraZhis?: string[];
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
  const { pillars, extraZhis = [] } = input;
  const dayGan = pillars.日柱.gan;
  const dayEl = WUXING[dayGan] ?? '';
  const dayIdx = ELEMENT_ORDER.indexOf(dayEl);

  const pillarArray = Object.values(pillars);
  const power = calculatePower(pillarArray, extraZhis);

  const dayScore = power.dayScore;
  const allScores = Object.entries(power.scores).sort(([, a], [, b]) => b - a);
  const topEls = allScores.map(([el, s]) => `${el}(${s})`).join(' ');

  const shengWo = ELEMENT_ORDER[(dayIdx + 4) % 5];
  const effectiveDay = (power.scores[shengWo] ?? 0) > dayScore
    ? dayScore + Math.floor((power.scores[shengWo] ?? 0) / 2)
    : dayScore;

  let strength: string, yongShen: string, reason: string;

  if (power.dayStrength === '身强') {
    strength = '身强';
    yongShen = ELEMENT_ORDER[(dayIdx + 1) % 5]; // 食伤泄秀
    reason = `力量分布: ${topEls}。日主${dayEl}${dayScore}分+印${effectiveDay - dayScore}=有效${effectiveDay}分，身强。宜食伤泄秀、顺势流通。`;
  } else if (power.dayStrength === '中和偏旺') {
    strength = '中和偏旺';
    yongShen = ELEMENT_ORDER[(dayIdx + 3) % 5]; // 克泄:官杀
    reason = `力量分布: ${topEls}。日主${dayEl}${dayScore}分+印${effectiveDay - dayScore}=有效${effectiveDay}分，中和偏旺。宜克泄以求平衡。`;
  } else if (power.dayStrength === '中和偏弱') {
    strength = '中和偏弱';
    yongShen = ELEMENT_ORDER[(dayIdx + 4) % 5]; // 生扶:印
    reason = `力量分布: ${topEls}。日主${dayEl}得分${dayScore}，中和偏弱。宜用印比生扶。`;
  } else {
    strength = '身弱';
    yongShen = dayEl; // 生扶:比劫
    reason = `力量分布: ${topEls}。日主${dayEl}得分${dayScore}，身弱。急需印绶生身、比劫扶助。`;
  }

  return {
    yongShen,
    reason,
    dayStrength: strength,
    dayScore,
    elementScores: power.scores,
    details: power.details,
  };
}

/**
 * 统一十神评估器 — 所有L5a引擎判断逻辑的唯一入口
 *
 * 替代分散在各引擎中的 ad-hoc 判断:
 *   - isStarJi() → determineFavorability()
 *   - offset算术 → tenGodElement() + tenGodOffset()
 *   - 手写 strength check → classifyStrength()
 *   - 手写 presence → evaluateStar()
 */

import type { ChartResult } from '../../analysis/types.js';

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

// ── 类型 ──────────────────────────────────────────

export type TenGodStar = 'officials' | 'seals' | 'wealth' | 'output' | 'peers';
export type StrengthLevel = 'absent' | 'weak' | 'moderate' | 'strong' | 'very_strong';

export interface StarQuality {
  touGan: boolean;
  youGen: boolean;
  zhuQi: boolean;
  beiKe: boolean;
  beiHe: boolean;
}

export interface StarEvaluation {
  present: boolean;
  strength: StrengthLevel;
  quality: StarQuality;
  favorable: boolean;
  favorabilityReason: string;
  element: string;
  score: number;
  scoreRatio: number;
}

export interface PalaceEvaluation {
  zhi: string;
  element: string;
  tenGod: string;
  isYongShen: boolean;
  isJiShen: boolean;
  clashes: string[];
  combinations: string[];
  harms: string[];
  score: number;
}

// ── 十神 → 五行偏移 ────────────────────────────────

const STAR_OFFSETS: Record<TenGodStar, number> = {
  peers: 0,        // 同我 → 比劫
  output: 1,       // 我生 → 食伤
  wealth: 2,       // 我克 → 财星
  officials: 3,    // 克我 → 官杀
  seals: 4,        // 生我 → 印星
};

const STAR_KEYWORDS: Record<TenGodStar, string[]> = {
  officials: ['正官', '七杀'],
  seals: ['正印', '偏印'],
  wealth: ['正财', '偏财'],
  output: ['食神', '伤官'],
  peers: ['比肩', '劫财'],
};

/** 十神 → 对应五行 */
export function tenGodElement(dayEl: string, star: TenGodStar): string {
  const di = ELEMENT_ORDER.indexOf(dayEl);
  if (di < 0) return '';
  return ELEMENT_ORDER[(di + STAR_OFFSETS[star]) % 5];
}

/** 十神 → 偏移量 */
export function tenGodOffset(star: TenGodStar): number {
  return STAR_OFFSETS[star];
}

// ── 力量分级 ─────────────────────────────────────

const STRENGTH_THRESHOLDS: Array<{ level: StrengthLevel; min: number }> = [
  { level: 'very_strong', min: 0.25 },
  { level: 'strong', min: 0.15 },
  { level: 'moderate', min: 0.05 },
  { level: 'weak', min: 0 },
];

function classifyStrength(ratio: number): StrengthLevel {
  if (ratio <= 0) return 'absent';
  for (const t of STRENGTH_THRESHOLDS) {
    if (ratio >= t.min) return t.level;
  }
  return 'absent';
}

// ── 喜忌判断（替代 isStarJi）────────────────────

/**
 * 判断十神是否为忌神
 *
 * 规则优先级:
 *   1. L4 jiShen 列表（已综合身强/弱+格局+调候）— 权威来源
 *   2. 基本原理 fallback（身强喜克泄耗、身弱喜生扶）
 *   3. 特殊格局覆盖（从强格/从弱格翻转部分规则）
 */
export function determineFavorability(
  star: TenGodStar,
  starElement: string,
  _dayStrength: string,
  _pattern: string,
  jiShen: string[],
): { favorable: boolean; reason: string } {
  // L4 已综合身强/弱+格局+调候+变格，L5a 直接使用，不做二次判断
  if (jiShen.includes(starElement)) {
    return { favorable: false, reason: `${starElement}在忌神列表(L4综合判断)` };
  }
  return { favorable: true, reason: `${starElement}为喜用(L4综合判断)` };
}

// ── 星力品质评估 ─────────────────────────────────

/** 检查某个十神是否出现在柱的天干 */
function starInGan(shishen: string, keywords: string[]): boolean {
  return keywords.some(kw => shishen.includes(kw));
}

/** 检查某个十神是否出现在藏干 */
function starInCanggan(canggan: Array<{ stem: string; tenGod: string }>, keywords: string[]): boolean {
  return canggan.some(h => keywords.some(kw => h.tenGod.includes(kw)));
}

/** 检查地支是否与给定五行相同（有根判断） */
function zhiMatchesElement(zhi: string, element: string): boolean {
  return (ZWX_MAP[zhi] ?? '') === element;
}

// ── 核心评估函数 ─────────────────────────────────

export interface EvalInput {
  pillars: ChartResult['pillars'];
  dayEl: string;
  dayStrength: string;
  pattern: string;
  elementScores: Record<string, number>;
  totalScore: number;
  jiShen: string[];
  scoreDetails: string[];
}

/**
 * 评估单个十神 — 所有引擎判断的统一入口
 */
export function evaluateStar(star: TenGodStar, input: EvalInput): StarEvaluation {
  const { pillars, dayEl, dayStrength, pattern, elementScores, totalScore, jiShen, scoreDetails } = input;
  const keywords = STAR_KEYWORDS[star];
  const element = tenGodElement(dayEl, star);
  const score = elementScores[element] ?? 0;
  const scoreRatio = totalScore > 0 ? score / totalScore : 0;

  // 存在性 + 品质
  let touGan = false;
  let youGen = false;
  let zhuQi = false;
  let present = false;

  for (const p of Object.values(pillars)) {
    // 透干
    if (starInGan(p.shishen, keywords)) {
      touGan = true;
      present = true;
    }
    // 主气藏干
    const mainQi = p.canggan[0];
    if (mainQi && starInCanggan([mainQi], keywords)) {
      zhuQi = true;
      present = true;
    }
    // 任意藏干
    if (starInCanggan(p.canggan, keywords)) {
      present = true;
    }
    // 有根: 地支五行匹配
    if (zhiMatchesElement(p.zhi, element)) {
      youGen = true;
    }
  }

  // 被克: star 的五行被 g克它的十神? → star element 的 "克我" 五行是否也存在
  // 克 starElement 的五行 = ELEMENT_ORDER[(di + 3) % 5]
  const di = ELEMENT_ORDER.indexOf(dayEl);
  const starDi = ELEMENT_ORDER.indexOf(element);
  const controllerElement = ELEMENT_ORDER[(starDi + 3) % 5]; // 克 star 的五行
  const beiKe = (elementScores[controllerElement] ?? 0) > 0;

  // 被合: 从 score details 中判断（简化：检查是否有合涉及该元素对应的柱）
  let beiHe = false;
  for (const d of scoreDetails) {
    if ((d.includes('六合') || d.includes('五合') || d.includes('三合')) && d.includes(element)) {
      beiHe = true;
      break;
    }
  }

  // 力量分级 — 出现但元素分=0 的星视为不存在
  const effectivePresent = present && scoreRatio > 0;
  const strength = effectivePresent ? classifyStrength(scoreRatio) : 'absent';

  // 喜忌
  const { favorable, reason } = determineFavorability(star, element, dayStrength, pattern, jiShen);

  return {
    present: effectivePresent,
    strength,
    quality: { touGan, youGen, zhuQi, beiKe, beiHe },
    favorable,
    favorabilityReason: reason,
    element,
    score,
    scoreRatio,
  };
}

/**
 * 评估宫位
 */
export function evaluatePalace(
  zhi: string,
  dayEl: string,
  yongShen: string[],
  jiShen: string[],
  clashes: string[],
  combinations: string[],
  elementScores: Record<string, number>,
): PalaceEvaluation {
  const element = ZWX_MAP[zhi] ?? '';
  const di = ELEMENT_ORDER.indexOf(dayEl);
  const zhiDi = ELEMENT_ORDER.indexOf(element);
  const diff = (zhiDi - di + 5) % 5;
  const tenGodNames = ['比劫', '食伤', '财星', '官杀', '印星'];

  return {
    zhi,
    element,
    tenGod: tenGodNames[diff] ?? '',
    isYongShen: yongShen.includes(element),
    isJiShen: jiShen.includes(element),
    clashes: clashes.filter(c => c.includes(zhi)),
    combinations: combinations.filter(c => c.includes(zhi)),
    harms: [], // 害暂未在 score details 中追踪
    score: elementScores[element] ?? 0,
  };
}

/**
 * 批量评估所有十神（在 buildContext 中一次调用）
 */
export function evaluateAllStars(input: EvalInput): Record<TenGodStar, StarEvaluation> {
  return {
    officials: evaluateStar('officials', input),
    seals: evaluateStar('seals', input),
    wealth: evaluateStar('wealth', input),
    output: evaluateStar('output', input),
    peers: evaluateStar('peers', input),
  };
}

/**
 * 判断是否为特殊格局（从格等）
 */
export function isSpecialPattern(pattern: string): boolean {
  if (!pattern) return false;
  return pattern.includes('从') || pattern.includes('化') || pattern.includes('专');
}

/**
 * 统计每个十神出现的柱数
 */
export function countStarPillars(
  star: TenGodStar,
  pillars: ChartResult['pillars'],
): number {
  const keywords = STAR_KEYWORDS[star];
  let count = 0;
  for (const p of Object.values(pillars)) {
    if (starInGan(p.shishen, keywords)) { count++; continue; }
    if (starInCanggan(p.canggan, keywords)) { count++; }
  }
  return count;
}

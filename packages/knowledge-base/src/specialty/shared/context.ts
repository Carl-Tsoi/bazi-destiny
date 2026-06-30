/**
 * 数据提取公共层 — 只提取不计算
 * L3 给分数, L4 给喜忌, L5a 只查十神存在性 + 宫位五行 + 查表
 */
import type { ChartResult, ScoreResult, AnalysisResult } from '../../analysis/types.js';

// ── 类型 ──────────────────────────────────────────

export interface StarPresence {
  present: boolean;       // 十神是否出现在四柱/藏干(透干或有根)
}

export interface PalaceInfo {
  zhi: string;
  tenGod: string;
  isYongShen: boolean;    // 宫位地支五行在 yongShen 中
  isJiShen: boolean;      // 宫位地支五行在 jiShen 中
  clashes: string[];
  combinations: string[];
}

export interface DayunContext {
  current: { gan: string; zhi: string; ganShishen: string; zhiShishen: string; startAge: number; endAge: number } | null;
  next: { gan: string; zhi: string; ganShishen: string; zhiShishen: string; startAge: number; endAge: number } | null;
}

export interface SharedContext {
  // 十神存在性
  officials: StarPresence;
  seals: StarPresence;
  wealthStars: StarPresence;
  outputStars: StarPresence;
  peers: StarPresence;

  // 宫位
  spousePalace: PalaceInfo;
  parentsPalace: PalaceInfo;
  childrenPalace: PalaceInfo;
  siblingsPalace: PalaceInfo;

  // 五行 (L3 直接给)
  elementScores: Record<string, number>;
  missingElements: string[];

  // 全局 (L3/L4 直接给)
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
}

// ── 常量 ──────────────────────────────────────────

const WX_MAP: Record<string, string> = {
  '甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水',
};
const ZWX_MAP: Record<string, string> = {
  '子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火',
  '午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水',
};
const ELEMENT_ORDER = ['木','火','土','金','水'];

function getEl(gan: string): string { return WX_MAP[gan] ?? ''; }

/** 检查某个十神是否出现在四柱或藏干 */
function starExists(pillars: ChartResult['pillars'], keywords: string[]): boolean {
  for (const p of Object.values(pillars)) {
    for (const kw of keywords) if (p.shishen.includes(kw)) return true;
    for (const h of p.canggan) {
      for (const kw of keywords) if (h.tenGod.includes(kw)) return true;
    }
  }
  return false;
}

/** 宫位提取 */
function analyzePalace(
  zhi: string, dayEl: string, yongShen: string[], jiShen: string[],
  clashes: string[], combos: string[]
): PalaceInfo {
  const zhiEl = ZWX_MAP[zhi] ?? '';
  const dayIdx = ELEMENT_ORDER.indexOf(dayEl);
  const zhiIdx = ELEMENT_ORDER.indexOf(zhiEl);
  const diff = (zhiIdx - dayIdx + 5) % 5;
  const names = ['比劫','食伤','财星','官杀','印星'];
  return {
    zhi, tenGod: names[diff] ?? '',
    isYongShen: yongShen.includes(zhiEl),
    isJiShen: jiShen.includes(zhiEl),
    clashes: clashes.filter(c => c.includes(zhi)),
    combinations: combos.filter(c => c.includes(zhi)),
  };
}

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

  // 十神存在性: 必须出现 + 其五行分数>0 (L3给的分数)
  const di = ELEMENT_ORDER.indexOf(dayEl);
  const elScore = (off: number) => score.elementScores[ELEMENT_ORDER[(di + off) % 5]] ?? 0;
  const mkPresent = (keywords: string[], off: number) => starExists(pillars, keywords) && elScore(off) > 0;

  const officials = { present: mkPresent(['正官','七杀'], 3) };
  const seals = { present: mkPresent(['正印','偏印'], 4) };
  const wealthStars = { present: mkPresent(['正财','偏财'], 2) };
  const outputStars = { present: mkPresent(['食神','伤官'], 1) };
  const peers = { present: mkPresent(['比肩','劫财'], 0) };

  // 五行缺失
  const appeared = new Set<string>();
  for (const p of Object.values(pillars)) {
    appeared.add(WX_MAP[p.gan] ?? '');
    appeared.add(ZWX_MAP[p.zhi] ?? '');
    for (const h of p.canggan) appeared.add(WX_MAP[h.stem] ?? '');
  }
  const missingElements = ELEMENT_ORDER.filter(e => (score.elementScores[e] ?? 0) <= 0 && !appeared.has(e));

  // 官杀混杂
  const hasMixedOfficials = (() => {
    let zg = false, qs = false;
    for (const p of Object.values(pillars)) {
      if (p.shishen === '正官') zg = true;
      if (p.shishen === '七杀') qs = true;
      for (const h of p.canggan) {
        if (h.tenGod === '正官') zg = true;
        if (h.tenGod === '七杀') qs = true;
      }
    }
    return zg && qs;
  })();

  // 刑冲会合 (从 L3 detail 字符串提取，开销低)
  const clashes: string[] = [];
  const combos: string[] = [];
  for (const d of score.details) {
    if (d.includes('六冲') || d.includes('相刑') || d.includes('三刑')) clashes.push(d);
    if (d.includes('六合') || d.includes('半合') || d.includes('拱合') || d.includes('三合') || d.includes('三会')) combos.push(d);
  }

  // 大运上下文
  const steps = chart.dayun.steps;
  const currentAge = options?.age ?? 30;
  let current: DayunContext['current'] = null;
  let next: DayunContext['next'] = null;
  for (let i = 0; i < steps.length; i++) {
    if (steps[i].startAge <= currentAge && steps[i].endAge >= currentAge) {
      current = { gan: steps[i].gan, zhi: steps[i].zhi, ganShishen: steps[i].ganShishen, zhiShishen: steps[i].zhiShishen, startAge: steps[i].startAge, endAge: steps[i].endAge };
      if (i + 1 < steps.length) {
        const ns = steps[i + 1];
        next = { gan: ns.gan, zhi: ns.zhi, ganShishen: ns.ganShishen, zhiShishen: ns.zhiShishen, startAge: ns.startAge, endAge: ns.endAge };
      }
      break;
    }
  }

  return {
    officials, seals, wealthStars, outputStars, peers,
    spousePalace: analyzePalace(chart.dayZhi, dayEl, yongShenAll, analysis.jiShen, clashes, combos),
    parentsPalace: analyzePalace(pillars.年柱.zhi, dayEl, yongShenAll, analysis.jiShen, clashes, combos),
    childrenPalace: analyzePalace(pillars.时柱.zhi, dayEl, yongShenAll, analysis.jiShen, clashes, combos),
    siblingsPalace: analyzePalace(pillars.月柱.zhi, dayEl, yongShenAll, analysis.jiShen, clashes, combos),
    elementScores: score.elementScores,
    missingElements,
    dayGan, dayEl,
    dayStrength: score.dayStrength,
    yongShen: yongShenAll,
    jiShen: analysis.jiShen,
    pattern: chart.pattern,
    dayunContext: { current, next },
    gender: options?.gender ?? 'M',
    age: options?.age ?? 30,
    mixedOfficials: hasMixedOfficials,
  };
}

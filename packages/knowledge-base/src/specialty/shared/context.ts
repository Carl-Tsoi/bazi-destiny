/**
 * 数据提取公共层 — 所有专项引擎共享
 *
 * 从 ChartResult + ScoreResult + AnalysisResult 提取标准化指标，
 * 引擎只消费这些指标，不直接读原始数据。
 */

import type { ChartResult, ScoreResult, AnalysisResult } from '../../analysis/types.js';

// ── 标准化返回类型 ──────────────────────────────────

export interface StarInfo {
  present: boolean;
 touGan: boolean;
 youGen: boolean;
  strength: '强' | '一般' | '弱' | '无';
  score: number;
  positions: string[];
}

export interface PalaceInfo {
  zhi: string;             // 地支
  tenGod: string;          // 宫位十神
  isYongShen: boolean;     // 是否坐用神
  isJiShen: boolean;       // 是否坐忌神
  clashes: string[];       // 刑冲关系
  combinations: string[];  // 会合关系
}

export interface ElementBalance {
  missing: string[];       // 缺失五行
  excess: string[];        // 过旺五行（>均值2倍）
  weak: string[];          // 偏弱五行（<均值一半）
  scores: Record<string, number>;
}

export interface DayunContext {
  current: { gan: string; zhi: string; ganShishen: string; zhiShishen: string; startAge: number; endAge: number } | null;
  next: { gan: string; zhi: string; ganShishen: string; zhiShishen: string; startAge: number; endAge: number } | null;
}

export interface SharedContext {
  // 十神
  officials: StarInfo;     // 官杀
  seals: StarInfo;         // 印星
  wealthStars: StarInfo;   // 财星
  outputStars: StarInfo;   // 食伤
  peers: StarInfo;         // 比劫

  // 宫位
  spousePalace: PalaceInfo;
  parentsPalace: PalaceInfo;
  childrenPalace: PalaceInfo;
  siblingsPalace: PalaceInfo;

  // 五行
  elementBalance: ElementBalance;

  // 全局
  dayGan: string;          // 日主天干 (甲/乙/丙/丁...)
  dayEl: string;           // 日主五行 (木/火/土/金/水)
  dayStrength: string;
  yongShen: string;
  xiShen: string[];
  jiShen: string[];
  pattern: string;
  dayunContext: DayunContext;
  gender: 'M' | 'F';
  age: number;
}

// ── 提取函数 ────────────────────────────────────────

const WX_MAP: Record<string, string> = {
  '甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水',
};
const ZWX_MAP: Record<string, string> = {
  '子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火',
  '午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水',
};
const ELEMENT_ORDER = ['木','火','土','金','水'];

// 正根地支
const ROOT_ZHI: Record<string, string[]> = {
  '甲':['寅','卯','辰','未','亥'],'乙':['寅','卯','辰','未','亥'],
  '丙':['巳','午','寅','未','戌'],'丁':['巳','午','寅','未','戌'],
  '戊':['辰','戌','丑','未','巳','午'],'己':['辰','戌','丑','未','巳','午'],
  '庚':['申','酉','辰','戌','丑'],'辛':['申','酉','辰','戌','丑'],
  '壬':['亥','子','申','辰','丑'],'癸':['亥','子','申','辰','丑'],
};

function getEl(gan: string): string { return WX_MAP[gan] ?? ''; }

/** 判断十神是否透出、有根，强度由实得分决定 */
function analyzeStar(
  gan: string, pillars: ChartResult['pillars'], allCangGan: Array<{stem:string}>,
  elementScore: number, totalScore: number,
): StarInfo {
  const touGan = Object.values(pillars).some(p => p.gan === gan);
  const youGen = ROOT_ZHI[gan]?.some(z => Object.values(pillars).some(p => p.zhi === z)) ?? false;
  const cangGan2 = allCangGan.some(h => h.stem === gan);
  const positions: string[] = [];
  for (const [k, p] of Object.entries(pillars)) {
    if (p.gan === gan) positions.push(`${k}干`);
    if (p.canggan.some(h => h.stem === gan)) positions.push(`${k}藏`);
  }
  // 强度由实得分决定：>20%总分→强，>5%→一般，>0→弱，≤0→无
  const t = totalScore || 1;
  let strength: StarInfo['strength'] = '无';
  if (elementScore > t * 0.2) strength = '强';
  else if (elementScore > t * 0.05) strength = '一般';
  else if (elementScore > 0) strength = '弱';
  return { present: elementScore > 0 || touGan || youGen || cangGan2, touGan, youGen, strength, score: elementScore, positions };
}

function analyzePalace(
  zhi: string, dayEl: string, yongShen: string, jiShen: string[],
  clashes: string[], combos: string[]
): PalaceInfo {
  const zhiEl = ZWX_MAP[zhi] ?? '';
  const tenGod = getPalaceTenGod(zhiEl, dayEl);
  return {
    zhi, tenGod,
    isYongShen: zhiEl === yongShen,
    isJiShen: jiShen.includes(zhiEl),
    clashes: clashes.filter(c => c.includes(zhi)),
    combinations: combos.filter(c => c.includes(zhi)),
  };
}

function getPalaceTenGod(zhiEl: string, dayEl: string): string {
  const dayIdx = ELEMENT_ORDER.indexOf(dayEl);
  const zhiIdx = ELEMENT_ORDER.indexOf(zhiEl);
  if (dayIdx < 0 || zhiIdx < 0) return '';
  const diff = (zhiIdx - dayIdx + 5) % 5;
  const names = ['比劫','食伤','财星','官杀','印星'];
  return names[diff] ?? '';
}

function analyzeBalance(scores: Record<string, number>, pillars: ChartResult['pillars']): ElementBalance {
  const entries = Object.entries(scores).filter(([,v])=>v>0);
  if (entries.length === 0) return { missing: ELEMENT_ORDER, excess: [], weak: [], scores };
  const avg = entries.reduce((s,[,v])=>s+v,0) / entries.length;
  // 判断"真正缺失"：分数≤0且八字中无此五行透干或出现
  const appearedElements = new Set<string>();
  const wxMap: Record<string,string> = {'甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水'};
  const zwxMap: Record<string,string> = {'子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火','午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水'};
  for (const p of Object.values(pillars)) {
    appearedElements.add(wxMap[p.gan] ?? '');
    appearedElements.add(zwxMap[p.zhi] ?? '');
    for (const h of p.canggan) appearedElements.add(wxMap[h.stem] ?? '');
  }
  const missing = ELEMENT_ORDER.filter(e => (scores[e]??0) <= 0 && !appearedElements.has(e));
  const excess = ELEMENT_ORDER.filter(e => (scores[e]??0) > avg * 2);
  const weak = ELEMENT_ORDER.filter(e => {
    const v = scores[e]??0;
    return v > 0 && v < avg * 0.5;
  });
  return { missing, excess, weak, scores };
}

/** 主入口：从 ChartResult + ScoreResult + AnalysisResult 构建 SharedContext */
export function buildContext(
  chart: ChartResult,
  score: ScoreResult,
  analysis: AnalysisResult,
  options?: { gender?: 'M' | 'F'; age?: number },
): SharedContext {
  const pillars = chart.pillars;
  const dayGan = chart.dayGan;
  const dayEl = getEl(dayGan);
  const allCangGan = Object.values(pillars).flatMap(p => p.canggan);

  // 十神对应的天干（简化：找十神名含关键字的藏干/天干）
  const findGanByShishen = (keywords: string[]): string => {
    for (const [, p] of Object.entries(pillars)) {
      for (const kw of keywords) {
        if (p.shishen.includes(kw)) return p.gan as string;
      }
    }
    for (const [, p] of Object.entries(pillars)) {
      for (const h of p.canggan) {
        for (const kw of keywords) {
          if (h.tenGod.includes(kw)) return h.stem;
        }
      }
    }
    return '';
  };

  const officialGan = findGanByShishen(['正官','七杀']);
  const sealGan = findGanByShishen(['正印','偏印']);
  const wealthGan = findGanByShishen(['正财','偏财']);
  const outputGan = findGanByShishen(['食神','伤官']);
  const peerGan = findGanByShishen(['比肩','劫财']);

  // 收集刑冲会合
  const clashes: string[] = [];
  const combos: string[] = [];
  for (const d of score.details) {
    if (d.includes('六冲') || d.includes('相刑') || d.includes('三刑')) clashes.push(d);
    if (d.includes('六合') || d.includes('半合') || d.includes('拱合') || d.includes('三合') || d.includes('三会')) combos.push(d);
  }

  // 大运上下文
  const dayunSteps = chart.dayun.steps;
  const currentAge = options?.age ?? 30;
  let current: DayunContext['current'] = null;
  let next: DayunContext['next'] = null;
  for (let i = 0; i < dayunSteps.length; i++) {
    const s = dayunSteps[i];
    if (s.startAge <= currentAge && s.endAge >= currentAge) {
      current = { gan: s.gan, zhi: s.zhi, ganShishen: s.ganShishen, zhiShishen: s.zhiShishen, startAge: s.startAge, endAge: s.endAge };
      if (i + 1 < dayunSteps.length) {
        const ns = dayunSteps[i + 1];
        next = { gan: ns.gan, zhi: ns.zhi, ganShishen: ns.ganShishen, zhiShishen: ns.zhiShishen, startAge: ns.startAge, endAge: ns.endAge };
      }
      break;
    }
  }

  const totalScore = Object.values(score.elementScores).reduce((a:number,b:number)=>a+b,0) || 1;

  return {
    officials: analyzeStar(officialGan, pillars, allCangGan, score.elementScores[getEl(officialGan)] ?? 0, totalScore),
    seals: analyzeStar(sealGan, pillars, allCangGan, score.elementScores[getEl(sealGan)] ?? 0, totalScore),
    wealthStars: analyzeStar(wealthGan, pillars, allCangGan, score.elementScores[getEl(wealthGan)] ?? 0, totalScore),
    outputStars: analyzeStar(outputGan, pillars, allCangGan, score.elementScores[getEl(outputGan)] ?? 0, totalScore),
    peers: analyzeStar(peerGan, pillars, allCangGan, score.elementScores[getEl(peerGan)] ?? 0, totalScore),

    spousePalace: analyzePalace(chart.dayZhi, dayEl, analysis.yongShen, analysis.jiShen, clashes, combos),
    parentsPalace: analyzePalace(chart.pillars.年柱.zhi, dayEl, analysis.yongShen, analysis.jiShen, clashes, combos),
    childrenPalace: analyzePalace(chart.pillars.时柱.zhi, dayEl, analysis.yongShen, analysis.jiShen, clashes, combos),
    siblingsPalace: analyzePalace(chart.pillars.月柱.zhi, dayEl, analysis.yongShen, analysis.jiShen, clashes, combos),

    elementBalance: analyzeBalance(score.elementScores, chart.pillars),

    dayGan: chart.dayGan,
    dayEl,
    dayStrength: score.dayStrength,
    yongShen: analysis.yongShen,
    xiShen: analysis.xiShen,
    jiShen: analysis.jiShen,
    pattern: chart.pattern,
    dayunContext: { current, next },
    gender: options?.gender ?? 'M',
    age: options?.age ?? 30,
  };
}

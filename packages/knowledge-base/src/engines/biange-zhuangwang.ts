/**
 * 变格引擎: 专旺格 — 日主极旺，全局同五行成势
 *
 * 判据: 自党分比 > 70%（极旺门槛），地支三合/三会局，月令当旺，无官杀破格
 * 五种子格: 曲直(木) 炎上(火) 稼穑(土) 从革(金) 润下(水)
 */

import type { LayeredContext, EngineResult } from './types.js';

const ORDER = ['木', '火', '土', '金', '水'];

// 日干→五行
const GAN_WX: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土',
  '庚': '金', '辛': '金', '壬': '水', '癸': '水',
};

// 地支→五行
const ZHI_WX: Record<string, string> = {
  '寅': '木', '卯': '木', '巳': '火', '午': '火',
  '辰': '土', '戌': '土', '丑': '土', '未': '土',
  '申': '金', '酉': '金', '亥': '水', '子': '水',
};

// 三会局
const SAN_HUI: Record<string, string[]> = {
  '木': ['寅', '卯', '辰'],
  '火': ['巳', '午', '未'],
  '金': ['申', '酉', '戌'],
  '水': ['亥', '子', '丑'],
};

// 三合局
const SAN_HE: Record<string, string[]> = {
  '木': ['亥', '卯', '未'],
  '火': ['寅', '午', '戌'],
  '金': ['巳', '酉', '丑'],
  '水': ['申', '子', '辰'],
};

// 格局名
const GE_NAMES: Record<string, string> = {
  '木': '曲直格（仁寿格）',
  '火': '炎上格（率性格）',
  '金': '从革格（金刚格）',
  '水': '润下格（灵秀格）',
  '土': '稼穑格（笃实格）',
};

// 专旺格喜忌: 喜印比食伤，忌官杀
const ZHUANGWANG_XI: Record<string, string[]> = {
  '木': ['水', '木', '火'],  // 水生木, 木帮木, 木生火泄秀
  '火': ['木', '火', '土'],
  '土': ['火', '土', '金'],
  '金': ['土', '金', '水'],
  '水': ['金', '水', '木'],
};
const ZHUANGWANG_JI: Record<string, string[]> = {
  '木': ['金'],              // 金克木（官杀逆势）
  '火': ['水'],
  '土': ['木'],
  '金': ['火'],
  '水': ['土'],
};

/** 检测地支是否成三会局 */
function hasSanHui(zhis: string[], wx: string): boolean {
  const hui = SAN_HUI[wx];
  if (!hui) return false;
  return hui.every(z => zhis.includes(z));
}

/** 检测地支是否成三合局 */
function hasSanHe(zhis: string[], wx: string): boolean {
  const he = SAN_HE[wx];
  if (!he) return false;
  return he.every(z => zhis.includes(z));
}

/** 检测月令是否当旺 */
function monthIsWang(monthZhi: string, wx: string): boolean {
  return ZHI_WX[monthZhi] === wx;
}

export function zhuangwangEngine(ctx: LayeredContext): EngineResult {
  const fuyi = ctx.fuyi;
  const scores = fuyi.elementScores;
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const dayGan = (ctx.base.pillars as Record<string, { gan: string }>).日柱?.gan ?? '';
  const dayEl = GAN_WX[dayGan] ?? '';
  const di = ORDER.indexOf(dayEl);

  if (di < 0) {
    return { engine: '专旺格', yongShen: null, yongShenType: '奇格', diagnostics: ['日主五行无法识别'], specialPattern: false };
  }

  // ── 极端门槛：自党 > 70% ──
  // fuyi.dayScore = scores[日主五行] 已含所有比劫分，只需加印星分
  const sealEl = ORDER[(di + 4) % 5]; // 印星五行
  const ziDangScore = fuyi.dayScore + (scores[sealEl] ?? 0);
  const ziDangRatio = total > 0 ? ziDangScore / total : 0;
  if (ziDangRatio <= 0.70) {
    return {
      engine: '专旺格',
      yongShen: null,
      yongShenType: '奇格',
      diagnostics: [`自党比${(ziDangRatio * 100).toFixed(0)}%≤70%，不入专旺格`],
      specialPattern: false,
    };
  }

  // ── 月令当旺 ──
  const monthZhi = (ctx.base.pillars as Record<string, { zhi: string }>).月柱?.zhi ?? '';
  if (!monthIsWang(monthZhi, dayEl)) {
    return {
      engine: '专旺格',
      yongShen: null,
      yongShenType: '奇格',
      diagnostics: [`月令${monthZhi}不当旺(需${dayEl}月)，不入专旺格`],
      specialPattern: false,
    };
  }

  // ── 地支成局（三会或三合） ──
  const allZhis = Object.values(ctx.base.pillars as Record<string, { zhi: string }>).map(p => p.zhi);
  const hasHui = hasSanHui(allZhis, dayEl);
  const hasHe = hasSanHe(allZhis, dayEl);
  if (!hasHui && !hasHe) {
    return {
      engine: '专旺格',
      yongShen: null,
      yongShenType: '奇格',
      diagnostics: [`地支不成${dayEl}局(需三会${SAN_HUI[dayEl]?.join('')}或三合${SAN_HE[dayEl]?.join('')})，不入专旺格`],
      specialPattern: false,
    };
  }

  // ── 无官杀破格 ──
  const killerEl = ORDER[(di + 3) % 5];  // 克日主的五行 = 官杀
  const killerScore = scores[killerEl] ?? 0;
  if (killerScore > total * 0.05) {
    return {
      engine: '专旺格',
      yongShen: null,
      yongShenType: '奇格',
      diagnostics: [`官杀${killerEl}得分${killerScore.toFixed(1)}>5%破格，不入专旺格`],
      specialPattern: false,
    };
  }

  // ── 入格！ ──
  const name = GE_NAMES[dayEl] || `专旺${dayEl}格`;
  const diag = [
    `专旺格:${name}`,
    `日主${dayEl}极旺(自党${(ziDangRatio*100).toFixed(0)}%)`,
    `地支${hasHui ? '三会' : '三合'}${dayEl}局成立`,
    `月令${monthZhi}当旺`,
    `${killerEl}(${killerScore <= 0 ? '无' : '极弱'})官杀不破格`,
  ];

  return {
    engine: '专旺格',
    yongShen: dayEl,
    yongShenType: '奇格',
    diagnostics: diag,
    specialPattern: true,
  };
}

/** 获取专旺格喜神 */
export function getZhuangWangXi(dayEl: string): string[] {
  return ZHUANGWANG_XI[dayEl] ?? [];
}

/** 获取专旺格忌神 */
export function getZhuangWangJi(dayEl: string): string[] {
  return ZHUANGWANG_JI[dayEl] ?? [];
}

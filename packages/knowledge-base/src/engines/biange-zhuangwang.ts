/**
 * 变格引擎: 专旺格 — 日主极旺，全局同五行成势
 *
 * 判据流水线:
 *   1. 极端门槛: 自党分 > 70%
 *   2. 月令当旺: 月支五行 = 日主五行
 *   3. 地支成局: 三会/三合/半合/稼穑四库≥3
 *   4. 无官杀破格: 官杀分 < 5%
 *   5. 纯度: 有财星→降假专旺
 */
import type { LayeredContext, EngineResult } from './types.js';

const ORDER = ['木', '火', '土', '金', '水'];

const GAN_WX: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土',
  '庚': '金', '辛': '金', '壬': '水', '癸': '水',
};
const ZHI_WX: Record<string, string> = {
  '寅': '木', '卯': '木', '巳': '火', '午': '火',
  '辰': '土', '戌': '土', '丑': '土', '未': '土',
  '申': '金', '酉': '金', '亥': '水', '子': '水',
};

// 三会局
const SAN_HUI: Record<string, string[]> = {
  '木': ['寅', '卯', '辰'], '火': ['巳', '午', '未'],
  '金': ['申', '酉', '戌'], '水': ['亥', '子', '丑'],
};
// 三合局
const SAN_HE: Record<string, string[]> = {
  '木': ['亥', '卯', '未'], '火': ['寅', '午', '戌'],
  '金': ['巳', '酉', '丑'], '水': ['申', '子', '辰'],
};
// 半合局（缺长生之支也算半合）
const BAN_HE: Record<string, string[][]> = {
  '木': [['卯', '未'], ['亥', '卯']],
  '火': [['午', '戌'], ['寅', '午']],
  '金': [['酉', '丑'], ['巳', '酉']],
  '水': [['子', '申'], ['申', '子']],
};

const GE_NAMES: Record<string, string> = {
  '木': '曲直格（仁寿格）', '火': '炎上格（率性格）',
  '金': '从革格（金刚格）', '水': '润下格（灵秀格）',
  '土': '稼穑格（笃实格）',
};

const ZHUANGWANG_XI: Record<string, string[]> = {
  '木': ['水', '木', '火'], '火': ['木', '火', '土'],
  '土': ['火', '土', '金'], '金': ['土', '金', '水'],
  '水': ['金', '水', '木'],
};
const ZHUANGWANG_JI: Record<string, string[]> = {
  '木': ['金'], '火': ['水'], '土': ['木'], '金': ['火'], '水': ['土'],
};

function hasSanHui(zhis: string[], wx: string): boolean {
  const hui = SAN_HUI[wx];
  if (!hui || hui.length === 0) return false;
  return hui.every(z => zhis.includes(z));
}
function hasSanHe(zhis: string[], wx: string): boolean {
  const he = SAN_HE[wx];
  if (!he || he.length === 0) return false;
  const zhiSet = new Set(zhis);
  // 合局不能被冲散: 检查合局中的地支是否被冲
  const heStr = he.join('');
  const isChonged = checkChongBreak(zhis, he);
  return !isChonged && he.every(z => zhiSet.has(z));
}
function hasBanHe(zhis: string[], wx: string): boolean {
  const pairs = BAN_HE[wx];
  if (!pairs || pairs.length === 0) return false;
  const zhiSet = new Set(zhis);
  return pairs.some(pair => {
    if (!pair.every(z => zhiSet.has(z))) return false;
    // 半合也不能被冲散
    return !checkChongBreak(zhis, pair);
  });
}
/** 检查指定的地支组是否被六冲破坏 */
function checkChongBreak(allZhis: string[], group: string[]): boolean {
  const CHONG: Record<string, string> = {
    '子': '午', '午': '子', '丑': '未', '未': '丑',
    '寅': '申', '申': '寅', '卯': '酉', '酉': '卯',
    '辰': '戌', '戌': '辰', '巳': '亥', '亥': '巳',
  };
  const groupSet = new Set(group);
  for (const z of allZhis) {
    const chong = CHONG[z];
    if (chong && groupSet.has(chong)) return true; // 冲到了合局中的支
  }
  return false;
}
function monthIsWang(monthZhi: string, wx: string): boolean {
  return ZHI_WX[monthZhi] === wx;
}
/** 稼穑格特殊: 四库≥3 即成立 */
function hasManyTus(zhis: string[]): boolean {
  const tuZhis = ['辰', '戌', '丑', '未'];
  return zhis.filter(z => tuZhis.includes(z)).length >= 3;
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

  // ═══ 1. 极端门槛：自党 > 70% ═══
  const sealEl = ORDER[(di + 4) % 5];
  const ziDangScore = fuyi.dayScore + (scores[sealEl] ?? 0);
  const ziDangRatio = total > 0 ? ziDangScore / total : 0;
  if (ziDangRatio <= 0.70) {
    return { engine: '专旺格', yongShen: null, yongShenType: '奇格', diagnostics: [`自党比${(ziDangRatio*100).toFixed(0)}%≤70%，不入专旺格`], specialPattern: false };
  }

  // ═══ 2. 月令当旺 ═══
  const monthZhi = (ctx.base.pillars as Record<string, { zhi: string }>).月柱?.zhi ?? '';
  if (!monthIsWang(monthZhi, dayEl)) {
    return { engine: '专旺格', yongShen: null, yongShenType: '奇格', diagnostics: [`月令${monthZhi}不当旺(需${dayEl}月)，不入专旺格`], specialPattern: false };
  }

  // ═══ 3. 地支成势: 三会/三合/半合/稼穑四库/同五行≥3 ═══
  const allZhis = Object.values(ctx.base.pillars as Record<string, { zhi: string }>).map(p => p.zhi);
  const sameElCount = allZhis.filter(z => ZHI_WX[z] === dayEl).length; // 地支同五行数量
  const hasHui = hasSanHui(allZhis, dayEl);
  const hasHe = hasSanHe(allZhis, dayEl);
  const hasBan = hasBanHe(allZhis, dayEl);
  const isJiaSe = dayEl === '土' && hasManyTus(allZhis);
  const isQuasi = !hasHui && !hasHe && !hasBan && !isJiaSe && sameElCount >= 3; // 类专旺: 同五行≥3个
  if (!hasHui && !hasHe && !hasBan && !isJiaSe && !isQuasi) {
    const req = dayEl === '土'
      ? '需三会土/三合火/四库≥3/同五行地支≥3'
      : `需三会${SAN_HUI[dayEl]?.join('')}或三合${SAN_HE[dayEl]?.join('')}或半合或同五行地支≥3`;
    return { engine: '专旺格', yongShen: null, yongShenType: '奇格', diagnostics: [`地支不成${dayEl}局(${req})，不入专旺格`], specialPattern: false };
  }

  // ═══ 4. 官杀检查 ═══
  const killerEl = ORDER[(di + 3) % 5];
  const killerScore = scores[killerEl] ?? 0;
  if (killerScore > total * 0.05) {
    return { engine: '专旺格', yongShen: null, yongShenType: '奇格', diagnostics: [`官杀${killerEl}得分${killerScore.toFixed(1)}>5%破格，不入专旺格`], specialPattern: false };
  }

  // ═══ 5. 财星检查 → 降假专旺 / 类专旺也降假 ═══
  const wealthEl = ORDER[(di + 2) % 5];
  const wealthScore = scores[wealthEl] ?? 0;
  const hasWealth = wealthScore > total * 0.05;
  const isFalse = hasWealth || isQuasi; // 有财星 或 类专旺(非正统三合三会) → 假专旺

  // ═══ 入格 ═══
  const name = GE_NAMES[dayEl] || `专旺${dayEl}格`;
  const subLabel = isFalse ? '(假专旺)' : '';
  const diagParts = [
    `专旺格:${name}${subLabel}`,
    `日主${dayEl}极旺(自党${(ziDangRatio*100).toFixed(0)}%)`,
    isJiaSe ? '四库≥3成稼穑' : hasHui ? '三会局成立' : hasHe ? '三合局成立' : hasBan ? '半合局成立' : `类专旺(同五行地支${sameElCount}个)` ,
    `月令${monthZhi}当旺`,
    `${killerEl}(${killerScore <= 0 ? '无' : '极弱'})官杀不破格`,
  ];
  if (isFalse) diagParts.push(`财星${wealthEl}(${wealthScore.toFixed(1)})→降假专旺`);

  return {
    engine: '专旺格',
    yongShen: dayEl,
    yongShenType: '奇格',
    diagnostics: diagParts,
    specialPattern: true,
  };
}

export function getZhuangWangXi(dayEl: string): string[] { return ZHUANGWANG_XI[dayEl] ?? []; }
export function getZhuangWangJi(dayEl: string): string[] { return ZHUANGWANG_JI[dayEl] ?? []; }

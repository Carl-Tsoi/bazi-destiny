/**
 * 变格引擎: 食神制杀格 — 七杀攻身，食伤透出制杀为权
 *
 * 判据:
 *   1. 七杀透干有力（天干有七杀，元素分 > 10%）
 *   2. 食伤透干有力（天干有食神或伤官，元素分 > 10%）
 *   3. 日元有根（比劫根最佳，印根次之 — 根强才能扛杀+生食伤）
 *   4. 印星不可在天干（天干印星会通关泄食伤，破坏制杀结构）
 *   5. 身弱（杀为忌才需要制）
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

export function shishangZhishaEngine(ctx: LayeredContext): EngineResult {
  const fuyi = ctx.fuyi;
  const scores = fuyi.elementScores;
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const dayGan = (ctx.base.pillars as Record<string, { gan: string }>).日柱?.gan ?? '';
  const dayEl = GAN_WX[dayGan] ?? '';
  const di = ORDER.indexOf(dayEl);
  const pillars = ctx.base.pillars as Record<string, { gan: string; zhi: string; shishen: string; canggan: Array<{ stem: string; tenGod: string }> }>;

  if (di < 0 || total <= 0) {
    return { engine: '食神制杀', yongShen: null, yongShenType: '奇格', diagnostics: ['日主无法识别'], specialPattern: false };
  }

  // ═══ 1. 身弱 — 杀为忌才需要制 ═══
  if (!fuyi.dayStrength.includes('弱')) {
    return { engine: '食神制杀', yongShen: null, yongShenType: '奇格', diagnostics: ['身强不需制杀，不入食神制杀格'], specialPattern: false };
  }

  // ═══ 2. 七杀透干有力 ═══
  let hasKiller = false;
  const killerEl = ORDER[(di + 3) % 5]; // 克日主 = 官杀五行
  for (const p of Object.values(pillars)) {
    if (p.shishen === '七杀') { hasKiller = true; break; }
  }
  const killerScore = scores[killerEl] ?? 0;
  const killerRatio = total > 0 ? killerScore / total : 0;
  if (!hasKiller || killerRatio < 0.10) {
    return { engine: '食神制杀', yongShen: null, yongShenType: '奇格', diagnostics: ['七杀不透或无力(需透干+>10%)，不入食神制杀格'], specialPattern: false };
  }

  // ═══ 3. 食伤透干有力 ═══
  let hasOutput = false;
  for (const p of Object.values(pillars)) {
    if (p.shishen === '食神' || p.shishen === '伤官') { hasOutput = true; break; }
  }
  const outputEl = ORDER[(di + 1) % 5]; // 我生 = 食伤五行
  const outputScore = scores[outputEl] ?? 0;
  const outputRatio = total > 0 ? outputScore / total : 0;
  if (!hasOutput || outputRatio < 0.10) {
    return { engine: '食神制杀', yongShen: null, yongShenType: '奇格', diagnostics: ['食伤不透或无力(需透干+>10%)，不入食神制杀格'], specialPattern: false };
  }

  // ═══ 4. 印星不可在天干 — 天干印星会通关 ═══
  let hasSealInGan = false;
  for (const p of Object.values(pillars)) {
    if (p.shishen === '正印' || p.shishen === '偏印') { hasSealInGan = true; break; }
  }
  if (hasSealInGan) {
    return { engine: '食神制杀', yongShen: null, yongShenType: '奇格', diagnostics: ['天干有印星通关(泄食伤生身)，不入食神制杀格'], specialPattern: false };
  }

  // ═══ 5. 日元必须有根 — 身弱无根扛不住杀 ═══
  const sealEl = ORDER[(di + 4) % 5]; // 印星五行
  const peerEl = dayEl;
  let hasPeerRoot = false, hasSealRoot = false;
  // 日支同五行 = 自坐强根
  const dayZhiEl = ZHI_WX[(pillars as any).日柱?.zhi ?? ''] ?? '';
  if (dayZhiEl === peerEl) hasPeerRoot = true;
  // 其他地支比劫根
  for (const p of Object.values(pillars)) {
    if (p.shishen === '日主') continue;
    const zhiEl = ZHI_WX[p.zhi] ?? '';
    if (zhiEl === peerEl) hasPeerRoot = true;
    if (zhiEl === sealEl) hasSealRoot = true;
  }
  // 藏干根
  for (const p of Object.values(pillars)) {
    for (const h of p.canggan) {
      if (GAN_WX[h.stem] === peerEl) hasPeerRoot = true;
      if (GAN_WX[h.stem] === sealEl) hasSealRoot = true;
    }
  }
  if (!hasPeerRoot && !hasSealRoot) {
    return { engine: '食神制杀', yongShen: null, yongShenType: '奇格', diagnostics: ['日元无根(需比劫或印根)，不入食神制杀格'], specialPattern: false };
  }
  const rootType = hasPeerRoot ? '比劫根(佳)' : '印根(次)';

  // ═══ 入格 ═══
  const yongShen = hasPeerRoot ? peerEl : sealEl;

  return {
    engine: '食神制杀',
    yongShen,
    yongShenType: '奇格',
    diagnostics: [
      `食神制杀格:七杀${killerEl}透干(比${(killerRatio*100).toFixed(0)}%)，食伤${outputEl}透干(比${(outputRatio*100).toFixed(0)}%)制之`,
      `日元有${rootType}`,
      `身弱忌杀，以食伤制杀为权`,
    ],
    specialPattern: true,
  };
}

/** 食神制杀格喜神: 比劫+食伤 */
export function getShiZhiXi(dayEl: string): string[] {
  const di = ORDER.indexOf(dayEl);
  return [dayEl, ORDER[(di + 1) % 5]]; // 比劫 + 食伤
}

/** 食神制杀格忌神: 印星+财星+官杀 */
export function getShiZhiJi(dayEl: string): string[] {
  const di = ORDER.indexOf(dayEl);
  return [ORDER[(di + 4) % 5], ORDER[(di + 2) % 5], ORDER[(di + 3) % 5]]; // 印+财+官杀
}

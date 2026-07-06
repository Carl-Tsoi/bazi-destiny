/**
 * 变格引擎: 从格 — 日主极弱无根，某一异党独大成势，弃命相从
 *
 * 判据: 日主分比 < 5%（极弱门槛），某异党 > 50%
 * 四种子格: 从财格 从杀格 从儿格 从势格
 * 真从/假从: 假从 = 天干有一粒虚浮印比（无根）
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

// 十神→offset映射
// peers=0(同我), output=1(我生), wealth=2(我克), officials=3(克我), seals=4(生我)
const STAR_OFFSET: Record<string, number> = {
  'peers': 0, 'output': 1, 'wealth': 2, 'officials': 3, 'seals': 4,
};

function getEl(dayEl: string, offset: number): string {
  const di = ORDER.indexOf(dayEl);
  if (di < 0) return '';
  return ORDER[(di + offset) % 5];
}

/** 检测天干是否有虚浮印比（假从判断） — 排除日柱自身 */
function hasFloatingZiDang(pillars: Record<string, { gan: string; zhi: string; shishen: string; canggan: Array<{ stem: string; tenGod: string }> }>, dayEl: string): boolean {
  const sealEl = getEl(dayEl, 4);   // 印星五行
  const peerEl = dayEl;              // 比劫五行

  for (const p of Object.values(pillars)) {
    // 跳过日柱自身——日主天干不是"外部生扶"
    if (p.shishen === '日主') continue;
    const ganEl = GAN_WX[p.gan] ?? '';
    // 天干是印比
    if (ganEl === sealEl || ganEl === peerEl) {
      // 检查地支是否有根（同五行）
      const zhiEl = ZHI_WX[p.zhi] ?? '';
      const hasRoot = zhiEl === ganEl || p.canggan.some(h => GAN_WX[h.stem] === ganEl);
      if (!hasRoot) return true; // 虚浮：天干有印比但地支无根
    }
  }
  return false;
}

// 从格喜忌映射: 从什么就喜什么+喜生它的
function computeCongXi(dayEl: string, starOffset: number): string[] {
  const wangEl = ORDER[(ORDER.indexOf(dayEl) + starOffset) % 5];
  const shengEl = ORDER[(ORDER.indexOf(wangEl) + 4) % 5]; // 生旺神的五行
  return [wangEl, shengEl];
}
function computeCongJi(dayEl: string, starOffset: number): string[] {
  const wangEl = ORDER[(ORDER.indexOf(dayEl) + starOffset) % 5];
  const keEl = ORDER[(ORDER.indexOf(wangEl) + 3) % 5];    // 克旺神的五行
  const opposite = [dayEl, ORDER[(ORDER.indexOf(dayEl) + 4) % 5]]; // 日主+印星(逆势)
  return [...new Set([keEl, ...opposite])];
}

// 格局名
const CONG_NAMES: Record<string, string> = {
  'wealth': '从财格',
  'officials': '从杀格（从官格）',
  'output': '从儿格（从食伤格）',
};

export function congGeEngine(ctx: LayeredContext): EngineResult {
  const fuyi = ctx.fuyi;
  const scores = fuyi.elementScores;
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const dayGan = (ctx.base.pillars as Record<string, { gan: string }>).日柱?.gan ?? '';
  const dayEl = GAN_WX[dayGan] ?? '';
  const di = ORDER.indexOf(dayEl);

  if (di < 0 || total <= 0) {
    return { engine: '从格', yongShen: null, yongShenType: '奇格', diagnostics: ['日主五行无法识别'], specialPattern: false };
  }

  // ── 极端门槛：日主 < 5% ──
  const dayRatio = total > 0 ? (fuyi.dayScore) / total : 0;
  if (dayRatio >= 0.05) {
    return {
      engine: '从格',
      yongShen: null,
      yongShenType: '奇格',
      diagnostics: [`日主比${(dayRatio * 100).toFixed(0)}%≥5%，不入从格`],
      specialPattern: false,
    };
  }

  // ── 找最强异党 ──
  const offsetScores: Array<{ star: string; offset: number; score: number; ratio: number }> = [];
  for (const [star, offset] of Object.entries(STAR_OFFSET)) {
    if (star === 'peers') continue; // 比劫是同党，不算异党
    const el = getEl(dayEl, offset);
    const s = scores[el] ?? 0;
    offsetScores.push({ star, offset, score: s, ratio: s / total });
  }

  offsetScores.sort((a, b) => b.score - a.score);
  const top = offsetScores[0];

  // 单一旺神 > 50%
  if (top.ratio <= 0.50) {
    return {
      engine: '从格',
      yongShen: null,
      yongShenType: '奇格',
      diagnostics: [`最强异党${ORDER[(di + top.offset) % 5]}(${top.star})比${(top.ratio * 100).toFixed(0)}%≤50%，不入从格`],
      specialPattern: false,
    };
  }

  // ── 从儿格特殊要求：必须有财星 ──
  if (top.star === 'output') {
    const wealthEl = getEl(dayEl, 2);
    const wealthScore = scores[wealthEl] ?? 0;
    if (wealthScore <= 0) {
      return {
        engine: '从格',
        yongShen: null,
        yongShenType: '奇格',
        diagnostics: ['食伤旺但无财星通关，不入从儿格（从儿格需见财）'],
        specialPattern: false,
      };
    }
  }

  // ── 假从检测 ──
  const pillars = ctx.base.pillars as Record<string, { gan: string; zhi: string; shishen: string; canggan: Array<{ stem: string; tenGod: string }> }>;
  const isFalse = hasFloatingZiDang(pillars, dayEl);

  // ── 入格！ ──
  const name = CONG_NAMES[top.star] || `从格`;
  const subLabel = isFalse ? '(假从)' : '(真从)';
  const wangEl = ORDER[(di + top.offset) % 5];

  const diag = [
    `从格:${name}${subLabel}`,
    `日主${dayEl}极弱(比${(dayRatio * 100).toFixed(0)}%)`,
    `旺神${wangEl}(${top.star})独大(比${(top.ratio * 100).toFixed(0)}%)`,
    isFalse ? '假从:天干有虚浮印比(无根)' : '真从:日主无一丝生扶',
  ];

  return {
    engine: '从格',
    yongShen: wangEl,
    yongShenType: '奇格',
    diagnostics: diag,
    specialPattern: true,
  };
}

/** 获取从格喜神 */
export function getCongXi(dayEl: string, starOffset: number): string[] {
  return computeCongXi(dayEl, starOffset);
}

/** 获取从格忌神 */
export function getCongJi(dayEl: string, starOffset: number): string[] {
  return computeCongJi(dayEl, starOffset);
}

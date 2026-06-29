/**
 * 五行力量计分 — 静态查找表与工具函数
 */

// ── 五行映射 ──────────────────────────────────────
export const WX: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火',
  '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
};
export const ZWX: Record<string, string> = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
  '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水',
};
export const ORDER = ['木', '火', '土', '金', '水'];

// ── 气候系数（委托给 climate.ts 模块）───────────────
import { getClimate } from './climate.js';
export { getClimate, loadVersion as loadClimateVersion, activeVersion as climateVersion } from './climate.js';

/** 兼容旧代码：只读 lookup */
export const CLIMATE_COEFF = new Proxy({} as Record<string, Record<string, number>>, {
  get(_t, month: string) {
    return new Proxy({} as Record<string, number>, {
      get(_t2, el: string) {
        return getClimate(month, el);
      },
    });
  },
});

// ── 根气 ──────────────────────────────────────────
export const ROOT_ZHI: Record<string, string[]> = {
  '甲': ['寅', '卯', '辰', '未', '亥'], '乙': ['寅', '卯', '辰', '未', '亥'],
  '丙': ['巳', '午', '寅', '未', '戌'], '丁': ['巳', '午', '寅', '未', '戌'],
  '戊': ['辰', '戌', '丑', '未', '巳', '午'], '己': ['辰', '戌', '丑', '未', '巳', '午'],
  '庚': ['申', '酉', '辰', '戌', '丑'], '辛': ['申', '酉', '辰', '戌', '丑'],
  '壬': ['亥', '子', '申', '辰', '丑'], '癸': ['亥', '子', '申', '辰', '丑'],
};
export const ROOT_LEVELS: Record<string, number> = {
  '寅': 3, '卯': 3, '巳': 3, '午': 3, '申': 3, '酉': 3, '亥': 3, '子': 3,
  '辰': 2, '戌': 2, '丑': 2, '未': 2,
};

export function stemRootScore(gan: string, zhis: string[], cangGans: Array<{ stem: string }>): number {
  let score = 0;
  for (const z of zhis) {
    if (ROOT_ZHI[gan]?.includes(z)) score += ROOT_LEVELS[z] ?? 1;
  }
  for (const h of cangGans) {
    if (h.stem === gan) score += 1;
  }
  return score;
}

// ── 天干五合 ──────────────────────────────────────
export const GAN_HE: Record<string, { result: string }> = {
  '甲己': { result: '土' }, '己甲': { result: '土' },
  '乙庚': { result: '金' }, '庚乙': { result: '金' },
  '丙辛': { result: '水' }, '辛丙': { result: '水' },
  '丁壬': { result: '木' }, '壬丁': { result: '木' },
  '戊癸': { result: '火' }, '癸戊': { result: '火' },
};

// ── 地支六合 ──────────────────────────────────────
export const ZHI_HE: Record<string, string> = {
  '子丑': '土', '丑子': '土', '寅亥': '木', '亥寅': '木',
  '卯戌': '火', '戌卯': '火', '辰酉': '金', '酉辰': '金',
  '巳申': '水', '申巳': '水', '午未': '土', '未午': '土',
};

// ── 地支三合/半合 ────────────────────────────────
export const TRI_COMBOS: Array<{ members: [string, string, string]; el: string; mid: string }> = [
  { members: ['申', '子', '辰'], el: '水', mid: '子' },
  { members: ['巳', '酉', '丑'], el: '金', mid: '酉' },
  { members: ['寅', '午', '戌'], el: '火', mid: '午' },
  { members: ['亥', '卯', '未'], el: '木', mid: '卯' },
];

// ── 地支三会 ──────────────────────────────────────
export const TRI_HUI: Array<{ members: [string, string, string]; el: string }> = [
  { members: ['寅', '卯', '辰'], el: '木' },
  { members: ['巳', '午', '未'], el: '火' },
  { members: ['申', '酉', '戌'], el: '金' },
  { members: ['亥', '子', '丑'], el: '水' },
];

// ── 相刑 ──────────────────────────────────────────
export const XING_PAIRS: Record<string, number> = {
  '寅巳': 1, '巳寅': 1, '巳申': 1, '申巳': 1, '申寅': 1, '寅申': 1,
  '丑戌': 1, '戌丑': 1, '戌未': 1, '未戌': 1, '未丑': 1, '丑未': 1,
  '子卯': 1, '卯子': 1,
};

// ── 六冲配对 ──────────────────────────────────────
export const CHONG_PAIRS: Record<string, string> = {
  '子': '午', '午': '子', '丑': '未', '未': '丑',
  '寅': '申', '申': '寅', '卯': '酉', '酉': '卯',
  '辰': '戌', '戌': '辰', '巳': '亥', '亥': '巳',
};

// ── 干支序列表 ────────────────────────────────────
export const GAN_ORDER = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
export const ZHI_ORDER = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// ── 工具函数 ──────────────────────────────────────

/** 距离衰减系数：紧贴1.0 / 隔柱0.5 / 遥隔0.3 */
export function pairDist(i: number, j: number): number {
  if (i === 0 && j === 1) return 1.0;
  if (i === 0 && j === 2) return 0.5;
  if (i === 0 && j === 3) return 0.3;
  if (i === 1 && j === 2) return 1.0;
  if (i === 1 && j === 3) return 0.5;
  return 1.0;
}

/**
 * 旺衰修正系数：得令减半 / 失时加倍
 * 旺(≥1.5)→0.5, 衰(≤0.7)→2.0, 平→1.0
 */
export function seasonMod(zhi: string, monthZhi: string): number {
  const el = ZWX[zhi] ?? '';
  const wt = CLIMATE_COEFF[monthZhi]?.[el] ?? 1.0;
  if (wt >= 1.5) return 0.5;
  if (wt <= 0.7) return 2.0;
  return 1.0;
}

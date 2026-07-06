/**
 * 变格引擎: 从格 — 日主极弱无根，某一异党独大成势，弃命相从
 *
 * 判据流水线:
 *   1. 极端门槛: 日主分比 < 5%
 *   2. 根气检查: 日支同五行/藏干主气中气→拒绝; 余气弱根→降假从
 *   3. 天干印比检查: 有根→拒绝; 虚浮→假从; 被制化→升真从
 *   4. 旺神纯度: 从财需纯财(官杀不旺); 从杀需财生; 从儿需财泄
 *   5. 从势格: 异党合计>80%但无单一>50%
 *   6. 阳干降级: 甲丙戊庚壬从格降一级
 */
import type { LayeredContext, EngineResult } from './types.js';

const ORDER = ['木', '火', '土', '金', '水'];
const YANG_GAN = new Set(['甲', '丙', '戊', '庚', '壬']);

const GAN_WX: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土',
  '庚': '金', '辛': '金', '壬': '水', '癸': '水',
};
const ZHI_WX: Record<string, string> = {
  '寅': '木', '卯': '木', '巳': '火', '午': '火',
  '辰': '土', '戌': '土', '丑': '土', '未': '土',
  '申': '金', '酉': '金', '亥': '水', '子': '水',
};

const STAR_OFFSET: Record<string, number> = {
  'peers': 0, 'output': 1, 'wealth': 2, 'officials': 3, 'seals': 4,
};

function getEl(dayEl: string, offset: number): string {
  const di = ORDER.indexOf(dayEl);
  return di < 0 ? '' : ORDER[(di + offset) % 5];
}

// ── 根气等级 ─────────────────────────────────

type RootLevel = 'none' | 'trace' | 'weak' | 'strong';

/** 检查日主是否有生扶（印比根气）。从格必须无一丝生扶。 */
function checkDaySupport(pillars: Record<string, { gan: string; zhi: string; shishen: string; canggan: Array<{ stem: string; tenGod: string }> }>, dayEl: string): RootLevel {
  const sealEl = getEl(dayEl, 4); // 印星五行（生我）
  const peerEl = dayEl;            // 比劫五行（同我）

  // 1. 日支自坐印比 = 强根
  const dayZhiEl = ZHI_WX[(pillars as any).日柱?.zhi ?? ''] ?? '';
  if (dayZhiEl === peerEl || dayZhiEl === sealEl) return 'strong';

  // 2. 其他地支有印比 = 强根
  for (const p of Object.values(pillars)) {
    if (p.shishen === '日主') continue;
    const zhiEl = ZHI_WX[p.zhi] ?? '';
    if (zhiEl === peerEl || zhiEl === sealEl) return 'strong';
  }

  // 3. 藏干中检查印比根
  let bestLevel: RootLevel = 'none';
  for (const p of Object.values(pillars)) {
    for (let i = 0; i < p.canggan.length; i++) {
      const h = p.canggan[i];
      const hEl = GAN_WX[h.stem] ?? '';
      if (hEl === peerEl || hEl === sealEl) {
        if (i === 0) return 'strong';     // 主气根
        else if (i === 1 && bestLevel === 'none') bestLevel = 'weak';   // 中气根
        else if (i === 2 && bestLevel === 'none') bestLevel = 'trace';  // 余气根
      }
    }
  }
  return bestLevel;
}

// ── 天干印比检查 ─────────────────────────────

type ZiDangStatus = 'none' | 'defeated' | 'floating' | 'rooted';

/**
 * 检查外部印比状态（排除日主自身）
 *   none: 无任何印比
 *   defeated: 有印比但被合化/克制 → 升真从
 *   floating: 有虚浮印比（无根）→ 假从
 *   rooted: 有印比且有根 → 不入从格
 */
function checkZiDang(pillars: Record<string, { gan: string; zhi: string; shishen: string; canggan: Array<{ stem: string; tenGod: string }> }>, dayEl: string, dayGan: string): ZiDangStatus {
  const sealEl = getEl(dayEl, 4);
  const peerEl = dayEl;
  let hasFloating = false;
  let hasRooted = false;

  for (const p of Object.values(pillars)) {
    if (p.shishen === '日主') continue;
    const ganEl = GAN_WX[p.gan] ?? '';
    if (ganEl !== sealEl && ganEl !== peerEl) continue;

    // 检查是否被合化（天干五合）
    const isHeHua = checkHeHua(p.gan, pillars);
    if (isHeHua) continue; // 被合化 → 视为不存在

    // 检查是否被强克（旁边有强克星）
    const isRestrained = checkRestrained(p, pillars, dayEl);
    if (isRestrained) continue; // 被克制 → 视为失去作用

    // 有根检查
    const zhiEl = ZHI_WX[p.zhi] ?? '';
    const hasRoot = zhiEl === ganEl || p.canggan.some(h => GAN_WX[h.stem] === ganEl);
    if (hasRoot) hasRooted = true;
    else hasFloating = true;
  }

  if (hasRooted) return 'rooted';
  if (hasFloating) return 'floating';
  return 'none';
}

/** 简单五合检测：甲己、乙庚、丙辛、丁壬、戊癸 */
function checkHeHua(gan: string, pillars: Record<string, { gan: string }>): boolean {
  const hePair: Record<string, string> = { '甲': '己', '己': '甲', '乙': '庚', '庚': '乙', '丙': '辛', '辛': '丙', '丁': '壬', '壬': '丁', '戊': '癸', '癸': '戊' };
  const partner = hePair[gan];
  if (!partner) return false;
  return Object.values(pillars).some(p => p.gan === partner);
}

/** 简单被克检测：同柱地支克天干（截脚） */
function checkRestrained(p: { gan: string; zhi: string }, _pillars: any, _dayEl: string): boolean {
  const ganEl = GAN_WX[p.gan] ?? '';
  const zhiEl = ZHI_WX[p.zhi] ?? '';
  const KE: Record<string, string> = { '木': '土', '火': '金', '土': '水', '金': '木', '水': '火' };
  return KE[zhiEl] === ganEl; // 地支克天干（截脚）
}

/** 检测日主的印比根是否全部被六冲或合化摧毁 */
function areAllRootsDestroyed(pillars: Record<string, { gan: string; zhi: string; shishen: string; canggan: Array<{ stem: string; tenGod: string }> }>, dayEl: string): boolean {
  const CHONG: Record<string, string> = {
    '子': '午', '午': '子', '丑': '未', '未': '丑',
    '寅': '申', '申': '寅', '卯': '酉', '酉': '卯',
    '辰': '戌', '戌': '辰', '巳': '亥', '亥': '巳',
  };
  const sealEl = getEl(dayEl, 4);
  const peerEl = dayEl;
  const allZhis = Object.values(pillars).map(p => p.zhi);

  // 收集所有印比地支
  const supportZhis: string[] = [];
  for (const p of Object.values(pillars)) {
    if (p.shishen === '日主') continue;
    const zhiEl = ZHI_WX[p.zhi] ?? '';
    if (zhiEl === peerEl || zhiEl === sealEl) {
      supportZhis.push(p.zhi);
    }
  }

  // 如果没有地支根（只有藏干根），检查藏干根是否被冲
  if (supportZhis.length === 0) {
    // 检查藏干所在的柱是否被冲
    for (const p of Object.values(pillars)) {
      if (p.shishen === '日主') continue;
      for (const h of p.canggan) {
        if (GAN_WX[h.stem] === peerEl || GAN_WX[h.stem] === sealEl) {
          // 藏干所在柱的地支被冲 → 根被破坏
          const chongZhi = CHONG[p.zhi];
          if (chongZhi && allZhis.includes(chongZhi)) return true;
          return false; // 有未受冲的藏干根
        }
      }
    }
    return false;
  }

  // 每个地支根都被冲才视为全部摧毁
  return supportZhis.every(z => {
    const chongZhi = CHONG[z];
    return chongZhi && allZhis.includes(chongZhi);
  });
}

// ── 喜忌 ─────────────────────────────────────

const CONG_XI_MAP: Record<string, (dayEl: string) => string[]> = {
  'wealth': (d) => { const di=ORDER.indexOf(d); return [ORDER[(di+2)%5], ORDER[(di+1)%5], ORDER[(di+3)%5]]; },
  'officials': (d) => { const di=ORDER.indexOf(d); return [ORDER[(di+3)%5], ORDER[(di+2)%5]]; },
  'output': (d) => { const di=ORDER.indexOf(d); return [ORDER[(di+1)%5], ORDER[(di+0)%5], ORDER[(di+2)%5]]; },
};
const CONG_JI_MAP: Record<string, (dayEl: string) => string[]> = {
  'wealth': (d) => { const di=ORDER.indexOf(d); return [d, ORDER[(di+4)%5]]; },
  'officials': (d) => { const di=ORDER.indexOf(d); return [d, ORDER[(di+4)%5], ORDER[(di+1)%5]]; },
  'output': (d) => { const di=ORDER.indexOf(d); return [ORDER[(di+4)%5], ORDER[(di+3)%5]]; },
};
const CONG_NAMES: Record<string, string> = {
  'wealth': '从财格', 'officials': '从杀格（从官格）', 'output': '从儿格（从食伤格）',
};

// ── 主引擎 ───────────────────────────────────

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

  // ═══ 1. 极端门槛：日主 < 5% ═══
  const dayRatio = total > 0 ? fuyi.dayScore / total : 0;
  if (dayRatio >= 0.05) {
    return { engine: '从格', yongShen: null, yongShenType: '奇格', diagnostics: [`日主比${(dayRatio*100).toFixed(0)}%≥5%，不入从格`], specialPattern: false };
  }

  // ═══ 2. 根气检查 ═══
  const pillars = ctx.base.pillars as Record<string, { gan: string; zhi: string; shishen: string; canggan: Array<{ stem: string; tenGod: string }> }>;
  const rootLevel = checkDaySupport(pillars, dayEl);
  let forcedFalse = false; // 降为假从（不拒绝）
  // 强根→检查是否被冲散 / 弱根→假从 / 无根→真从
  if (rootLevel === 'strong') {
    const rootsDestroyed = areAllRootsDestroyed(pillars, dayEl);
    if (!rootsDestroyed) {
      return { engine: '从格', yongShen: null, yongShenType: '奇格', diagnostics: ['日主有强根(地支印比或主气藏干)，不入从格'], specialPattern: false };
    }
    forcedFalse = true; // 根被冲散/合化 → 降假从
  }
  if (rootLevel === 'weak' || rootLevel === 'trace') {
    forcedFalse = true; // 中气/余气弱根 → 降假从
  }

  // ═══ 3. 天干印比检查 ═══
  const ziDangStatus = checkZiDang(pillars, dayEl, dayGan);
  if (ziDangStatus === 'rooted') {
    return { engine: '从格', yongShen: null, yongShenType: '奇格', diagnostics: ['外部印比有根，不入从格'], specialPattern: false };
  }

  // ═══ 4. 找最强异党 ═══
  const offsetScores: Array<{ star: string; offset: number; score: number; ratio: number }> = [];
  for (const [star, offset] of Object.entries(STAR_OFFSET)) {
    if (star === 'peers') continue;
    const el = getEl(dayEl, offset);
    offsetScores.push({ star, offset, score: scores[el] ?? 0, ratio: (scores[el] ?? 0) / total });
  }
  offsetScores.sort((a, b) => b.score - a.score);
  const top = offsetScores[0];

  // ═══ 5. 单一旺神>50% → 标准从格 / 否则从势 ═══
  let congType: string;
  let isCongShi = false;
  if (top.ratio > 0.50) {
    congType = top.star;
  } else {
    // 检查从势: 异党合计 > 80%
    const yiTotal = offsetScores.reduce((s, o) => s + o.score, 0);
    const yiRatio = yiTotal / total;
    if (yiRatio > 0.80) {
      isCongShi = true;
      congType = 'wealth'; // 从势暂用从财喜忌
    } else {
      return { engine: '从格', yongShen: null, yongShenType: '奇格', diagnostics: [`最强异党比${(top.ratio*100).toFixed(0)}%≤50%且异党合计${(yiRatio*100).toFixed(0)}%≤80%，不入从格`], specialPattern: false };
    }
  }

  // ═══ 6. 纯度检查 ═══
  if (!isCongShi) {
    // 从杀格: 需有财生杀（孤杀不贵）
    if (congType === 'officials') {
      const wealthEl = getEl(dayEl, 2);
      const wealthScore = scores[wealthEl] ?? 0;
      if (wealthScore <= 0) {
        forcedFalse = true; // 孤杀无财 → 降假从
      }
    }
    // 从儿格: 需见财星
    if (congType === 'output') {
      const wealthEl = getEl(dayEl, 2);
      if ((scores[wealthEl] ?? 0) <= 0) {
        return { engine: '从格', yongShen: null, yongShenType: '奇格', diagnostics: ['食伤旺但无财星通关，不入从儿格'], specialPattern: false };
      }
    }
  }

  // ═══ 7. 假从因素叠加 ═══
  let isFalse = forcedFalse;
  if (ziDangStatus === 'floating') isFalse = true;
  if (ziDangStatus === 'defeated') isFalse = false; // 被制化 → 升真从

  // ═══ 8. 阳干降级 ═══
  if (YANG_GAN.has(dayGan) && !isFalse) {
    isFalse = true; // 阳干真从 → 降为假从
  }

  // ═══ 入格 ═══
  const offset = STAR_OFFSET[congType] ?? 2;
  const wangEl = ORDER[(di + offset) % 5];
  const name = isCongShi ? '从势格' : (CONG_NAMES[congType] || '从格');
  const subLabel = isFalse ? '(假从)' : '(真从)';

  const diagParts = [
    `从格:${name}${subLabel}`,
    `日主${dayEl}极弱(比${(dayRatio*100).toFixed(0)}%)`,
    isCongShi ? `异党合计>80%成势` : `旺神${wangEl}(${congType})独大(比${(top.ratio*100).toFixed(0)}%)`,
  ];
  if (rootLevel === 'trace') diagParts.push('余气弱根→降假从');
  if (ziDangStatus === 'floating') diagParts.push('天干虚浮印比→降假从');
  if (ziDangStatus === 'defeated') diagParts.push('印比被制化→升真从');
  if (isFalse && forcedFalse && ziDangStatus === 'none') diagParts.push('纯度不足→降假从');
  if (YANG_GAN.has(dayGan)) diagParts.push('阳干难从→降级');

  return {
    engine: '从格',
    yongShen: wangEl,
    yongShenType: '奇格',
    diagnostics: diagParts,
    specialPattern: true,
  };
}

export function getCongXi(dayEl: string, starType: string): string[] {
  const fn = CONG_XI_MAP[starType];
  return fn ? fn(dayEl) : [dayEl];
}
export function getCongJi(dayEl: string, starType: string): string[] {
  const fn = CONG_JI_MAP[starType];
  return fn ? fn(dayEl) : [];
}

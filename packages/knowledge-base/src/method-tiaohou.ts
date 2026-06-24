/**
 * 调候法 — 《穷通宝鉴》十干十二月调候
 * 蒋文正批断流程 Step 3
 *
 * 查穷通宝鉴表获取调候用神。
 * 若首选为克身元素且克身过旺，自动切换到印化杀。
 */
import { lookupTiaoHou, formatTiaoHou } from './qiongtong.js';

const WUXING: Record<string, string> = {
  '甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水',
};

const ELEMENT_ORDER = ['木','火','土','金','水'];

interface Pillar {
  gan: string; zhi: string; shishen: string;
  canggan: Array<{stem: string; tenGod: string}>;
}

export interface TiaoHouInput {
  dayGan: string;
  monthZhi: string;
  pillars: Record<string, Pillar>;
}

export interface TiaoHouOutput {
  yongShen: string;
  reason: string;
}

export function methodTiaoHou(input: TiaoHouInput): TiaoHouOutput {
  const { dayGan, monthZhi, pillars } = input;
  const rule = lookupTiaoHou(dayGan, monthZhi);
  if (!rule) {
    return { yongShen: '调候', reason: '无调候数据。' };
  }

  const primaryEl = WUXING[rule.primary] ?? rule.primary;
  const dayEl = WUXING[dayGan] ?? '';
  const killEl = ELEMENT_ORDER[(ELEMENT_ORDER.indexOf(dayEl) + 3) % 5];

  // 安全检查：首选是否为克身元素
  if (primaryEl === killEl) {
    // 统计克身力量
    let killStrength = 0;
    for (const [, p] of Object.entries(pillars)) {
      if (p.shishen === '七杀') killStrength += 3;
      if (p.shishen === '正官') killStrength += 2;
    }
    // 检查半合增强克身
    const zhis = Object.values(pillars).map(p => p.zhi);
    for (let i = 0; i < zhis.length; i++) {
      for (let j = i + 1; j < zhis.length; j++) {
        const combo = zhis[i] + zhis[j];
        if ((combo === '亥卯' || combo === '卯亥') && killEl === '木') killStrength += 2;
        if ((combo === '寅午' || combo === '午寅') && killEl === '火') killStrength += 2;
        if ((combo === '巳酉' || combo === '酉巳') && killEl === '金') killStrength += 2;
        if ((combo === '申子' || combo === '子申') && killEl === '水') killStrength += 2;
      }
    }

    if (killStrength >= 4) {
      // 克身过旺 → 切换印化杀
      const transformEl = ELEMENT_ORDER[(ELEMENT_ORDER.indexOf(killEl) + 1) % 5];
      const secondaryRule = rule.secondary;
      if (secondaryRule) {
        const secEls = secondaryRule.split('').map(c => WUXING[c] ?? c);
        const preferred = secEls.find(e => e === transformEl) || secEls[0];
        return {
          yongShen: preferred,
          reason: `《穷通宝鉴》首选${rule.primary}(${primaryEl})，但杀过旺（强度${killStrength}），改用${preferred}化杀生身。${formatTiaoHou(dayGan, monthZhi)}`,
        };
      }
      return {
        yongShen: transformEl,
        reason: `杀过旺（强度${killStrength}），穷通首选${primaryEl}反增杀势，改用${transformEl}化杀生身。`,
      };
    }
  }

  return {
    yongShen: primaryEl,
    reason: `《穷通宝鉴》：${formatTiaoHou(dayGan, monthZhi)}`,
  };
}

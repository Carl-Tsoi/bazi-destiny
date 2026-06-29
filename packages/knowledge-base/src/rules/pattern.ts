/**
 * Pattern detection — 格局判断 by 月令透干法
 *
 * Rules:
 * 1. Take 月支 (month branch) hidden stems (藏干)
 * 2. Check which hidden stems appear (透出) in ANY pillar's 天干
 * 3. The透出干's 十神 (relative to 日主) = 格局
 * 4. If multiple透出, priority: 主气 > 中气 > 余气
 * 5. If none透出, take 月支主气 directly
 */
import type { BaziChart } from '@bazi-destiny/core';

// Heavenly stem → 五行 mapping
const GAN_WUXING: Record<string, string> = {
  '甲': '木', '乙': '木',
  '丙': '火', '丁': '火',
  '戊': '土', '己': '土',
  '庚': '金', '辛': '金',
  '壬': '水', '癸': '水',
};

// Heavenly stem yin-yang
const GAN_YINYANG: Record<string, 'yang' | 'yin'> = {
  '甲': 'yang', '丙': 'yang', '戊': 'yang', '庚': 'yang', '壬': 'yang',
  '乙': 'yin',  '丁': 'yin',  '己': 'yin',  '辛': 'yin',  '癸': 'yin',
};

// Wuxing generation cycle: 生我 → 我生 → 克我 → 我克 → 同我
function getShiShen(dayGan: string, targetGan: string): string {
  const dayElement = GAN_WUXING[dayGan];
  const targetElement = GAN_WUXING[targetGan];
  const dayYinYang = GAN_YINYANG[dayGan];
  const targetYinYang = GAN_YINYANG[targetGan];
  const sameYinYang = dayYinYang === targetYinYang;

  // 五行生克关系
  const wuxingOrder = ['木', '火', '土', '金', '水'];
  const dayIdx = wuxingOrder.indexOf(dayElement);
  const targetIdx = wuxingOrder.indexOf(targetElement);

  // 同我
  if (dayElement === targetElement) {
    return sameYinYang ? '比肩' : '劫财';
  }
  // 我生
  if ((dayIdx + 1) % 5 === targetIdx) {
    return sameYinYang ? '食神' : '伤官';
  }
  // 我克
  if ((dayIdx + 2) % 5 === targetIdx) {
    return sameYinYang ? '偏财' : '正财';
  }
  // 克我
  if ((dayIdx + 3) % 5 === targetIdx) {
    return sameYinYang ? '七杀' : '正官';
  }
  // 生我
  if ((dayIdx + 4) % 5 === targetIdx) {
    return sameYinYang ? '偏印' : '正印';
  }

  return '未知';
}

// Standard hidden stems for each earthly branch (地支藏干)
const HIDDEN_STEMS: Record<string, string[]> = {
  '子': ['癸'],
  '丑': ['己', '癸', '辛'],   // 主气己, 中气癸, 余气辛
  '寅': ['甲', '丙', '戊'],
  '卯': ['乙'],
  '辰': ['戊', '乙', '癸'],
  '巳': ['丙', '庚', '戊'],
  '午': ['丁', '己'],
  '未': ['己', '丁', '乙'],
  '申': ['庚', '壬', '戊'],
  '酉': ['辛'],
  '戌': ['戊', '辛', '丁'],
  '亥': ['壬', '甲'],
};

export interface PatternResult {
  /** 格局名称: 正官格, 伤官格, etc. */
  pattern: string;
  /** Which hidden stem透出 and produced this pattern */
  source: {
    hiddenStem: string;
    pillar: string;   // which pillar's天干 matched
    shishen: string;
  };
  /** Which hidden stems were checked */
  checked: string[];
  /** All透出 stems found */
  allTouChu: string[];
}

/**
 * Detect 格局 by 月令透干法
 */
export function detectPattern(chart: BaziChart): PatternResult | null {
  const dayGan = chart.pillars.日柱.gan;
  const monthZhi = chart.pillars.月柱.zhi;
  const hiddenStems = HIDDEN_STEMS[monthZhi];

  if (!hiddenStems || hiddenStems.length === 0) {
    return null;
  }

  // Collect all天干 from four pillars
  const allGans = [
    { gan: chart.pillars.年柱.gan, pillar: '年柱' },
    { gan: chart.pillars.月柱.gan, pillar: '月柱' },
    { gan: chart.pillars.日柱.gan, pillar: '日柱' },
    { gan: chart.pillars.时柱.gan, pillar: '时柱' },
  ];

  const allTouChu: string[] = [];

  // Check each hidden stem in priority order (主气 first)
  for (const hs of hiddenStems) {
    for (const { gan, pillar } of allGans) {
      if (gan === hs) {
        allTouChu.push(hs);
        const shishen = getShiShen(dayGan, hs);
        // Return first match (= highest priority via hidden stem order)
        // but skip 日主 itself (not a pattern)
        if (shishen !== '比肩' && shishen !== '劫财') {
          return {
            pattern: `${shishen}格`,
            source: { hiddenStem: hs, pillar, shishen },
            checked: hiddenStems,
            allTouChu,
          };
        }
        // If it's比肩/劫财, continue to next hidden stem
      }
    }
  }

  // If no透出 or only比肩/劫财透出, take 主气 directly
  const mainQi = hiddenStems[0];
  const shishen = getShiShen(dayGan, mainQi);
  return {
    pattern: `${shishen}格`,
    source: { hiddenStem: mainQi, pillar: '月支主气', shishen },
    checked: hiddenStems,
    allTouChu,
  };
}

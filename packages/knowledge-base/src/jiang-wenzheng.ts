/**
 * 蒋文正《论命琐记》实战技法
 *
 * 1. 暗拱暗会 — find hidden branches via拱合
 * 2. 有杀先论杀 — seven-killings priority check
 * 3. 五行流通 — element flow completeness
 */

// ── 暗拱暗会 ────────────────────────────────────
const ARCH_PAIRS: Record<string, string> = {
  '丑卯':'寅', '卯丑':'寅',
  '寅辰':'卯', '辰寅':'卯',
  '巳未':'午', '未巳':'午',
  '申戌':'酉', '戌申':'酉',
  '亥丑':'子', '丑亥':'子',
};

/** Find hidden (拱) branches from the four pillars */
export function findArchBranches(pillarZhis: string[]): Array<{ pair: string; hidden: string; meaning: string }> {
  const results: Array<{ pair: string; hidden: string; meaning: string }> = [];
  for (let i = 0; i < pillarZhis.length; i++) {
    for (let j = i + 1; j < pillarZhis.length; j++) {
      const combo = pillarZhis[i] + pillarZhis[j];
      const hidden = ARCH_PAIRS[combo];
      if (hidden) {
        const wx: Record<string,string> = {'寅':'木','卯':'木','巳':'火','午':'火','申':'金','酉':'金','亥':'水','子':'水'};
        const el = wx[hidden] ?? '?';
        results.push({
          pair: `${pillarZhis[i]}${pillarZhis[j]}`,
          hidden,
          meaning: `拱出${hidden}(${el})，可用于补足原局缺失五行或定位六亲。`,
        });
      }
    }
  }
  return results;
}

// ── 有杀先论杀 ──────────────────────────────────
export interface SevenKillingsCheck {
  hasKilling: boolean;
  positions: string[];
  hasControl: boolean;   // 食神制杀
  hasTransform: boolean; // 印化杀
  verdict: string;
}

export function checkSevenKillings(
  pillars: Record<string, { gan: string; zhi: string; shishen: string; canggan: Array<{stem: string; tenGod: string}> }>,
): SevenKillingsCheck {
  const positions: string[] = [];
  let hasControl = false;
  let hasTransform = false;

  for (const [pos, p] of Object.entries(pillars)) {
    // Check天干
    if (p.shishen === '七杀') {
      positions.push(`${pos}干${p.gan}`);
    }
    // Check地支藏干
    for (const h of p.canggan) {
      if (h.tenGod === '七杀') {
        positions.push(`${pos}支藏${h.stem}`);
      }
    }
  }

  // Check for制化
  for (const [, p] of Object.entries(pillars)) {
    if (p.shishen === '食神') hasControl = true;
    if (p.shishen === '正印' || p.shishen === '偏印') hasTransform = true;
  }

  const verdict = positions.length === 0
    ? '原局无七杀，不须论杀。'
    : hasControl && hasTransform
    ? `七杀${positions.length}处(${positions.join('、')})，有食神制杀+印星化杀，杀化为权，大吉。`
    : hasControl
    ? `七杀${positions.length}处(${positions.join('、')})，有食神制杀，英雄独压万人。`
    : hasTransform
    ? `七杀${positions.length}处(${positions.join('、')})，有印星化杀，化杀为权。`
    : `⚠ 七杀${positions.length}处(${positions.join('、')})，无制无化，攻身大凶！宜行食神或印星运。`;

  return {
    hasKilling: positions.length > 0,
    positions,
    hasControl,
    hasTransform,
    verdict,
  };
}

// ── 五行流通 ─────────────────────────────────────
export function checkElementFlow(pillars: Record<string, { gan: string; zhi: string; }>): {
  presentElements: string[];
  missingElements: string[];
  flowGaps: string[];
} {
  const wx: Record<string,string> = {
    '甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水',
    '寅':'木','卯':'木','辰':'土','巳':'火','午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水','子':'水','丑':'土',
  };

  const elements = new Set<string>();
  for (const [, p] of Object.entries(pillars)) {
    const ganEl = wx[p.gan]; if (ganEl) elements.add(ganEl);
    const zhiEl = wx[p.zhi]; if (zhiEl) elements.add(zhiEl);
  }

  const all = ['木','火','土','金','水'];
  const present = all.filter(e => elements.has(e));
  const missing = all.filter(e => !elements.has(e));

  // Find flow gaps: where consecutive elements are missing
  const flowGaps: string[] = [];
  for (let i = 0; i < all.length; i++) {
    if (!elements.has(all[i]) && elements.has(all[(i+1)%5])) {
      flowGaps.push(`缺${all[i]}，${all[(i+4)%5]}→${all[i]}→${all[(i+1)%5]}流通断裂`);
    }
  }

  return { presentElements: present, missingElements: missing, flowGaps };
}

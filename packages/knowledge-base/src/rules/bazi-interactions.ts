/**
 * Bazi interaction analysis — 天干生克制化, 地支刑冲会合, 大运流年影响
 */

// ── 天干五合 ────────────────────────────────
const GAN_HE: Record<string, string> = {
  '甲己': '土', '己甲': '土',
  '乙庚': '金', '庚乙': '金',
  '丙辛': '水', '辛丙': '水',
  '丁壬': '木', '壬丁': '木',
  '戊癸': '火', '癸戊': '火',
};

// ── 地支六冲 ────────────────────────────────
const ZHI_CHONG: Record<string, string> = {
  '子午': '水火冲', '午子': '水火冲',
  '丑未': '土冲', '未丑': '土冲',
  '寅申': '金木冲', '申寅': '金木冲',
  '卯酉': '金木冲', '酉卯': '金木冲',
  '辰戌': '土冲', '戌辰': '土冲',
  '巳亥': '水火冲', '亥巳': '水火冲',
};

// ── 地支六合 ────────────────────────────────
const ZHI_HE: Record<string, string> = {
  '子丑': '土', '丑子': '土',
  '寅亥': '木', '亥寅': '木',
  '卯戌': '火', '戌卯': '火',
  '辰酉': '金', '酉辰': '金',
  '巳申': '水', '申巳': '水',
  '午未': '土', '未午': '土',
};

// ── 地支三合局 ──────────────────────────────
const SAN_HE: Record<string, { name: string; members: string[] }> = {
  '申子辰': { name: '水局', members: ['申','子','辰'] },
  '巳酉丑': { name: '金局', members: ['巳','酉','丑'] },
  '寅午戌': { name: '火局', members: ['寅','午','戌'] },
  '亥卯未': { name: '木局', members: ['亥','卯','未'] },
};

// ── 地支三刑 ────────────────────────────────
const SAN_XING: Record<string, string> = {
  '子卯': '无礼之刑', '卯子': '无礼之刑',
  '寅巳': '恃势之刑(两刑)', '巳寅': '恃势之刑(两刑)',
  '巳申': '恃势之刑(两刑)', '申巳': '恃势之刑(两刑)',
  '申寅': '恃势之刑(两刑)', '寅申': '恃势之刑(两刑)',
  '丑戌': '无恩之刑(两刑)', '戌丑': '无恩之刑(两刑)',
  '戌未': '无恩之刑(两刑)', '未戌': '无恩之刑(两刑)',
  '未丑': '无恩之刑(两刑)', '丑未': '无恩之刑(两刑)',
};
const SELF_XING_SET = new Set(['辰','午','酉','亥']);

// ── 地支三会 ────────────────────────────────
const SAN_HUI: Record<string, { name: string; members: string[] }> = {
  '寅卯辰': { name: '木局', members: ['寅','卯','辰'] },
  '巳午未': { name: '火局', members: ['巳','午','未'] },
  '申酉戌': { name: '金局', members: ['申','酉','戌'] },
  '亥子丑': { name: '水局', members: ['亥','子','丑'] },
};

// ── Types ─────────────────────────────────────
export interface InteractionResult {
  gans: GanInteraction[];
  zhis: ZhiInteraction[];
  dayunEffects: string[];
  liunianEffects: string[];
  overallJudgment: string;
}

export interface GanInteraction {
  gan1: string;
  gan2: string;
  pillar1: string;
  pillar2: string;
  type: string;        // 合/生/克
  detail: string;
  judgment: string;    // 吉/凶/平
}

export interface ZhiInteraction {
  zhi1: string;
  zhi2: string;
  pillar1: string;
  pillar2: string;
  type: string;        // 冲/合/刑/害/三合
  detail: string;
  judgment: string;
}

// ── Analysis ──────────────────────────────────
export function analyzeInteractions(
  pillars: Record<string, { gan: string; zhi: string; shishen: string }>,
  dayunSteps: Array<{ gan: string; zhi: string; ganShishen: string; zhiShishen: string; startAge: number; endAge: number }>,
  birthYear: number,
  pattern: string,
): InteractionResult {
  const entries = Object.entries(pillars);
  const gans: GanInteraction[] = [];
  const zhis: ZhiInteraction[] = [];

  // ── 天干 interactions between adjacent pillars ──
  for (let i = 0; i < entries.length - 1; i++) {
    const [p1, v1] = entries[i];
    const [p2, v2] = entries[i + 1];
    const combo = v1.gan + v2.gan;

    if (GAN_HE[combo]) {
      gans.push({
        gan1: v1.gan, gan2: v2.gan, pillar1: p1, pillar2: p2,
        type: '合', detail: `${v1.gan}${v2.gan}合化${GAN_HE[combo]}`,
        judgment: v1.gan + v2.gan === '乙庚' ? '吉' : '平',
      });
    } else {
      // Check 生克
      const rel = getGanRelation(v1.gan, v2.gan);
      if (rel) gans.push({
        gan1: v1.gan, gan2: v2.gan, pillar1: p1, pillar2: p2,
        type: rel.type, detail: rel.detail,
        judgment: rel.type === '生' ? '吉' : '需结合喜忌',
      });
    }
  }

  // ── 地支 interactions between all pillar pairs ──
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const [p1, v1] = entries[i];
      const [p2, v2] = entries[j];
      const zhiCombo = v1.zhi + v2.zhi;

      // 六冲
      if (ZHI_CHONG[zhiCombo]) {
        zhis.push({ zhi1: v1.zhi, zhi2: v2.zhi, pillar1: p1, pillar2: p2, type: '冲', detail: `${v1.zhi}${v2.zhi}${ZHI_CHONG[zhiCombo]}，主动荡变化`, judgment: '变动' });
        continue;
      }
      // 六合
      if (ZHI_HE[zhiCombo]) {
        zhis.push({ zhi1: v1.zhi, zhi2: v2.zhi, pillar1: p1, pillar2: p2, type: '六合', detail: `${v1.zhi}${v2.zhi}合化${ZHI_HE[zhiCombo]}，主合作融合`, judgment: '吉' });
        continue;
      }
      // 三刑
      if (SAN_XING[zhiCombo]) {
        // 检查是否三刑全见
        const allZhis3 = entries.map(([,v3])=>v3.zhi).join('');
        const isTriFull =
          (allZhis3.includes('寅')&&allZhis3.includes('巳')&&allZhis3.includes('申')) ||
          (allZhis3.includes('丑')&&allZhis3.includes('戌')&&allZhis3.includes('未'));
        const label = isTriFull ? '三刑全见' : '相刑';
        zhis.push({ zhi1: v1.zhi, zhi2: v2.zhi, pillar1: p1, pillar2: p2, type: '刑', detail: `${v1.zhi}${v2.zhi}${label}，需注意`, judgment: '凶' });
        continue;
      }
      // 自刑
      if (v1.zhi === v2.zhi && SELF_XING_SET.has(v1.zhi)) {
        zhis.push({ zhi1: v1.zhi, zhi2: v2.zhi, pillar1: p1, pillar2: p2, type: '自刑', detail: `${v1.zhi}${v2.zhi}自刑，自我矛盾`, judgment: '注意' });
        continue;
      }
    }
  }

  // Check for 三合局/三会局
  const allZhis = entries.map(([, v]) => v.zhi);
  for (const [key, info] of Object.entries(SAN_HE)) {
    const present = info.members.filter(m => allZhis.includes(m));
    if (present.length === 3) {
      zhis.push({
        zhi1: info.members[0], zhi2: info.members[1], pillar1: entries.find(([,v])=>v.zhi===info.members[0])?.[0]??'?', pillar2: entries.find(([,v])=>v.zhi===info.members[1])?.[0]??'?',
        type: '三合', detail: `${key}三合${info.name}，力量凝聚`, judgment: '吉',
      });
    } else if (present.length === 2) {
      const mids: Record<string,string> = {'水局':'子','金局':'酉','火局':'午','木局':'卯'};
      const hasMid = present.includes(mids[info.name] ?? '');
      zhis.push({
        zhi1: present[0], zhi2: present[1], pillar1: entries.find(([,v])=>v.zhi===present[0])?.[0]??'?', pillar2: entries.find(([,v])=>v.zhi===present[1])?.[0]??'?',
        type: hasMid ? '前半合' : '拱合', detail: `${present.join('')}${hasMid?'前半合':'拱合'}${info.name}`, judgment: '吉',
      });
    }
  }
  for (const [key, info] of Object.entries(SAN_HUI)) {
    const present = info.members.filter(m => allZhis.includes(m));
    if (present.length === 3) {
      zhis.push({
        zhi1: info.members[0], zhi2: info.members[1], pillar1: entries.find(([,v])=>v.zhi===info.members[0])?.[0]??'?', pillar2: entries.find(([,v])=>v.zhi===info.members[1])?.[0]??'?',
        type: '三会', detail: `${key}三会${info.name}，力量最强`, judgment: '吉',
      });
    }
  }

  // ── 大运对原局影响 ──
  const dayunEffects: string[] = [];
  if (dayunSteps.length > 0) {
    const currentDayun = dayunSteps[0]; // First step = birth decade
    for (const [, v] of entries) {
      const ganCombo = v.gan + currentDayun.gan;
      if (GAN_HE[ganCombo]) {
        dayunEffects.push(`大运${currentDayun.gan}与原局${v.gan}相合化${GAN_HE[ganCombo]}，主该柱所主之事有合作机遇`);
      }
      const zhiCombo = v.zhi + currentDayun.zhi;
      if (ZHI_CHONG[zhiCombo]) {
        dayunEffects.push(`大运${currentDayun.zhi}冲原局${v.zhi}，此十年变动较大，该柱所主之事需防波折`);
      }
      if (ZHI_HE[zhiCombo]) {
        dayunEffects.push(`大运${currentDayun.zhi}与原局${v.zhi}六合化${ZHI_HE[zhiCombo]}，此十年稳定发展`);
      }
    }

    // Current dayun based on birth year
    const now = new Date();
    const age = now.getFullYear() - birthYear;
    const current = dayunSteps.find(s => age >= s.startAge && age <= s.endAge);
    if (current) {
      dayunEffects.push(`当前(${age}岁)行${current.gan}${current.zhi}大运，十神${current.ganShishen}/${current.zhiShishen}`);
      for (const [, v] of entries) {
        const zhiCombo = v.zhi + current.zhi;
        if (ZHI_CHONG[zhiCombo]) dayunEffects.push(`⚠ 当前大运${current.zhi}冲原局${v.zhi}，此十年需防变动`);
        if (ZHI_HE[zhiCombo]) dayunEffects.push(`✓ 当前大运${current.zhi}合原局${v.zhi}，稳定发展之象`);
      }
    }
  }

  // ── 流年影响 ──
  const liunianEffects: string[] = [];
  const tg = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  const dz = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  const currentYear = new Date().getFullYear();
  const yearGan = tg[(currentYear - 4) % 10];
  const yearZhi = dz[(currentYear - 4) % 12];
  liunianEffects.push(`${currentYear}年流年${yearGan}${yearZhi}`);

  for (const [, v] of entries) {
    const ganCombo = v.gan + yearGan;
    if (GAN_HE[ganCombo]) {
      liunianEffects.push(`流年${yearGan}与原局${v.gan}相合化${GAN_HE[ganCombo]}，今年该柱所主之事有合好之象`);
    }
    const zhiCombo = v.zhi + yearZhi;
    if (ZHI_CHONG[zhiCombo]) {
      liunianEffects.push(`⚠ 流年${yearZhi}冲原局${v.zhi}，今年变动较大需注意`);
    }
    if (ZHI_HE[zhiCombo]) {
      liunianEffects.push(`流年${yearZhi}合原局${v.zhi}，今年有合作喜庆之事`);
    }
  }
  // Check流年 vs current dayun
  if (dayunSteps.length > 0) {
    const now2 = new Date();
    const age2 = now2.getFullYear() - birthYear;
    const current2 = dayunSteps.find(s => age2 >= s.startAge && age2 <= s.endAge);
    if (current2) {
      const dyZhiCombo = yearZhi + current2.zhi;
      if (ZHI_CHONG[dyZhiCombo]) liunianEffects.push(`⚠ 流年${yearZhi}冲大运${current2.zhi}，岁运相冲，今年变动最显`);
      if (ZHI_HE[dyZhiCombo]) liunianEffects.push(`流年${yearZhi}合大运${current2.zhi}，岁运相合，今年运势畅顺`);
    }
  }

  // ── Overall judgment ──
  const badCount = [...gans, ...zhis].filter(i => i.judgment === '凶' || i.judgment === '注意').length;
  const goodCount = [...gans, ...zhis].filter(i => i.judgment === '吉').length;
  const dayunBad = dayunEffects.filter(e => e.includes('⚠')).length;
  const overall = badCount > 3 || dayunBad > 0
    ? '原局刑冲较多，大运逢冲则变动显著。需结合用神喜忌综合判断，逢喜神运则吉，逢忌神运则凶。'
    : '原局组合尚可，刑冲较少，稳定性较好。';

  return { gans, zhis, dayunEffects, liunianEffects, overallJudgment: overall };
}

// ── Helpers ───────────────────────────────────

const WUXING: Record<string, string> = {
  '甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水',
};
const WX_ORDER = ['木','火','土','金','水'];

function getGanRelation(g1: string, g2: string): { type: string; detail: string } | null {
  const wx1 = WUXING[g1], wx2 = WUXING[g2];
  if (!wx1 || !wx2) return null;
  const i1 = WX_ORDER.indexOf(wx1), i2 = WX_ORDER.indexOf(wx2);

  if (wx1 === wx2) return { type: '比和', detail: `${g1}${g2}五行相同，互相扶持` };
  if ((i1 + 1) % 5 === i2) return { type: '生', detail: `${g1}生${g2}，${g1}力量流向${g2}` };
  if ((i2 + 1) % 5 === i1) return { type: '生', detail: `${g2}生${g1}，${g2}力量流向${g1}` };
  if ((i1 + 2) % 5 === i2) return { type: '克', detail: `${g1}克${g2}，${g1}制约${g2}` };
  if ((i2 + 2) % 5 === i1) return { type: '克', detail: `${g2}克${g1}，${g2}制约${g1}` };
  return null;
}

/**
 * 大运岁运判断 — based on《子平真诠》《滴天髓》
 *
 * Core rules:
 * 1. 大运干支各管5年（天干前5，地支后5）
 * 2. 运与命局刑冲会合 → 吉凶
 * 3. 喜神被冲则凶，忌神被冲则吉
 * 4. 运本美而逢冲则轻，运既忌而又冲则重
 * 5. 岁运: 战(克)、冲(破)、和(合)、好(同类)
 */

interface ZhiInteraction {
  zhi1: string; zhi2: string; pillar1: string; pillar2: string;
  type: string; detail: string; judgment: string;
}

interface GanInteraction {
  gan1: string; gan2: string; pillar1: string; pillar2: string;
  type: string; detail: string; judgment: string;
}

// Simplified interactions for dayun analysis
const ZHI_CHONG_MAP: Record<string, string> = {
  '子午':'水火冲','午子':'水火冲','丑未':'土冲','未丑':'土冲',
  '寅申':'金木冲','申寅':'金木冲','卯酉':'金木冲','酉卯':'金木冲',
  '辰戌':'土冲','戌辰':'土冲','巳亥':'水火冲','亥巳':'水火冲',
};

const ZHI_HE_MAP: Record<string, string> = {
  '子丑':'土','丑子':'土','寅亥':'木','亥寅':'木',
  '卯戌':'火','戌卯':'火','辰酉':'金','酉辰':'金',
  '巳申':'水','申巳':'水','午未':'土','未午':'土',
};

const ZHI_XING_MAP: Record<string, string> = {
  '子卯':'无礼之刑','卯子':'无礼之刑',
  '寅巳':'恃势之刑','巳寅':'恃势之刑','巳申':'恃势之刑','申巳':'恃势之刑','申寅':'恃势之刑','寅申':'恃势之刑',
  '丑戌':'无恩之刑','戌丑':'无恩之刑','戌未':'无恩之刑','未戌':'无恩之刑','未丑':'无恩之刑','丑未':'无恩之刑',
};

const GAN_HE_MAP: Record<string, string> = {
  '甲己':'土','己甲':'土','乙庚':'金','庚乙':'金',
  '丙辛':'水','辛丙':'水','丁壬':'木','壬丁':'木','戊癸':'火','癸戊':'火',
};

const WX = {'甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水'} as Record<string,string>;
const ZWX = {'子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火','午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水'} as Record<string,string>;
const WX_ORDER = ['木','火','土','金','水'];

function isXiShen(element: string, xiShen: string[]): boolean {
  return xiShen.includes(element);
}
function isJiShen(element: string, jiShen: string[]): boolean {
  return jiShen.includes(element);
}

export interface DayunJudgment {
  step: { startAge: number; endAge: number; gan: string; zhi: string; ganShishen: string; zhiShishen: string };
  ganJudgment: string;    // 天干5年
  zhiJudgment: string;    // 地支5年
  interactions: string[]; // with原局
  overall: string;        // "先喜后忌" etc
}

export interface LiunianJudgment {
  year: number;
  gan: string; zhi: string;
  dayunRelation: string;  // 战/冲/和/好
  yuanjuInteractions: string[];
  overall: string;
}

export function judgeDayun(
  dayunSteps: Array<{ startAge: number; endAge: number; gan: string; zhi: string; ganShishen: string; zhiShishen: string }>,
  pillars: Record<string, { gan: string; zhi: string }>,
  xiShen: string[],
  jiShen: string[],
  yongShenElement: string,
): DayunJudgment[] {
  return dayunSteps.map(step => {
    const ganEl = WX[step.gan] ?? '';
    const zhiEl = ZWX[step.zhi] ?? '';
    const interactions: string[] = [];

    // Check if element is用神/喜神/忌神
    const isYongGan = ganEl === yongShenElement;
    const isYongZhi = zhiEl === yongShenElement;
    const ganGood = isYongGan || xiShen.includes(ganEl);
    const ganBad = jiShen.includes(ganEl);
    const zhiGood = isYongZhi || xiShen.includes(zhiEl);
    const zhiBad = jiShen.includes(zhiEl);

    // Check大运天干 vs原局天干
    for (const [name, p] of Object.entries(pillars)) {
      const combo = step.gan + p.gan;
      if (GAN_HE_MAP[combo]) {
        const el = GAN_HE_MAP[combo];
        const judgment = isXiShen(el, xiShen) ? '吉' : isJiShen(el, jiShen) ? '凶' : '平';
        interactions.push(`大运${step.gan}合${name}${p.gan}化${el}(${judgment})`);
      }
    }

    // Check大运地支 vs原局地支
    for (const [name, p] of Object.entries(pillars)) {
      const zCombo = step.zhi + p.zhi;
      if (ZHI_CHONG_MAP[zCombo]) {
        const pillarEl = ZWX[p.zhi] ?? '';
        const isYong = pillarEl === yongShenElement;
        const judgment = isYong ? '⚠ 用神被冲，此运需防该柱所主之事受损' :
                         isJiShen(pillarEl, jiShen) ? '✓ 忌神被冲反吉' :
                         isXiShen(pillarEl, xiShen) ? '⚠ 喜神被冲需注意' : '变动';
        interactions.push(`${step.zhi}冲${name}${p.zhi}: ${judgment}`);
      }
      if (ZHI_HE_MAP[zCombo]) {
        const el = ZHI_HE_MAP[zCombo];
        const judgment = isXiShen(el, xiShen) ? '合化喜神主吉' : isJiShen(el, jiShen) ? '合化忌神主凶' : '平';
        interactions.push(`${step.zhi}合${name}${p.zhi}化${el}: ${judgment}`);
      }
      if (ZHI_XING_MAP[zCombo]) {
        interactions.push(`${step.zhi}刑${name}${p.zhi}: 需注意`);
      }
    }

    // Gan judgment (前5年)
    const ganLabel = isYongGan ? '用神' : ganGood ? '喜神' : ganBad ? '忌神' : '';
    const ganJudgment = ganLabel
      ? `天干${step.gan}(${step.ganShishen})为${ganLabel}，前五年${isYongGan ? '运势最佳' : ganGood ? '运势较佳' : '需谨慎'}`
      : `天干${step.gan}(${step.ganShishen})为平运`;

    // Zhi judgment (后5年)
    const zhiLabel = isYongZhi ? '用神' : zhiGood ? '喜神' : zhiBad ? '忌神' : '';
    const zhiJudgment = zhiLabel
      ? `地支${step.zhi}(${step.zhiShishen})为${zhiLabel}，后五年${isYongZhi ? '运势最佳' : zhiGood ? '运势较佳' : '需谨慎'}`
      : `地支${step.zhi}(${step.zhiShishen})为平运`;

    // Overall: 先喜后忌 or 先忌后喜
    let overall = '';
    if (ganGood && zhiBad) overall = '⚠ 先喜后忌：前五年运佳，后五年转差';
    else if (ganBad && zhiGood) overall = '✓ 先忌后喜：前五年波折，后五年转好';
    else if (ganGood && zhiGood) overall = '✓ 干支皆喜，十年佳运';
    else if (ganBad && zhiBad) overall = '⚠ 干支皆忌，此运需谨慎行事';
    else overall = '平运，随原局走势';

    return { step, ganJudgment, zhiJudgment, interactions, overall };
  });
}

export function judgeLiunian(
  year: number,
  dayunStep: { gan: string; zhi: string; ganShishen: string; zhiShishen: string },
  pillars: Record<string, { gan: string; zhi: string }>,
  xiShen: string[],
  jiShen: string[],
  yongShenElement: string,
): LiunianJudgment {
  const tg = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  const dz = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  const yearGan = tg[(year - 4) % 10];
  const yearZhi = dz[(year - 4) % 12];

  const interactions: string[] = [];

  // 岁运关系 (流年 vs 大运)
  let dayunRelation = '';
  // 战(克)
  const yEl = WX[yearGan] ?? '', dEl = WX[dayunStep.gan] ?? '';
  const yi = WX_ORDER.indexOf(yEl), di = WX_ORDER.indexOf(dEl);
  if (yi >= 0 && di >= 0 && (yi + 2) % 5 === di) {
    dayunRelation = `岁克运(${yearGan}克${dayunStep.gan})，流年克制大运，压力较大`;
  } else if (di >= 0 && yi >= 0 && (di + 2) % 5 === yi) {
    dayunRelation = `运克岁(${dayunStep.gan}克${yearGan})，大运制住流年，主动可控`;
  }
  // 冲
  if (ZHI_CHONG_MAP[yearZhi + dayunStep.zhi]) {
    dayunRelation += ` 岁运相冲(${yearZhi}冲${dayunStep.zhi})，变动最大之年`;
  }
  // 合
  if (ZHI_HE_MAP[yearZhi + dayunStep.zhi]) {
    dayunRelation += ` 岁运相合(${yearZhi}合${dayunStep.zhi})，此年有合作喜庆`;
  }
  if (!dayunRelation) dayunRelation = '岁运平和，无特殊冲合';

  // 流年 vs 原局
  for (const [name, p] of Object.entries(pillars)) {
    const zCombo = yearZhi + p.zhi;
    if (ZHI_CHONG_MAP[zCombo]) {
      const pillarEl = ZWX[p.zhi] ?? '';
      const isYong = pillarEl === yongShenElement;
      const judgment = isYong ? '⚠ 用神被冲' :
                       isJiShen(pillarEl, jiShen) ? '✓ 忌神被冲反吉' :
                       isXiShen(pillarEl, xiShen) ? '⚠ 喜神被冲' : '变动';
      interactions.push(`流年${yearZhi}冲${name}${p.zhi}: ${judgment}`);
    }
    if (ZHI_HE_MAP[zCombo]) {
      const el = ZHI_HE_MAP[zCombo];
      interactions.push(`流年${yearZhi}合${name}${p.zhi}化${el}`);
    }
    const ganCombo = yearGan + p.gan;
    if (GAN_HE_MAP[ganCombo]) {
      interactions.push(`流年${yearGan}合${name}${p.gan}化${GAN_HE_MAP[ganCombo]}`);
    }
  }

  // Overall
  const yEl2 = WX[yearGan] ?? '';
  const yGood = isXiShen(yEl2, xiShen), yBad = isJiShen(yEl2, jiShen);
  const hasChong = interactions.some(i => i.includes('冲'));
  const overall = yGood && !hasChong ? '流年喜神当令，运势较佳' :
                  yBad && hasChong ? '⚠ 流年忌神又逢冲，此年需谨慎' :
                  hasChong ? '变动之年，吉凶参半' : '平年';

  return { year, gan: yearGan, zhi: yearZhi, dayunRelation, yuanjuInteractions: interactions, overall };
}

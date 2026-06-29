/**
 * 病药法 —「有病方为贵」
 *
 * 三步流程：
 *   Step 1: 全局扫描 → 找得分最高的忌神 = 病
 *   Step 2: 旺度分级 → 偏旺克 / 太旺泄
 *   Step 3: 十神来源 → 定具体药方
 *
 * 官杀已在编排器「有杀先论杀」中处理，此处不再重复。
 *
 * Ref: 《神峰通考》病药说、《滴天髓》
 */

const WUXING: Record<string, string> = {
  '甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水',
};

const ELEMENT_ORDER = ['木','火','土','金','水'];

interface Pillar {
  gan: string; zhi: string; shishen: string;
  canggan: Array<{stem: string; tenGod: string}>;
}

export interface BingYaoInput {
  pillars: Record<string, Pillar>;
  dayStrength: string;
  dayScore: number;
  elementScores: Record<string, number>;
}

export interface BingYaoOutput {
  yongShen: string;
  reason: string;
}

export function methodBingYao(input: BingYaoInput): BingYaoOutput | null {
  const { dayStrength, dayScore, elementScores } = input;
  const dayGan = input.pillars.日柱.gan;
  const dayEl = WUXING[dayGan] ?? '';
  const dayIdx = ELEMENT_ORDER.indexOf(dayEl);
  if (dayIdx < 0) return null;

  // 中和不触发
  if (dayStrength.includes('中和')) return null;

  const isWeak = dayStrength.includes('弱');

  // 扶抑忌神集（喜神中不可能有病）
  const shengWo = ELEMENT_ORDER[(dayIdx + 4) % 5]; // 印
  const woSheng = ELEMENT_ORDER[(dayIdx + 1) % 5]; // 食伤
  const woKe = ELEMENT_ORDER[(dayIdx + 2) % 5];    // 财
  const keWo = ELEMENT_ORDER[(dayIdx + 3) % 5];     // 官杀

  const jiSet = new Set<string>();
  if (isWeak) { jiSet.add(keWo); jiSet.add(woSheng); jiSet.add(woKe); }
  else { jiSet.add(shengWo); jiSet.add(dayEl); }

  // 官杀已在编排器有杀先论杀中处理，此处排除
  jiSet.delete(keWo);

  // ─── Step 1: 全局扫描 → 找忌神中得分最高的 = 病 ───
  let bingEl = '', bingScore = 0;
  const allScores = Object.entries(elementScores);
  const totalScore = allScores.reduce((s, [, v]) => s + v, 0);

  for (const [el, score] of allScores) {
    if (jiSet.has(el) && score > bingScore) {
      bingEl = el;
      bingScore = score;
    }
  }

  // 病必须真的偏枯：得分 ≥ 全局总分 × 0.25，且至少有5分
  if (!bingEl || bingScore < 5 || bingScore < totalScore * 0.25) {
    return null;
  }

  // ─── Step 2: 旺度分级 → 克或泄 ───
  const otherScores = allScores.filter(([el]) => el !== bingEl).map(([, v]) => v);
  const avgOther = otherScores.reduce((s, v) => s + v, 0) / Math.max(otherScores.length, 1);
  const isTaiWang = bingScore >= avgOther * 2.0; // 太旺 → 泄

  // ─── Step 3: 十神来源 → 定药方 ───
  const bingIdx = ELEMENT_ORDER.indexOf(bingEl);
  const keBing = ELEMENT_ORDER[(bingIdx + 3) % 5]; // 克病
  const xieBing = ELEMENT_ORDER[(bingIdx + 1) % 5]; // 泄病

  let yao: string, yaoReason: string;

  if (bingEl === dayEl) {
    // 比劫旺
    if (isTaiWang) {
      yao = xieBing;
      yaoReason = `全局扫描：比劫${bingEl}过旺为病(得分${bingScore}，占比${Math.round(bingScore/totalScore*100)}%)，太旺不宜克，取${yao}(食伤泄秀)为药。`;
    } else {
      yao = keBing;
      yaoReason = `全局扫描：比劫${bingEl}偏旺为病(得分${bingScore}，占比${Math.round(bingScore/totalScore*100)}%)，取${yao}(官杀制比)为药。`;
    }
  } else if (bingEl === shengWo) {
    // 印旺
    yao = keBing;
    yaoReason = `全局扫描：印星${bingEl}过旺为病(得分${bingScore}，占比${Math.round(bingScore/totalScore*100)}%)，取${yao}(财破印)为药。`;
  } else if (bingEl === woSheng) {
    // 食伤旺
    if (isTaiWang) {
      yao = xieBing;
      yaoReason = `全局扫描：食伤${bingEl}太旺为病(得分${bingScore}，占比${Math.round(bingScore/totalScore*100)}%)，取${yao}(食伤生财)为药。`;
    } else {
      yao = keBing;
      yaoReason = `全局扫描：食伤${bingEl}偏旺泄身为病(得分${bingScore}，占比${Math.round(bingScore/totalScore*100)}%)，取${yao}(印制食伤)为药。`;
    }
  } else if (bingEl === woKe) {
    // 财旺
    yao = keBing;
    yaoReason = `全局扫描：财星${bingEl}过旺耗身为病(得分${bingScore}，占比${Math.round(bingScore/totalScore*100)}%)，取${yao}(比劫帮身制财)为药。`;
  } else {
    return null;
  }

  return { yongShen: yao, reason: yaoReason };
}

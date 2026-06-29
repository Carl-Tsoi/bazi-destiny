/**
 * 通关法 — 保护喜用神，重定向忌神力量
 *
 * 核心原则：当一个喜用神被忌神克制时，取五行生序中介于两者之间的元素通关，
 * 使「克」转化为「生」。通关元素必须在喜神中。
 *
 * 场景:
 *   身强: 比劫(忌)克财(喜) → 食伤通关  比劫→食伤→财
 *   身强: 印(忌)克食伤(喜) → 比劫通关   印→比劫→食伤
 *   身强: 食伤(忌)克官(喜) → 财通关    食伤→财→官
 *
 * Ref: 《滴天髓》通关论、《论命琐记》
 */

const ELEMENT_ORDER = ['木','火','土','金','水'];

interface Pillar {
  gan: string; zhi: string; shishen: string;
  canggan: Array<{stem: string; tenGod: string}>;
}

export interface TongGuanInput {
  dayGan: string;
  dayStrength: string;
  xiShen: string[];
  jiShen: string[];
  elementScores: Record<string, number>;
  pillars: Record<string, Pillar>;
}

export interface TongGuanOutput {
  yongShen: string;
  reason: string;
}

// 十神关系: dayIdx → 十神元素位置
// 印=idx+4, 比劫=idx, 食伤=idx+1, 财=idx+2, 官杀=idx+3

const WUXING: Record<string, string> = {
  '甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水',
};

export function methodTongGuan(input: TongGuanInput): TongGuanOutput | null {
  const { dayGan, dayStrength, xiShen, jiShen, elementScores, pillars } = input;
  const dayEl = WUXING[dayGan] ?? '';
  const dayIdx = ELEMENT_ORDER.indexOf(dayEl);
  if (dayIdx < 0) return null;

  // 五行定位
  const yin = ELEMENT_ORDER[(dayIdx + 4) % 5];    // 印
  const biJie = dayEl;                             // 比劫
  const shiShang = ELEMENT_ORDER[(dayIdx + 1) % 5]; // 食伤
  const cai = ELEMENT_ORDER[(dayIdx + 2) % 5];     // 财
  const guanSha = ELEMENT_ORDER[(dayIdx + 3) % 5]; // 官杀

  // 找到被忌神克制的喜用神（克方=忌神,被克方=喜神,克方得分≥5）
  function findConflict(killer: string, victim: string, killerName: string, victimName: string): TongGuanOutput | null {
    if (!jiShen.includes(killer)) return null;
    if (!xiShen.includes(victim)) return null;
    const killerScore = elementScores[killer] ?? 0;
    if (killerScore < 5) return null;

    const killerIdx = ELEMENT_ORDER.indexOf(killer);
    const victimIdx = ELEMENT_ORDER.indexOf(victim);
    // 通关元素 = 克方生→通关→通关生→被克方
    // 即: 克方→通关→被克方, where克方生通关 and通关生被克方
    // 通关 = ELEMENT_ORDER[(killerIdx + 1) % 5], and must be ELEMENT_ORDER[(victimIdx + 4) % 5]
    const mediator = ELEMENT_ORDER[(killerIdx + 1) % 5];

    // 通关元素必须在喜神中
    if (!xiShen.includes(mediator)) return null;

    return {
      yongShen: mediator,
      reason: `${killerName}${killer}(${killerScore})克${victimName}${victim}(${elementScores[victim] ?? 0})，取${mediator}通关（${killer}生${mediator}生${victim}），化解冲突。`,
    };
  }

  // 场景 1: 比劫克财（身强，财为喜，比劫为忌）
  const r1 = findConflict(biJie, cai, '比劫', '财星');
  if (r1) return r1;

  // 场景 2: 印克食伤（身强，食伤为喜，印为忌）
  const r2 = findConflict(yin, shiShang, '印星', '食伤');
  if (r2) return r2;

  // 场景 3: 食伤克官（身强，官为喜，食伤为忌）
  const r3 = findConflict(shiShang, guanSha, '食伤', '官杀');
  if (r3) return r3;

  return null;
}

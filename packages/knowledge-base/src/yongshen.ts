/**
 * 用神判断 — 六引擎分层专家系统编排器
 *
 * 子平格局为主框架，后续引擎在框架内逐层精炼。
 * 不是平级投票，是分层叠加。
 *
 * Engine 1:子平格局 → 定格、格局用神
 * Engine 2:滴天髓   → 旺衰、扶抑、从化
 * Engine 3:穷通     → 调候修正
 * Engine 4:神峰     → 病药验证
 * Engine 5:渊海     → 神煞补充
 * Engine 6:三命     → 奇格检测
 *               ↓
 *        喜忌: 身弱自党/身强异党
 */

import { methodTiaoHou } from './method-tiaohou.js';
import { methodFuYi } from './method-fuyi.js';
import { methodTongGuan } from './method-tongguan.js';
import { methodBingYao } from './method-bingyao.js';

import { zipingEngine } from './engines/ziping.js';
import { ditiansuiEngine } from './engines/ditiansui.js';
import { qiongtongEngine } from './engines/qiongtong.js';
import { shenfengEngine } from './engines/shenfeng.js';
import { yuanhaiEngine } from './engines/yuanhai.js';
import { sanmingEngine } from './engines/sanming.js';
import type { LayeredContext } from './engines/types.js';

const WUXING: Record<string, string> = {
  '甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水',
};
const ELEMENT_ORDER = ['木','火','土','金','水'];

interface Pillar { gan:string;zhi:string;shishen:string;canggan:Array<{stem:string;tenGod:string}>; }

export interface YongShenResult {
  tiaohou: { yongShen: string; reason: string };
  fuyi: { yongShen: string; reason: string; dayStrength: string; dayScore: number; elementScores: Record<string, number>; details: string[] };
  bingyao: { yongShen: string; reason: string };
  tongguan?: { yongShen: string; reason: string };
  engines: Array<{ name: string; yongShen: string | null; yongShenType?: string; diagnostics: string[] }>;
  final: { yongShen: string; xiShen: string[]; jiShen: string[] };
}

function getBaseXi(dayStrength: string, dayEl: string, dayIdx: number): string[] {
  const s = ELEMENT_ORDER[(dayIdx+4)%5], k = ELEMENT_ORDER[(dayIdx+3)%5], w = ELEMENT_ORDER[(dayIdx+1)%5], c = ELEMENT_ORDER[(dayIdx+2)%5];
  if (dayStrength.includes('弱')) return [s, dayEl];
  return [k, w, c];
}
function getBaseJi(dayStrength: string, dayEl: string, dayIdx: number): string[] {
  const s = ELEMENT_ORDER[(dayIdx+4)%5], k = ELEMENT_ORDER[(dayIdx+3)%5], w = ELEMENT_ORDER[(dayIdx+1)%5], c = ELEMENT_ORDER[(dayIdx+2)%5];
  if (dayStrength.includes('弱')) return [k, w, c];
  return [s, dayEl];
}

export async function determineYongShen(
  pillars: Record<string, Pillar>, _pattern: string, monthZhi: string, dayGan: string,
): Promise<YongShenResult> {
  const dayEl = WUXING[dayGan] ?? '';
  const dayIdx = ELEMENT_ORDER.indexOf(dayEl);

  const tiaohou = methodTiaoHou({ dayGan, monthZhi, pillars });
  const fuyi = methodFuYi({ pillars });
  const tongguan = methodTongGuan({
    dayGan, dayStrength: fuyi.dayStrength,
    xiShen: getBaseXi(fuyi.dayStrength, dayEl, dayIdx),
    jiShen: getBaseJi(fuyi.dayStrength, dayEl, dayIdx),
    elementScores: fuyi.elementScores, pillars,
  });
  const bingyao = methodBingYao({ pillars, dayStrength: fuyi.dayStrength, dayScore: fuyi.dayScore, elementScores: fuyi.elementScores });

  const ctx: LayeredContext = {
    base: { engine:'bazi',birthInfo:{datetime:'',solarTerm:'',trueSolarTime:false},pillars:pillars as any,pattern:_pattern,yongShen:'',shensha:{},dayun:{startAgeYears:0,direction:'forward',steps:[]} },
    fuyi, tiaohou, tongguan, bingyao,
    engineResults: [],
  };

  // 分层执行六引擎
  for (const engine of [zipingEngine, ditiansuiEngine, qiongtongEngine, shenfengEngine, yuanhaiEngine, sanmingEngine]) {
    const result = engine(ctx);
    ctx.engineResults.push(result);
    if (result.specialPattern) break; // 从格/奇格中断后续
  }

  // 用神:取第一个有非null输出的引擎(优先格局),否则扶抑
  let finalYongShen = fuyi.yongShen;
  for (const r of ctx.engineResults) {
    if (r.yongShen) { finalYongShen = r.yongShen; break; }
  }

  const xiShen = [...getBaseXi(fuyi.dayStrength, dayEl, dayIdx)];
  const jiShen = [...getBaseJi(fuyi.dayStrength, dayEl, dayIdx)];
  if (!xiShen.includes(finalYongShen)) xiShen.push(finalYongShen);
  jiShen.splice(0, jiShen.length, ...jiShen.filter(j => !xiShen.includes(j)));

  return {
    tiaohou: { yongShen: tiaohou.yongShen, reason: tiaohou.reason },
    fuyi: { yongShen: fuyi.yongShen, reason: fuyi.reason, dayStrength: fuyi.dayStrength, dayScore: fuyi.dayScore, elementScores: fuyi.elementScores, details: fuyi.details },
    bingyao: { yongShen: bingyao?.yongShen ?? '通关', reason: bingyao?.reason ?? '命局无明显之病' },
    ...(tongguan ? { tongguan: { yongShen: tongguan.yongShen, reason: tongguan.reason } } : {}),
    engines: ctx.engineResults.map(r => ({ name: r.engine, yongShen: r.yongShen, yongShenType: r.yongShenType, diagnostics: r.diagnostics })),
    final: { yongShen: finalYongShen, xiShen: [...new Set(xiShen)], jiShen: [...new Set(jiShen)] },
  };
}

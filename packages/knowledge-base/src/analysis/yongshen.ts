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
import type { ScoreResult } from './types.js';

import { zipingEngine } from '../engines/ziping.js';
import { ditiansuiEngine } from '../engines/ditiansui.js';
import { qiongtongEngine } from '../engines/qiongtong.js';
import { shenfengEngine } from '../engines/shenfeng.js';
import { yuanhaiEngine } from '../engines/yuanhai.js';
import { sanmingEngine } from '../engines/sanming.js';
import { zhuangwangEngine, getZhuangWangXi, getZhuangWangJi } from '../engines/biange-zhuangwang.js';
import { congGeEngine, getCongXi, getCongJi } from '../engines/biange-cong.js';
import { shishangZhishaEngine, getShiZhiXi, getShiZhiJi } from '../engines/biange-shishang-zhisha.js';
import type { LayeredContext } from '../engines/types.js';

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
  score?: ScoreResult,
): Promise<YongShenResult> {
  const dayEl = WUXING[dayGan] ?? '';
  const dayIdx = ELEMENT_ORDER.indexOf(dayEl);

  const tiaohou = methodTiaoHou({ dayGan, monthZhi, pillars });
  const fuyi = score
    ? methodFuYi({ dayGan, score })
    : methodFuYi({ dayGan, score: { dayScore: 0, dayStrength: '身弱', elementScores: {木:0,火:0,土:0,金:0,水:0}, ziDang: 0, yiDang: 0, details: [], climateVersion: 1 } });
  const tongguan = methodTongGuan({
    dayGan, dayStrength: fuyi.dayStrength,
    xiShen: getBaseXi(fuyi.dayStrength, dayEl, dayIdx),
    jiShen: getBaseJi(fuyi.dayStrength, dayEl, dayIdx),
    elementScores: fuyi.elementScores as Record<string, number>, pillars,
  });
  const bingyao = methodBingYao({ pillars, dayStrength: fuyi.dayStrength, dayScore: fuyi.dayScore, elementScores: fuyi.elementScores as Record<string, number> });

  const ctx: LayeredContext = {
    base: { engine:'bazi',birthInfo:{datetime:'',solarTerm:'',trueSolarTime:false},pillars:pillars as any,pattern:_pattern,yongShen:'',shensha:{},dayun:{startAgeYears:0,direction:'forward',steps:[]} },
    fuyi, tiaohou, tongguan, bingyao,
    engineResults: [],
  };

  // 分层执行引擎：先变格（极旺/极弱），后正格（六书）
  for (const engine of [zhuangwangEngine, congGeEngine, shishangZhishaEngine, zipingEngine, ditiansuiEngine, qiongtongEngine, shenfengEngine, yuanhaiEngine, sanmingEngine]) {
    const result = engine(ctx);
    ctx.engineResults.push(result);
    if (result.specialPattern) break; // 变格命中中断后续引擎
  }

  // 用神:取第一个有非null输出的引擎(变格优先),否则扶抑
  let finalYongShen = fuyi.yongShen;
  let isBianGe = false;
  for (const r of ctx.engineResults) {
    if (r.yongShen) { finalYongShen = r.yongShen; isBianGe = r.engine === '专旺格' || r.engine === '从格' || r.engine === '食神制杀'; break; }
  }

  // 喜忌：变格用自己的喜忌规则，正格用扶抑规则
  let xiShen: string[], jiShen: string[];
  if (isBianGe && ctx.engineResults.length > 0) {
    const winner = ctx.engineResults[ctx.engineResults.length - 1]; // 命中变格的引擎
    if (winner.engine === '专旺格') {
      xiShen = [...getZhuangWangXi(dayEl)];
      jiShen = [...getZhuangWangJi(dayEl)];
    } else if (winner.engine === '从格') {
      // 从格需要知道旺神十神类型: 从diagnostics中解析
      const diag = winner.diagnostics.join(' ');
      let congType = 'wealth'; // 默认从财
      if (diag.includes('从财')) congType = 'wealth';
      else if (diag.includes('从杀')) congType = 'officials';
      else if (diag.includes('从儿')) congType = 'output';
      else if (diag.includes('从势')) congType = 'wealth'; // 从势暂用从财
      xiShen = [...getCongXi(dayEl, congType)];
      jiShen = [...getCongJi(dayEl, congType)];
    } else if (winner.engine === '食神制杀') {
      xiShen = [...getShiZhiXi(dayEl)];
      jiShen = [...getShiZhiJi(dayEl)];
    } else {
      xiShen = [...getBaseXi(fuyi.dayStrength, dayEl, dayIdx)];
      jiShen = [...getBaseJi(fuyi.dayStrength, dayEl, dayIdx)];
    }
  } else {
    xiShen = [...getBaseXi(fuyi.dayStrength, dayEl, dayIdx)];
    jiShen = [...getBaseJi(fuyi.dayStrength, dayEl, dayIdx)];
  }
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

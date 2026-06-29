/**
 * Engine 2:滴天髓平衡引擎 — 旺衰/扶抑/从化
 *
 * 在子平格局框架内运行。
 * 判定日主旺衰 → 确定扶抑方向 → 检测从格/化气。
 * 输出平衡用神。
 */
import type { LayeredContext, EngineResult } from './types.js';

const ORDER = ['木','火','土','金','水'];

export function ditiansuiEngine(ctx: LayeredContext): EngineResult {
  const fuyi = ctx.fuyi;
  const scores = fuyi.elementScores;
  const totalScore = Object.values(scores).reduce((a,b)=>a+b,0);
  const dayEl = ORDER.find(e => (scores[e]??0) === fuyi.dayScore) ?? '';
  const dayScore = fuyi.dayScore;

  // 从格检测
  const maxOther = Math.max(...Object.entries(scores).filter(([k])=>k!==dayEl).map(([,v])=>v));
  const isExtremeWeak = dayScore <= 2 && maxOther >= 20;
  const isExtremeStrong = dayScore >= totalScore * 0.7;

  let special = false, specialType = '';
  if (isExtremeWeak) { special = true; specialType = `真从格:日主${dayEl}极弱(${dayScore.toFixed(1)}分),${Object.entries(scores).sort(([,a],[,b])=>b-a)[0][0]}一方独大`; }
  else if (isExtremeStrong) { special = true; specialType = `专旺格:日主${dayEl}极强(${dayScore.toFixed(1)}分,占比${Math.round(dayScore/totalScore*100)}%)`; }

  const balanceYong = fuyi.yongShen; //扶抑用神

  return {
    engine: '滴天髓平衡',
    yongShen: balanceYong,
    yongShenType: '平衡用神',
    diagnostics: [
      `旺衰:${fuyi.dayStrength}`,
      `平衡用神:${balanceYong}`,
      special ? `特殊:${specialType}` : '正格',
    ],
    specialPattern: special,
  };
}

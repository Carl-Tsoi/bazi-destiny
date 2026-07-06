/**
 * Engine 2:滴天髓平衡引擎 — 旺衰/扶抑
 *
 * 判定日主旺衰 → 确定扶抑方向。
 * 从格/专旺格检测已移至 biange-cong.ts / biange-zhuangwang.ts。
 */
import type { LayeredContext, EngineResult } from './types.js';

export function ditiansuiEngine(ctx: LayeredContext): EngineResult {
  const fuyi = ctx.fuyi;
  const balanceYong = fuyi.yongShen;

  return {
    engine: '滴天髓平衡',
    yongShen: balanceYong,
    yongShenType: '平衡用神',
    diagnostics: [
      `旺衰:${fuyi.dayStrength}`,
      `平衡用神:${balanceYong}`,
      '正格',
    ],
    specialPattern: false, // 变格由 biange-* 引擎检测
  };
}

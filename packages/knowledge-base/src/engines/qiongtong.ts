/**
 * Engine 3:穷通调候引擎 — 气候修正
 *
 * 十干十二月调候表 + 寒暖燥湿状态机。
 * 在子平格局+滴天髓平衡后运行。
 */
import type { LayeredContext, EngineResult } from './types.js';
import { methodTiaoHou } from '../analysis/method-tiaohou.js';

export function qiongtongEngine(ctx: LayeredContext): EngineResult {
  const pillars = ctx.base.pillars;
  const tiaohou = methodTiaoHou({ dayGan: pillars.日柱.gan, monthZhi: pillars.月柱.zhi, pillars });

  return {
    engine: '穷通调候',
    yongShen: tiaohou.yongShen,
    yongShenType: '调候用神',
    diagnostics: [`调候:${tiaohou.yongShen}`, `依据:${tiaohou.reason}`],
  };
}

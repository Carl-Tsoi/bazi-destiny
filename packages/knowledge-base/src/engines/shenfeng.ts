/**
 * Engine 4:神峰病药引擎 — 失衡验证
 *
 * 《神峰通考》:"有病方为贵"
 * 在格局+平衡+调候之后,检查是否有严重失衡。
 */
import type { LayeredContext, EngineResult } from './types.js';

export function shenfengEngine(ctx: LayeredContext): EngineResult {
  const bingyao = ctx.bingyao;
  const hasBing = bingyao !== null && bingyao.yongShen !== '通关';

  return {
    engine: '神峰病药',
    yongShen: hasBing ? bingyao!.yongShen : null,
    yongShenType: '病药用神',
    diagnostics: [hasBing ? `病:${bingyao!.reason}` : '中和无病'],
  };
}

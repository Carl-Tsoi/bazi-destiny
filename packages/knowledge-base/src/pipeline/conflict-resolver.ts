/**
 * 冲突调和器 — 策略权重裁判
 *
 * 当六书之间理论冲突时，根据上下文动态调整各书权重。
 * 不在业务代码里写死 if-else，而是用权重表 + 调节器模式。
 */
import { BookName } from '../attributes/base-types.js';
import type { AnalysisContext, FilterOutput } from './types.js';

/** 各书基础权重 */
const BASE_WEIGHTS: Record<string, number> = {
  [BookName.ZiPing]: 70,
  [BookName.DiTianSui]: 60,
  [BookName.QiongTong]: 50,
  [BookName.ShenFeng]: 50,
  [BookName.YuanHai]: 35,
  [BookName.SanMing]: 35,
};

/** 上下文调节器：根据八字特征调整各书权重 */
interface WeightAdjuster {
  condition: (ctx: AnalysisContext) => boolean;
  adjust: Record<string, number>; // book → delta
}

const ADJUSTERS: WeightAdjuster[] = [
  // 夏月/冬月：调候权重 +15
  {
    condition: ctx => {
      const mz = ctx.chart.base.pillars.月柱.zhi;
      return ['巳','午','未','亥','子','丑'].includes(mz);
    },
    adjust: { [BookName.QiongTong]: +15 },
  },
  // 初春余寒：调候权重 +10
  {
    condition: ctx => ctx.chart.base.pillars.月柱.zhi === '寅',
    adjust: { [BookName.QiongTong]: +10 },
  },
  // 奇格匹配：抑制子平 + 提升三命
  {
    condition: ctx => ctx.filterOutputs.some(o => o.filterName === '三命奇格' && o.stopPropagation),
    adjust: { [BookName.ZiPing]: -20, [BookName.SanMing]: +15 },
  },
  // 从格/专旺：提升滴天髓 + 抑制子平
  {
    condition: ctx => ctx.filterOutputs.some(o => o.filterName === '滴天髓平衡' && o.stopPropagation),
    adjust: { [BookName.DiTianSui]: +20, [BookName.ZiPing]: -15 },
  },
  // 大病大药：提升神峰
  {
    condition: ctx => ctx.filterOutputs.some(o => o.filterName === '神峰病药' && o.diagnostics?.some(d => d.includes('重'))),
    adjust: { [BookName.ShenFeng]: +10 },
  },
];

export interface ResolvedResult {
  /** 最终用神 */
  yongShen: string;
  /** 喜神 */
  xiShen: string[];
  /** 忌神 */
  jiShen: string[];
  /** 各书贡献度 */
  bookContributions: Array<{ book: string; weight: number; candidate: string; accepted: boolean }>;
  /** 冲突记录 */
  conflicts: Array<{ books: string[]; candidate: string; resolution: string }>;
}

export class ConflictResolver {
  private adjusters: WeightAdjuster[] = [...ADJUSTERS];

  resolve(ctx: AnalysisContext): ResolvedResult {
    // 计算各书有效权重
    const effectiveWeights = { ...BASE_WEIGHTS };
    for (const adj of this.adjusters) {
      if (adj.condition(ctx)) {
        for (const [book, delta] of Object.entries(adj.adjust)) {
          effectiveWeights[book] = (effectiveWeights[book] ?? 0) + delta;
        }
      }
    }

    // 从 filterOutputs 收集用神建议
    const candidates = ctx.filterOutputs
      .filter(o => o.yongShenAdjustment?.yongShen)
      .map(o => ({
        book: o.filterName,
        candidate: o.yongShenAdjustment!.yongShen!,
        weight: effectiveWeights[o.filterName] ?? 50,
      }));

    // 按权重排序，最高分胜出
    candidates.sort((a, b) => b.weight - a.weight);
    const winner = candidates[0];

    // 检测冲突
    const conflicts: ResolvedResult['conflicts'] = [];
    for (let i = 1; i < candidates.length; i++) {
      if (candidates[i].candidate !== winner?.candidate) {
        conflicts.push({
          books: [winner!.book, candidates[i].book],
          candidate: winner!.candidate,
          resolution: `${winner!.book}(${winner!.weight}) > ${candidates[i].book}(${candidates[i].weight})`,
        });
      }
    }

    // 合并喜忌(以胜出书+基础用神为主)
    const baseYong = winner?.candidate ?? ctx.baseYongShen.fuyi.yongShen;
    const xiShen = [...ctx.baseYongShen.final.xiShen];
    const jiShen = [...ctx.baseYongShen.final.jiShen];

    return {
      yongShen: baseYong,
      xiShen,
      jiShen,
      bookContributions: candidates.map(c => ({ ...c, accepted: c === winner })),
      conflicts,
    };
  }
}

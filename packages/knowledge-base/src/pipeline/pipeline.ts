/**
 * AnalysisPipeline — 六书过滤器管线编排器
 *
 * 替代 yongshen.ts 中的硬编码 if-else 链。
 * 六个 AnalysisFilter 按优先级顺序依次处理，结果逐层叠加。
 */
import type { EnrichedChart } from '../attributes/base-types.js';
import type { YongShenResult } from '../yongshen.js';
import type { AnalysisContext, AnalysisFilter, FilterOutput } from './types.js';

export class AnalysisPipeline {
  private filters: AnalysisFilter[] = [];

  register(filter: AnalysisFilter): this {
    this.filters.push(filter);
    this.filters.sort((a, b) => a.priority - b.priority);
    return this;
  }

  registerAll(filters: AnalysisFilter[]): this {
    this.filters.push(...filters);
    this.filters.sort((a, b) => a.priority - b.priority);
    return this;
  }

  async execute(chart: EnrichedChart, baseYongShen: YongShenResult): Promise<AnalysisContext> {
    const startedAt = new Date().toISOString();
    const ctx: AnalysisContext = {
      chart,
      baseYongShen,
      filterOutputs: [],
      metadata: { pipelineStartedAt: startedAt, filtersExecuted: 0, conflictsDetected: 0 },
    };

    for (const filter of this.filters) {
      if (!filter.enabled) continue;
      const output = filter.analyze(ctx);
      ctx.filterOutputs.push(output);
      if (output.annotation) {
        chart.annotations.push(output.annotation);
      }
      ctx.metadata.filtersExecuted++;
      if (output.stopPropagation) break;
    }

    return ctx;
  }

  /** 收集所有过滤器的用神调整建议并合并 */
  collectYongShenAdjustments(ctx: AnalysisContext): FilterOutput['yongShenAdjustment'][] {
    return ctx.filterOutputs
      .filter(o => o.yongShenAdjustment)
      .map(o => o.yongShenAdjustment!);
  }
}

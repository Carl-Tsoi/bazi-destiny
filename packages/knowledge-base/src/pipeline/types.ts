/**
 * 过滤器管线核心类型
 *
 * 设计模式：Chain of Responsibility
 * 六个 AnalysisFilter 按优先级顺序依次处理 EnrichedChart，
 * 每个 Filter 可读取前一个 Filter 的结果，并可追加自己的分析结论。
 */
import type { EnrichedChart, BookAnnotation } from '../attributes/base-types.js';
import type { YongShenResult } from '../yongshen.js';

/** 单个过滤器的输出片段 */
export interface FilterOutput {
  filterName: string;
  priority: number;
  /** 本过滤器产出的 book annotation（会合并到 chart.annotations） */
  annotation?: BookAnnotation;
  /** 对用神/喜忌的建议调整 */
  yongShenAdjustment?: Partial<{
    yongShen: string;
    xiShen: string[];
    jiShen: string[];
    reason: string;
  }>;
  /** 格局修正 */
  patternAdjustment?: { pattern: string; reason: string };
  /** 日主强弱修正 */
  strengthAdjustment?: { dayStrength: string; reason: string };
  /** 任意调试/诊断信息 */
  diagnostics?: string[];
  /** 是否中断后续过滤器（如奇格匹配成功时） */
  stopPropagation?: boolean;
}

/** 完整分析上下文 — 在管线中流转 */
export interface AnalysisContext {
  chart: EnrichedChart;
  /** 基础排盘后的用神结果（现有引擎产出） */
  baseYongShen: YongShenResult;
  /** 各过滤器的输出片段，按优先级排序 */
  filterOutputs: FilterOutput[];
  /** 冲突调和器介入后的最终结论 */
  finalYongShen?: string;
  finalXiShen?: string[];
  finalJiShen?: string[];
  /** 全局元数据 */
  metadata: {
    pipelineStartedAt: string;
    filtersExecuted: number;
    conflictsDetected: number;
    totalDurationMs?: number;
  };
}

/** 过滤器接口 */
export interface AnalysisFilter {
  /** 过滤器名称 */
  readonly name: string;
  /** 优先级（越小越先执行） */
  readonly priority: number;
  /** 是否启用 */
  readonly enabled: boolean;

  /** 执行过滤，返回输出片段 */
  analyze(ctx: AnalysisContext): FilterOutput;
}

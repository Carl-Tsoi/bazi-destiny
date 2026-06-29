/**
 * L4: 分析编排器
 * 输入: ChartResult (L2) + ScoreResult (L3)
 * 输出: AnalysisResult
 */
import { determineYongShen } from '../yongshen.js';
import { judgeDayun } from '../dayun-judge.js';
import type { ChartResult, ScoreResult, AnalysisResult, AnalysisOptions } from './types.js';

export async function analyzeChart(
  chart: ChartResult,
  score: ScoreResult,
  options?: AnalysisOptions,
): Promise<AnalysisResult> {
  const pillarRecord = chart.pillars as Record<string, {
    gan: string; zhi: string; shishen: string;
    canggan: Array<{ stem: string; tenGod: string }>;
  }>;

  // 用神分析（六引擎）
  const yongShenResult = await determineYongShen(
    pillarRecord,
    chart.pattern,
    chart.monthZhi,
    chart.dayGan,
    score,
  );

  // 大运分析
  const dayunJudgments = judgeDayun(
    chart.dayun.steps,
    pillarRecord,
    yongShenResult.final.xiShen,
    yongShenResult.final.jiShen,
    yongShenResult.final.yongShen,
  );

  return {
    yongShen: yongShenResult.final.yongShen,
    xiShen: yongShenResult.final.xiShen,
    jiShen: yongShenResult.final.jiShen,
    engines: yongShenResult.engines as unknown as AnalysisResult['engines'],
    dayunJudgments,
    tiaohou: yongShenResult.tiaohou,
    fuyi: yongShenResult.fuyi,
    bingyao: yongShenResult.bingyao,
  };
}

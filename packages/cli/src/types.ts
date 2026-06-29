/**
 * CLI 内部类型 — 层间传递的预计算结果
 */
import type { SpecialtyResultV2 } from '@bazi-destiny/knowledge-base';

export interface PrecomputedData {
  yongShenResult: Record<string, any>;
  score: {
    dayStrength: string;
    dayScore: number;
    elementScores: Record<string, number>;
    ziDang: number;
    yiDang: number;
  };
  specialty: SpecialtyResultV2;
  aiResult?: any;
}

/** 附加了预计算数据的 BaziChart */
export interface BaziChartWithPrecomputed {
  pillars: any;
  dayun: any;
  pattern: string;
  shensha: any;
  _precomputed: PrecomputedData;
}

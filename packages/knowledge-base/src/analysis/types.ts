/**
 * 分析层类型定义 — L2/L3/L4 层间接口
 */

// ── L2: 排盘结果 ──────────────────────────────────
export interface PillarData {
  gan: string;
  zhi: string;
  nayin: string;
  shishen: string;
  canggan: Array<{ stem: string; tenGod: string }>;
}

export interface DayunStep {
  startAge: number;
  endAge: number;
  gan: string;
  zhi: string;
  ganShishen: string;
  zhiShishen: string;
}

export interface ChartResult {
  pillars: Record<string, PillarData>;
  dayun: {
    startAgeYears: number;
    direction: 'forward' | 'reverse';
    steps: DayunStep[];
  };
  pattern: string;
  shensha: Record<string, unknown>;
  dayGan: string;
  dayZhi: string;
  monthZhi: string;
}

// ── L3: 计分结果 ──────────────────────────────────
export type ElementScores = Record<string, number>;

export interface ScoreResult {
  elementScores: ElementScores;
  dayScore: number;
  dayStrength: '身强' | '身弱';
  ziDang: number;
  yiDang: number;
  details: string[];
  climateVersion: number;
}

// ── L4: 分析结果 ──────────────────────────────────
export interface EngineResult {
  engine: string;
  yongShen: string;
  yongShenType: string;
  diagnostics: string[];
  specialPattern?: boolean;
  specialType?: string;
}

export interface DayunJudgment {
  step: DayunStep;
  ganJudgment: string;
  zhiJudgment: string;
  interactions: string[];
  overall: string;
}

export interface AnalysisResult {
  yongShen: string;
  xiShen: string[];
  jiShen: string[];
  engines: EngineResult[];
  dayunJudgments: DayunJudgment[];
  tiaohou: { yongShen: string; reason: string };
  fuyi: { yongShen: string; reason: string };
  bingyao: { yongShen: string; reason: string };
}

// ── Analysis 选项 ─────────────────────────────────
export interface AnalysisOptions {
  age?: number;
  gender?: 'M' | 'F';
}

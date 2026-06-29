// @bazi-destiny/knowledge-base
export { detectPattern } from './pattern.js';
export type { PatternResult } from './pattern.js';
export type { ClassicalRule } from './rules.js';
export { analyzeZiwei, PATTERN_COMMENTARY, BRIGHTNESS_MEANING, STAR_PALACE_COMPATIBILITY, getSihuaComment } from './ziwei-rules.js';
export type { StarPalaceInfo } from './ziwei-rules.js';
export { analyzeInteractions } from './bazi-interactions.js';
export type { InteractionResult, GanInteraction, ZhiInteraction } from './bazi-interactions.js';
export { determineYongShen } from './yongshen.js';
export type { YongShenResult } from './yongshen.js';

// ── 专家系统引擎 ──
export { zipingEngine } from './engines/ziping.js';
export { ditiansuiEngine } from './engines/ditiansui.js';
export { qiongtongEngine } from './engines/qiongtong.js';
export { shenfengEngine } from './engines/shenfeng.js';
export { yuanhaiEngine } from './engines/yuanhai.js';
export { sanmingEngine } from './engines/sanming.js';
export type { EngineResult, LayeredContext } from './engines/types.js';
export { methodTiaoHou } from './method-tiaohou.js';
export type { TiaoHouInput, TiaoHouOutput } from './method-tiaohou.js';
export { methodFuYi } from './method-fuyi.js';
export type { FuYiInput, FuYiOutput } from './method-fuyi.js';
export { CLIMATE_COEFF } from './power-distribution.js';
export { methodTongGuan } from './method-tongguan.js';
export type { TongGuanInput, TongGuanOutput } from './method-tongguan.js';
export { methodBingYao } from './method-bingyao.js';
export type { BingYaoInput, BingYaoOutput } from './method-bingyao.js';
export { judgeDayun, judgeLiunian } from './dayun-judge.js';
export type { DayunJudgment, LiunianJudgment } from './dayun-judge.js';

// ── L3 计分层 ──
export { scoreChart } from './scoring/score-engine.js';
// ── L4 分析层 ──
export { analyzeChart } from './analysis/analyzer.js';
export type { ChartResult, ScoreResult, AnalysisResult, ElementScores } from './analysis/types.js';
export { analyzeSpecialty } from './specialty/index.js';
export type { SpecialtyResult } from './specialty/index.js';
export { findArchBranches, checkSevenKillings, checkElementFlow } from './jiang-wenzheng.js';
export { cite } from './rules-lookup.js';

// @bazi-destiny/knowledge-base
export { detectPattern } from './rules/pattern.js';
export type { PatternResult } from './rules/pattern.js';
export type { ClassicalRule } from './rules/rules.js';
export { analyzeZiwei, PATTERN_COMMENTARY, BRIGHTNESS_MEANING, STAR_PALACE_COMPATIBILITY, getSihuaComment } from './rules/ziwei-rules.js';
export type { StarPalaceInfo } from './rules/ziwei-rules.js';
export { analyzeInteractions } from './rules/bazi-interactions.js';
export type { InteractionResult, GanInteraction, ZhiInteraction } from './rules/bazi-interactions.js';
export { determineYongShen } from './analysis/yongshen.js';
export type { YongShenResult } from './analysis/yongshen.js';

// ── 专家系统引擎 ──
export { zipingEngine } from './engines/ziping.js';
export { ditiansuiEngine } from './engines/ditiansui.js';
export { qiongtongEngine } from './engines/qiongtong.js';
export { shenfengEngine } from './engines/shenfeng.js';
export { yuanhaiEngine } from './engines/yuanhai.js';
export { sanmingEngine } from './engines/sanming.js';
export type { EngineResult, LayeredContext } from './engines/types.js';
export { methodTiaoHou } from './analysis/method-tiaohou.js';
export type { TiaoHouInput, TiaoHouOutput } from './analysis/method-tiaohou.js';
export { methodFuYi } from './analysis/method-fuyi.js';
export type { FuYiInput, FuYiOutput } from './analysis/method-fuyi.js';
export { CLIMATE_COEFF } from './scoring/power-distribution.js';
export { methodTongGuan } from './analysis/method-tongguan.js';
export type { TongGuanInput, TongGuanOutput } from './analysis/method-tongguan.js';
export { methodBingYao } from './analysis/method-bingyao.js';
export type { BingYaoInput, BingYaoOutput } from './analysis/method-bingyao.js';
export { judgeDayun, judgeLiunian } from './analysis/dayun-judge.js';
export type { DayunJudgment, LiunianJudgment } from './analysis/dayun-judge.js';

// ── L3 计分层 ──
export { scoreChart } from './scoring/score-engine.js';
// ── L4 分析层 ──
export { analyzeChart } from './analysis/analyzer.js';
export type { ChartResult, ScoreResult, AnalysisResult, ElementScores } from './analysis/types.js';
export { analyzeAllDimensions } from './specialty/index.js';
export type { SpecialtyResultV2, DimensionResult } from './specialty/index.js';
export type { AnalysisItem } from './specialty/types.js';
export { findArchBranches, checkSevenKillings, checkElementFlow } from './analysis/jiang-wenzheng.js';
export { cite } from './rules/rules-lookup.js';

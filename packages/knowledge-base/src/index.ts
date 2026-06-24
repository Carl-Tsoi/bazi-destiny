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
export { analyzeSpecialty } from './specialty/index.js';
export type { SpecialtyResult } from './specialty/index.js';
export { evaluate, renderEvaluation } from './evaluator.js';
export type { EvalResult, EvalInput } from './evaluator.js';
export { findArchBranches, checkSevenKillings, checkElementFlow } from './jiang-wenzheng.js';
export { cite } from './rules-lookup.js';

// ── 六书属性扩展 ──
export { BookName, enrichChart, getAnnotation, getAttribute, setAnnotation } from './attributes/base-types.js';
export type { BookAnnotation, EnrichedChart } from './attributes/base-types.js';
export type { QiongTongAttributes } from './attributes/qiongtong.js';
export type { DiTianSuiAttributes } from './attributes/ditiansui.js';
export type { ShenFengAttributes } from './attributes/shenfeng.js';
export type { ZiPingAttributes } from './attributes/ziping.js';
export type { YuanHaiAttributes } from './attributes/yuanhai.js';
export type { SanMingAttributes } from './attributes/sanming.js';

// ── 过滤器管线 ──
export { AnalysisPipeline } from './pipeline/pipeline.js';
export { zipingPatternFilter } from './pipeline/filters/ziping-pattern.js';
export { ditiansuiBalanceFilter } from './pipeline/filters/ditiansui-balance.js';
export { qiongtongClimateFilter } from './pipeline/filters/qiongtong-climate.js';
export { shenfengBingyaoFilter } from './pipeline/filters/shenfeng-bingyao.js';
export { yuanhaiShenshaFilter } from './pipeline/filters/yuanhai-shensha.js';
export { sanmingQigeFilter } from './pipeline/filters/sanming-qige.js';
export { ConflictResolver } from './pipeline/conflict-resolver.js';
export type { ResolvedResult } from './pipeline/conflict-resolver.js';
export type { AnalysisContext, AnalysisFilter, FilterOutput } from './pipeline/types.js';

/**
 * reports — AI-assisted destiny analysis layer.
 *
 * Re-exports the AI analysis engine (原局 / 大运 / 流年) consumed by the CLI
 * when --ai is enabled.
 *
 * 注：旧版「三术交叉验证报告」(bazi + ziwei + astrology consensus，依赖
 * cross-validator) 已随紫微/占星引擎暂停而移除。
 */
export { generateAiAnalyses } from './ai-engines.js';
export type { AiInput, AiResult } from './ai-engines.js';

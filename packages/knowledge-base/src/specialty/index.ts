/**
 * 专项断事 — 11引擎编排器 v3
 *
 * 统一判断框架: evaluateStar → lookupTemplate → AnalysisItem
 */

import { buildContext, type SharedContext } from './shared/context.js';
import type { ChartResult, ScoreResult, AnalysisResult } from '../analysis/types.js';

// ── 新版引擎 ──
import { analyzePersonality } from './engine-personality.js';
import { analyzeCareer } from './engine-career.js';
import { analyzeWealth } from './engine-wealth.js';
import { analyzeMarriage } from './engine-marriage.js';
import { analyzeHealth } from './engine-health.js';
import { analyzeChildren } from './engine-children.js';
import { analyzeParents } from './engine-parents.js';
import { analyzeBenefactors } from './engine-benefactors.js';
import { analyzeSiblings } from './engine-siblings.js';
import { analyzeProperty } from './engine-property.js';
import { analyzeLaterLife } from './engine-later-life.js';
import type { AnalysisItem } from './types.js';

// ── 结果类型 ──
export interface DimensionResult {
  dimension: string;
  items: AnalysisItem[];
}

export interface SpecialtyResultV2 {
  dimensions: DimensionResult[];
  rating: { grade: string; summary: string };
}

/** 新版：基于 SharedContext 统一调用所有引擎 */
export function analyzeAllDimensions(
  chart: ChartResult,
  score: ScoreResult,
  analysis: AnalysisResult,
  options?: { gender?: 'M' | 'F'; age?: number },
): SpecialtyResultV2 {
  const ctx = buildContext(chart, score, analysis, options);

  const dimensions: DimensionResult[] = [
    { dimension: '性格', items: analyzePersonality(ctx) },
    { dimension: '事业', items: analyzeCareer(ctx) },
    { dimension: '财运', items: analyzeWealth(ctx) },
    { dimension: '婚姻', items: analyzeMarriage(ctx) },
    { dimension: '健康', items: analyzeHealth(ctx) },
    { dimension: '子女', items: analyzeChildren(ctx) },
    { dimension: '父母', items: analyzeParents(ctx) },
    { dimension: '人际', items: analyzeBenefactors(ctx) },
    { dimension: '兄弟', items: analyzeSiblings(ctx) },
    { dimension: '田宅', items: analyzeProperty(ctx) },
    { dimension: '晚年', items: analyzeLaterLife(ctx) },
  ];

  return { dimensions, rating: computeRating(ctx) };
}

// ── 命格等级 v2 ──────────────────────────────────

function computeRating(ctx: SharedContext): { grade: string; summary: string } {
  let score = 0;

  // 格局明确度 (0-2)
  if (ctx.pattern && !ctx.pattern.includes('未定')) {
    score += ctx.specialPattern ? 1 : 2;
  }

  // 用神有力程度 (0-3): favorable + moderate+
  const allStars = [ctx.officials, ctx.seals, ctx.wealthStars, ctx.outputStars, ctx.peers];
  const yongStars = allStars.filter(
    s => s.favorable && s.strength !== 'absent' && s.strength !== 'weak'
  );
  if (yongStars.length >= 3) score += 3;
  else if (yongStars.length >= 1) score += 1;

  // 刑冲程度 (0-2): 宫位刑冲越少越好
  const clashPalaces = [ctx.spousePalace, ctx.parentsPalace, ctx.childrenPalace, ctx.siblingsPalace]
    .filter(p => p.clashes.length > 0);
  if (clashPalaces.length === 0) score += 2;
  else if (clashPalaces.length <= 1) score += 1;

  // 五行平衡 (0-1)
  if (ctx.missingElements.length === 0 && ctx.excessElements.length <= 1) score += 1;

  // 等级判定（封顶B）
  if (score >= 7) return { grade: 'B', summary: '格局明确，用神得力，五行流通，刑冲少。命格层次较佳。' };
  if (score >= 5) return { grade: 'B', summary: '格局可用，用神有力但有不足，需大运扶持。中等偏上。' };
  if (score >= 3) return { grade: 'C', summary: '格局有缺，用神乏力或刑冲较多，波折较多需大运补救。' };
  return { grade: 'D', summary: '格局不明，用神受制，五行失衡，一生波折较多。' };
}


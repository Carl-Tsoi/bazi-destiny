/** 专项断事 — 11引擎编排器 */

import type { BaziChart } from '@bazi-destiny/core';
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

// 旧版兼容
import { buildCtx } from './types.js';
import type { SpecContext } from './types.js';
import { personalityEngine } from './engine-personality.js';
import { careerEngine } from './engine-career.js';
import { wealthEngine } from './engine-wealth.js';
import { marriageEngine } from './engine-marriage.js';
import { healthEngine } from './engine-health.js';
import { childrenEngine } from './engine-children.js';
import { parentsEngine } from './engine-parents.js';
import { benefactorsEngine } from './engine-benefactors.js';
import { propertyEngine } from './engine-property.js';

// ── 新版结果类型 ──
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

function computeRating(ctx: SharedContext): { grade: string; summary: string } {
  let gs = 0;
  if (ctx.pattern && !ctx.pattern.includes('未定')) gs += 2;
  if (ctx.dayStrength === '身强') gs += 2;
  if (ctx.wealthStars.present) gs += 1;
  if (ctx.officials.present) gs += 1;
  const clashCount = [ctx.spousePalace, ctx.parentsPalace, ctx.childrenPalace, ctx.siblingsPalace]
    .filter(p => p.clashes.length > 0).length;
  if (clashCount <= 1) gs += 1;

  let grade: string, summary: string;
  if (gs >= 5) { grade = 'A'; summary = '格局明确，身强能担，财官有气，刑冲较少。命格层次较佳。'; }
  else if (gs >= 3) { grade = 'B'; summary = '格局可用但有不足之处，需大运补足。中等命格。'; }
  else if (gs >= 1) { grade = 'C'; summary = '格局有缺，需大运扶持方可有成。'; }
  else { grade = 'D'; summary = '格局不明，刑冲较多，波折较多。'; }
  return { grade, summary };
}

// ── 旧版接口（向后兼容，待迁移完成后移除） ──

export interface SpecialtyResult {
  personality: string[]; education: string[]; career: string[]; wealth: string[];
  marriage: string[]; parents: string[]; benefactors: string[]; children: string[];
  property: string[]; health: string[];
  rating: { grade: string; summary: string };
}

export function analyzeSpecialty(bazi: BaziChart, dayStrength: string, pattern: string, gender?: string): SpecialtyResult {
  const ctx = buildCtx(bazi, dayStrength, pattern, gender);
  const caiStars = ctx.caiStars;

  let gs = 0;
  if (pattern && !pattern.includes('未定')) gs += 2;
  if (dayStrength.includes('中和')) gs += 1; else if (ctx.isStrong) gs += 2;
  if (caiStars.length > 0) gs += 1;
  if (ctx.officials.length > 0) gs += 1;
  const chongCount = ctx.allZhis.flatMap((z, i, a) => a.slice(i + 1).map(z2 => z + z2)).filter(c =>
    ['子午', '午子', '丑未', '未丑', '寅申', '申寅', '卯酉', '酉卯', '辰戌', '戌辰', '巳亥', '亥巳'].includes(c)
  ).length;
  if (chongCount <= 1) gs += 1;
  let grade: string, summary: string;
  if (gs >= 5) { grade = 'A'; summary = '格局明确，身强能担，财官有气，刑冲较少。命格层次较佳。'; }
  else if (gs >= 3) { grade = 'B'; summary = '格局可用但有不足之处，需大运补足。中等命格。'; }
  else if (gs >= 1) { grade = 'C'; summary = '格局有缺，需大运扶持方可有成。'; }
  else { grade = 'D'; summary = '格局不明，刑冲较多，波折较多。'; }

  return {
    personality: personalityEngine(ctx), education: [] as string[],
    career: careerEngine(ctx), wealth: wealthEngine(ctx),
    marriage: marriageEngine(ctx), parents: parentsEngine(ctx),
    benefactors: benefactorsEngine(ctx), children: childrenEngine(ctx),
    property: propertyEngine(ctx), health: healthEngine(ctx),
    rating: { grade, summary },
  };
}

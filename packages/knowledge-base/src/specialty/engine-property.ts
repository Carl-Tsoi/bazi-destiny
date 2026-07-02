/**
 * 专项引擎: 田宅 (10/11) v3 — 统一评估器
 */
import type { SharedContext } from './shared/context.js';
import type { AnalysisItem, SpecContext } from './types.js';
import { fileURLToPath } from 'url'; import { dirname, join } from 'path';
import { lookupStarTemplate } from './shared/template-lookup.js';
const __dirname = dirname(fileURLToPath(import.meta.url));
const CDIR = join(__dirname, 'content'); const DIM = 'property';

export function propertyEngine(_ctx: SpecContext): string[] { return []; }

export function analyzeProperty(ctx: SharedContext): AnalysisItem[] {
  const items: AnalysisItem[] = [];

  // 印星 → 房产/不动产
  if (ctx.seals.present) {
    const item = lookupStarTemplate(DIM, 'seals', ctx.seals, CDIR);
    if (item) items.push(item);
  }

  // 财星 → 置业能力/资产积累
  if (ctx.wealthStars.present) {
    const item = lookupStarTemplate(DIM, 'wealth_stars', ctx.wealthStars, CDIR);
    if (item) items.push(item);
  }

  // 官杀 → 房产法律/贷款/产权
  if (ctx.officials.present) {
    const item = lookupStarTemplate(DIM, 'officials', ctx.officials, CDIR);
    if (item) items.push(item);
  }

  return items;
}

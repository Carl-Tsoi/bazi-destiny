/**
 * 专项引擎: 子女 (6/11) v3 — 统一评估器
 */
import type { SharedContext } from './shared/context.js';
import type { AnalysisItem, SpecContext } from './types.js';
import { fileURLToPath } from 'url'; import { dirname, join } from 'path';
import {
  lookupStarTemplate, lookupPalaceTemplate,
} from './shared/template-lookup.js';
const __dirname = dirname(fileURLToPath(import.meta.url));
const CDIR = join(__dirname, 'content'); const DIM = 'children';

export function childrenEngine(_ctx: SpecContext): string[] { return []; }

export function analyzeChildren(ctx: SharedContext): AnalysisItem[] {
  const items: AnalysisItem[] = [];

  // 子女星（食伤）
  if (ctx.outputStars.present) {
    const item = lookupStarTemplate(DIM, 'output', ctx.outputStars, CDIR);
    if (item) items.push(item);
  }

  // 子女宫（时柱）
  const palaceItem = lookupPalaceTemplate(DIM, 'childrenPalace', ctx.childrenPalace, CDIR);
  if (palaceItem) items.push(palaceItem);

  // 财星 → 养育子女的经济基础
  if (ctx.wealthStars.present) {
    const item = lookupStarTemplate(DIM, 'wealth', ctx.wealthStars, CDIR);
    if (item) items.push(item);
  }

  return items;
}

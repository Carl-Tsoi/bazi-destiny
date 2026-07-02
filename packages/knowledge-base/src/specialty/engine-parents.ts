/**
 * 专项引擎: 父母 (7/11) v3 — 统一评估器
 */
import type { SharedContext } from './shared/context.js';
import type { AnalysisItem, SpecContext } from './types.js';
import { fileURLToPath } from 'url'; import { dirname, join } from 'path';
import {
  lookupStarTemplate, lookupPalaceTemplate,
} from './shared/template-lookup.js';
const __dirname = dirname(fileURLToPath(import.meta.url));
const CDIR = join(__dirname, 'content'); const DIM = 'parents';

export function parentsEngine(_ctx: SpecContext): string[] { return []; }

export function analyzeParents(ctx: SharedContext): AnalysisItem[] {
  const items: AnalysisItem[] = [];

  // 年柱宫位
  const palaceItem = lookupPalaceTemplate(DIM, 'parentsPalace', ctx.parentsPalace, CDIR);
  if (palaceItem) items.push(palaceItem);

  // 印星=母亲
  if (ctx.seals.present) {
    const item = lookupStarTemplate(DIM, 'seals', ctx.seals, CDIR);
    if (item) items.push(item);
  }

  // 财星=父亲
  if (ctx.wealthStars.present) {
    const item = lookupStarTemplate(DIM, 'wealth', ctx.wealthStars, CDIR);
    if (item) items.push(item);
  }

  return items;
}

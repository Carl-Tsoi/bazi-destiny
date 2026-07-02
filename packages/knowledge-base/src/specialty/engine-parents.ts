/**
 * 专项引擎: 父母 (7/11) v3 — 传统规则: 印星=母, 偏财=父
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

  // 年柱宫位（祖上/父母宫）
  const palaceItem = lookupPalaceTemplate(DIM, 'parentsPalace', ctx.parentsPalace, CDIR);
  if (palaceItem) items.push(palaceItem);

  // 印星=母亲（正印偏印均可）
  if (ctx.seals.present) {
    const item = lookupStarTemplate(DIM, 'seals', ctx.seals, CDIR);
    if (item) items.push(item);
  }

  // 偏财=父亲（只有偏财，正财不算）
  if (ctx.hasPianCai) {
    const item = lookupStarTemplate(DIM, 'wealth', ctx.wealthStars, CDIR);
    if (item) items.push(item);
  }

  return items;
}

/**
 * 专项引擎: 子女 (6/11) v3 — 传统规则: 男命官杀为子女星, 女命食伤为子女星
 */
import type { SharedContext } from './shared/context.js';
import type { AnalysisItem } from './types.js';
import { fileURLToPath } from 'url'; import { dirname, join } from 'path';
import {
  lookupStarTemplate, lookupPalaceTemplate,
} from './shared/template-lookup.js';
const __dirname = dirname(fileURLToPath(import.meta.url));
const CDIR = join(__dirname, 'content'); const DIM = 'children';
export function analyzeChildren(ctx: SharedContext): AnalysisItem[] {
  const items: AnalysisItem[] = [];

  // 子女星: 传统规则 — 男命官杀, 女命食伤
  const childStar = ctx.gender === 'M' ? ctx.officials : ctx.outputStars;
  const childKey = ctx.gender === 'M' ? 'officials' : 'output';

  if (childStar.present) {
    const item = lookupStarTemplate(DIM, childKey, childStar, CDIR);
    if (item) items.push(item);
  }

  // 子女宫（时柱）
  const palaceItem = lookupPalaceTemplate(DIM, 'childrenPalace', ctx.childrenPalace, CDIR);
  if (palaceItem) items.push(palaceItem);

  // 财星 → 养育子女的经济基础（通用）
  if (ctx.wealthStars.present) {
    const item = lookupStarTemplate(DIM, 'wealth', ctx.wealthStars, CDIR);
    if (item) items.push(item);
  }

  return items;
}

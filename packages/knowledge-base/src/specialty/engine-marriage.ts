/**
 * 专项引擎: 婚姻 (4/11) v3 — 统一评估器
 */
import type { SharedContext } from './shared/context.js';
import type { AnalysisItem, SpecContext } from './types.js';
import { fileURLToPath } from 'url'; import { dirname, join } from 'path';
import {
  lookupStarTemplate, lookupPalaceTemplate, lookupBaseTemplate,
} from './shared/template-lookup.js';
const __dirname = dirname(fileURLToPath(import.meta.url));
const CDIR = join(__dirname, 'content'); const DIM = 'marriage';

export function marriageEngine(_ctx: SpecContext): string[] { return []; }

export function analyzeMarriage(ctx: SharedContext): AnalysisItem[] {
  const items: AnalysisItem[] = [];

  // 配偶星: 男命财为妻, 女命官为夫
  const spouseStar = ctx.gender === 'M' ? ctx.wealthStars : ctx.officials;
  const spouseKey = ctx.gender === 'M' ? 'spouse_star_wealth' : 'spouse_star_officials';

  if (spouseStar.present) {
    const item = lookupStarTemplate(DIM, spouseKey, spouseStar, CDIR);
    if (item) items.push(item);
  }

  // 夫妻宫
  const palaceItem = lookupPalaceTemplate(DIM, 'spousePalace', ctx.spousePalace, CDIR);
  if (palaceItem) items.push(palaceItem);

  // 刑冲
  if (ctx.spousePalace.clashes.length > 0) {
    const chongItem = lookupBaseTemplate(DIM, 'spousePalaceChong', CDIR, '参考');
    if (chongItem) items.push(chongItem);
  }

  // 官杀混杂
  if (ctx.mixedOfficials) {
    const mixedItem = lookupBaseTemplate(DIM, 'mixedOfficials', CDIR, '参考');
    if (mixedItem) items.push(mixedItem);
  }

  return items;
}

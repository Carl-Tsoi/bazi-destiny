/**
 * 专项引擎: 婚姻 (4/11) v3 — 统一评估器
 */
import type { SharedContext } from './shared/context.js';
import type { AnalysisItem } from './types.js';
import { fileURLToPath } from 'url'; import { dirname, join } from 'path';
import {
  lookupStarTemplate, lookupPalaceTemplate, lookupBaseTemplate,
} from './shared/template-lookup.js';
const __dirname = dirname(fileURLToPath(import.meta.url));
const CDIR = join(__dirname, 'content'); const DIM = 'marriage';
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

  // 配偶星混杂: 女命官杀混杂→感情复杂; 男命财星混杂(正财+偏财)→感情复杂
  // 注: ctx.mixedOfficials 只对女命有意义（官杀=夫星）
  // 男命需判断正偏财是否混杂
  if (ctx.gender === 'F' && ctx.mixedOfficials) {
    const mixedItem = lookupBaseTemplate(DIM, 'mixedOfficials', CDIR, '参考');
    if (mixedItem) items.push(mixedItem);
  }
  if (ctx.gender === 'M') {
    // 男命: 判断正财+偏财是否同时存在（财星混杂）
    const hasMixedWealth = ctx.starCount.wealth >= 2;
    if (hasMixedWealth) {
      const mixedItem = lookupBaseTemplate(DIM, 'mixedWealth', CDIR, '参考');
      if (mixedItem) items.push(mixedItem);
    }
  }

  return items;
}

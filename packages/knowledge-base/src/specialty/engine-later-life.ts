/**
 * 专项引擎: 晚年 (11/11) v3 — 统一评估器
 */
import type { SharedContext } from './shared/context.js';
import type { AnalysisItem, SpecContext } from './types.js';
import { fileURLToPath } from 'url'; import { dirname, join } from 'path';
import {
  lookupStarTemplate, lookupPalaceTemplate,
} from './shared/template-lookup.js';
const __dirname = dirname(fileURLToPath(import.meta.url));
const CDIR = join(__dirname, 'content'); const DIM = 'later-life';

export function laterLifeEngine(_ctx: SpecContext): string[] { return []; }

export function analyzeLaterLife(ctx: SharedContext): AnalysisItem[] {
  const items: AnalysisItem[] = [];

  // 子女宫 → 晚年依靠
  const palaceItem = lookupPalaceTemplate(DIM, 'childrenPalace', ctx.childrenPalace, CDIR);
  if (palaceItem) {
    items.push(palaceItem);
  }

  // 食伤(子女星) → 晚年依靠
  if (ctx.outputStars.present) {
    const item = lookupStarTemplate(DIM, 'output', ctx.outputStars, CDIR);
    if (item) items.push(item);
  }

  // 财星 → 晚年经济状况
  if (ctx.wealthStars.present) {
    const item = lookupStarTemplate(DIM, 'wealth', ctx.wealthStars, CDIR);
    if (item) items.push(item);
  }

  // 印星 → 晚年精神寄托
  if (ctx.seals.present) {
    const item = lookupStarTemplate(DIM, 'seals', ctx.seals, CDIR);
    if (item) items.push(item);
  }

  return items;
}

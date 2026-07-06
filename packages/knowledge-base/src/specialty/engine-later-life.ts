/**
 * 专项引擎: 晚年 (11/11) v3 — 传统规则: 男命官杀为子女星→晚年依靠, 女命食伤
 */
import type { SharedContext } from './shared/context.js';
import type { AnalysisItem } from './types.js';
import { fileURLToPath } from 'url'; import { dirname, join } from 'path';
import {
  lookupStarTemplate, lookupPalaceTemplate,
} from './shared/template-lookup.js';
const __dirname = dirname(fileURLToPath(import.meta.url));
const CDIR = join(__dirname, 'content'); const DIM = 'later-life';

export function analyzeLaterLife(ctx: SharedContext): AnalysisItem[] {
  const items: AnalysisItem[] = [];

  // 子女宫 → 晚年依靠
  const palaceItem = lookupPalaceTemplate(DIM, 'childrenPalace', ctx.childrenPalace, CDIR);
  if (palaceItem) {
    items.push(palaceItem);
  }

  // 子女星 → 晚年依靠: 传统规则 — 男命官杀, 女命食伤
  const childStar = ctx.gender === 'M' ? ctx.officials : ctx.outputStars;
  const childKey = ctx.gender === 'M' ? 'officials' : 'output';

  if (childStar.present) {
    const item = lookupStarTemplate(DIM, childKey, childStar, CDIR);
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

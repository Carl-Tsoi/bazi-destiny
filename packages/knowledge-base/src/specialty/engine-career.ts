/**
 * 专项引擎: 事业 (2/11) v3 — 统一评估器
 */
import type { SharedContext } from './shared/context.js';
import type { AnalysisItem } from './types.js';
import { fileURLToPath } from 'url'; import { dirname, join } from 'path';
import { loadBase } from './shared/content-loader.js';
import {
  lookupStarTemplate, lookupComboTemplate,
} from './shared/template-lookup.js';
const __dirname = dirname(fileURLToPath(import.meta.url));
const CDIR = join(__dirname, 'content'); const DIM = 'career';
export function analyzeCareer(ctx: SharedContext): AnalysisItem[] {
  const items: AnalysisItem[] = [];

  // 官杀 (事业星)
  if (ctx.officials.present && ctx.officials.strength !== 'weak') {
    const item = lookupStarTemplate(DIM, 'officials', ctx.officials, CDIR);
    if (item) items.push(item);
  }

  // 食伤生财 (创造/变现)
  if (ctx.outputStars.present) {
    const item = lookupStarTemplate(DIM, 'output', ctx.outputStars, CDIR);
    if (item) items.push(item);
  }

  // 印星 (学历)
  if (ctx.seals.present) {
    const item = lookupStarTemplate(DIM, 'seals', ctx.seals, CDIR);
    if (item) items.push(item);
  }

  // 官印相生 (需要两者都有力)
  if (ctx.officials.present && ctx.seals.present &&
      ctx.officials.strength !== 'weak' && ctx.seals.strength !== 'weak') {
    const comboItem = lookupComboTemplate(DIM, 'officials_seals', ctx.officials.favorable, CDIR);
    if (comboItem) items.push(comboItem);
  }

  // 行业方向 (base.json industryDirections 是简单字符串映射)
  const primaryYong = ctx.yongShen[0];
  if (primaryYong) {
    const base = loadBase(CDIR, DIM);
    const direction = base.industryDirections?.[primaryYong];
    if (direction && typeof direction === 'string') {
      items.push({
        level: '参考',
        layer1: `用神为${primaryYong}，宜${direction}`,
        layer2: '与用神五行相符的行业更容易发挥优势',
        layer3: '优先考虑该方向',
      });
    }
  }

  return items;
}

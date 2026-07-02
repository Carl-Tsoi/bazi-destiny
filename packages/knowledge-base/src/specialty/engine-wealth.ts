/**
 * 专项引擎: 财运 (3/11) v3 — 统一评估器
 */
import type { SharedContext } from './shared/context.js';
import type { AnalysisItem, SpecContext } from './types.js';
import { fileURLToPath } from 'url'; import { dirname, join } from 'path';
import {
  lookupStarTemplate, lookupComboTemplate,
} from './shared/template-lookup.js';
const __dirname = dirname(fileURLToPath(import.meta.url));
const CDIR = join(__dirname, 'content'); const DIM = 'wealth';

export function wealthEngine(_ctx: SpecContext): string[] { return []; }

export function analyzeWealth(ctx: SharedContext): AnalysisItem[] {
  const items: AnalysisItem[] = [];

  // 财星
  if (ctx.wealthStars.present) {
    const item = lookupStarTemplate(DIM, 'wealth_stars', ctx.wealthStars, CDIR);
    if (item) items.push(item);
  }

  // 食伤生财 (财源)
  if (ctx.outputStars.present) {
    const item = lookupStarTemplate(DIM, 'output', ctx.outputStars, CDIR);
    if (item) items.push(item);
  }

  // 比劫夺财 (忌神 + peers present → 参考)
  if (ctx.peers.present && !ctx.peers.favorable) {
    const comboItem = lookupComboTemplate(DIM, 'peers_wealth', false, CDIR);
    if (comboItem) items.push(comboItem);
  }

  return items;
}

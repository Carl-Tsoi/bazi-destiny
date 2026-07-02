/**
 * 专项引擎: 人际/贵人 (8/11) v3 — 统一评估器
 */
import type { SharedContext } from './shared/context.js';
import type { AnalysisItem, SpecContext } from './types.js';
import { fileURLToPath } from 'url'; import { dirname, join } from 'path';
import {
  lookupStarTemplate, lookupBaseTemplate,
} from './shared/template-lookup.js';
const __dirname = dirname(fileURLToPath(import.meta.url));
const CDIR = join(__dirname, 'content'); const DIM = 'benefactors';

export function benefactorsEngine(_ctx: SpecContext): string[] { return []; }

export function analyzeBenefactors(ctx: SharedContext): AnalysisItem[] {
  const items: AnalysisItem[] = [];

  // 比劫 → 朋友/同事/合伙人
  if (ctx.peers.present) {
    const item = lookupStarTemplate(DIM, 'peers', ctx.peers, CDIR);
    if (item) items.push(item);
  }

  // 官杀 → 上司/贵人提携
  if (ctx.officials.present) {
    const item = lookupStarTemplate(DIM, 'officials', ctx.officials, CDIR);
    if (item) items.push(item);
  }

  // 印星 → 长辈/师长/靠山
  if (ctx.seals.present) {
    const item = lookupStarTemplate(DIM, 'seals', ctx.seals, CDIR);
    if (item) items.push(item);
  }

  // 兜底
  if (items.length === 0) {
    const g = lookupBaseTemplate(DIM, 'general', CDIR, '参考');
    if (g) items.push(g);
  }

  return items;
}

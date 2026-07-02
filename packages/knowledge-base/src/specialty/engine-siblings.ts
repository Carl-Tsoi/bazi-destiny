/**
 * 专项引擎: 兄弟 (9/11) v3 — 统一评估器
 */
import type { SharedContext } from './shared/context.js';
import type { AnalysisItem, SpecContext } from './types.js';
import { fileURLToPath } from 'url'; import { dirname, join } from 'path';
import {
  lookupStarTemplate, lookupPalaceTemplate, lookupBaseTemplate,
} from './shared/template-lookup.js';
const __dirname = dirname(fileURLToPath(import.meta.url));
const CDIR = join(__dirname, 'content'); const DIM = 'siblings';

export function siblingsEngine(_ctx: SpecContext): string[] { return []; }

export function analyzeSiblings(ctx: SharedContext): AnalysisItem[] {
  const items: AnalysisItem[] = [];

  // 比劫（兄弟姐妹）
  if (ctx.peers.present) {
    const item = lookupStarTemplate(DIM, 'peers', ctx.peers, CDIR);
    if (item) items.push(item);
  } else {
    // 兜底：无比劫
    const g = lookupBaseTemplate(DIM, 'noPeers', CDIR, '参考');
    if (g) items.push(g);
  }

  // 月柱为兄弟宫
  const palaceItem = lookupPalaceTemplate(DIM, 'siblingsPalace', ctx.siblingsPalace, CDIR);
  if (palaceItem) items.push(palaceItem);

  return items;
}

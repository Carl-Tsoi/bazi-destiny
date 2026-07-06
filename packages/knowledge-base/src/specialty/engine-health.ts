/**
 * 专项引擎: 健康 (5/11) v3 — 统一评估器
 */
import type { SharedContext } from './shared/context.js';
import type { AnalysisItem } from './types.js';
import { fileURLToPath } from 'url'; import { dirname, join } from 'path';
import {
  lookupBaseTemplate, lookupBaseTemplateWithReplace, lookupContentTemplateWithReplace,
} from './shared/template-lookup.js';
const __dirname = dirname(fileURLToPath(import.meta.url));
const CDIR = join(__dirname, 'content'); const DIM = 'health';
export function analyzeHealth(ctx: SharedContext): AnalysisItem[] {
  const items: AnalysisItem[] = [];

  // 五行缺失 → 对应脏腑
  for (const el of ctx.missingElements) {
    // 优先查找元素特定条目 (base.json: deficient_木)
    const specific = lookupBaseTemplate(DIM, `deficient_${el}`, CDIR, '确定');
    if (specific) {
      items.push(specific);
    } else {
      // fallback: generic deficient template with {el} placeholder
      const item = lookupBaseTemplateWithReplace(DIM, 'deficient', { el }, CDIR, '确定');
      if (item) items.push(item);
    }
  }

  // 五行过旺 → ji.json 中的 excess_* 模板
  for (const el of ctx.excessElements) {
    if (ctx.jiShen.includes(el)) {
      const item = lookupContentTemplateWithReplace(DIM, `excess_${el}`, { el }, CDIR, 'ji', '确定');
      if (!item) {
        // fallback: generic excess
        const generic = lookupContentTemplateWithReplace(DIM, 'excess', { el }, CDIR, 'ji', '确定');
        if (generic) items.push(generic);
      } else {
        items.push(item);
      }
    }
  }

  // 十神健康影响 (只输出有力的星)
  const starChecks: Array<{ present: boolean; strong: boolean; key: string }> = [
    { present: ctx.officials.present, strong: ctx.officials.strength !== 'weak' && ctx.officials.strength !== 'absent', key: 'star_officials' },
    { present: ctx.seals.present, strong: ctx.seals.strength !== 'weak' && ctx.seals.strength !== 'absent', key: 'star_seals' },
    { present: ctx.wealthStars.present, strong: ctx.wealthStars.strength !== 'weak' && ctx.wealthStars.strength !== 'absent', key: 'star_wealth' },
    { present: ctx.outputStars.present, strong: ctx.outputStars.strength !== 'weak' && ctx.outputStars.strength !== 'absent', key: 'star_output' },
    { present: ctx.peers.present, strong: ctx.peers.strength !== 'weak' && ctx.peers.strength !== 'absent', key: 'star_peers' },
  ];
  for (const sc of starChecks) {
    if (sc.present && sc.strong) {
      const item = lookupBaseTemplate(DIM, sc.key, CDIR, '参考');
      if (item) items.push(item);
    }
  }

  // 兜底
  if (items.length === 0) {
    const g = lookupBaseTemplate(DIM, 'general', CDIR, '参考');
    if (g) items.push(g);
  }

  return items;
}

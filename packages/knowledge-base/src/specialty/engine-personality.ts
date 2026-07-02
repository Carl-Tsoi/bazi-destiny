/**
 * 专项引擎: 性格 (1/11) v3 — 统一评估器
 */
import type { SharedContext } from './shared/context.js';
import type { AnalysisItem, SpecContext } from './types.js';
import { fileURLToPath } from 'url'; import { dirname, join } from 'path';
import {
  lookupStarTemplate, lookupBaseTemplate, lookupBaseTemplateWithReplace, lookupBaseNested,
} from './shared/template-lookup.js';
const __dirname = dirname(fileURLToPath(import.meta.url));
const CDIR = join(__dirname, 'content'); const DIM = 'personality';

export function personalityEngine(_ctx: SpecContext): string[] { return []; }

export function analyzePersonality(ctx: SharedContext): AnalysisItem[] {
  const items: AnalysisItem[] = [];

  // 日主特性 (base.json → dayGanTraits.{gan})
  const trait = lookupBaseNested(DIM, 'dayGanTraits', ctx.dayGan, CDIR, '确定');
  if (trait) items.push(trait);

  // 身强/身弱 + 忌神数量
  const jc = ctx.jiShen.length;
  const strengthKey = ctx.dayStrength === '身强'
    ? (jc > 0 ? 'strong_ji' : 'strong')
    : (jc > 0 ? 'weak_ji' : 'weak');
  // 尝试 base 中的身强/弱模板
  const bodyItem = lookupBaseTemplate(DIM, strengthKey, CDIR, '确定');
  if (bodyItem) items.push(bodyItem);

  // 十神性格影响
  const starChecks: Array<{ eval: import('./shared/evaluator.js').StarEvaluation; key: string }> = [
    { eval: ctx.officials, key: 'officials' },
    { eval: ctx.outputStars, key: 'output' },
    { eval: ctx.seals, key: 'seals' },
    { eval: ctx.peers, key: 'peers' },
  ];
  for (const sc of starChecks) {
    const item = lookupStarTemplate(DIM, sc.key, sc.eval, CDIR);
    if (item) items.push(item);
  }

  // 五行缺失
  for (const el of ctx.missingElements) {
    const item = lookupBaseNested(DIM, 'missingElements', el, CDIR, '参考');
    if (item) items.push(item);
  }

  return items;
}

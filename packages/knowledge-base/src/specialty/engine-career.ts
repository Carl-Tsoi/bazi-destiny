/**
 * 专项引擎: 事业 (2/11)
 *
 * 规则从 specialty/content/career.json 加载。
 */

import type { SharedContext } from './shared/context.js';
import type { AnalysisItem } from './types.js';
import type { SpecContext } from './types.js';

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let _content: any = null;
function content(): any {
  if (!_content) {
    _content = JSON.parse(readFileSync(join(__dirname, 'content', 'career.json'), 'utf-8'));
  }
  return _content;
}

// 旧版兼容
export function careerEngine(ctx: SpecContext): string[] {
  const c: string[] = [];
  if (ctx.isStrong) {
    c.push('身强能担事，适合体制内、大企业管理、创业等高压岗位。');
    if (ctx.killers.length>0) c.push('七杀透出，有魄力适合军警、金融。');
    if (ctx.officials.length>0) c.push('正官透出，管理才能突出。');
  } else {
    c.push('身弱忌官杀克身，宜自由职业、技术岗。');
    if (ctx.yins.length>0) c.push('印星护身，适合学术研究、教育。');
  }
  if (ctx.foodHurtStars.length>0&&ctx.caiStars.length>0) c.push('食伤生财，技术变现能力强。');
  if (ctx.officials.length>0&&ctx.yins.length>0) c.push('官印相生，仕途较顺。');
  return c;
}

// ── 新版引擎 ──────────────────────────────────────

/** 检查条件表达式，如 "officials.强 AND seals.强" */
function matchCondition(cond: string, ctx: SharedContext): boolean {
  const parts = cond.split(/\s+AND\s+/i);
  return parts.every(p => {
    const [path, val] = p.trim().split('.');
    let obj: any = ctx;
    for (const k of path.split('.')) obj = obj?.[k];
    if (typeof obj === 'object' && 'strength' in obj) return obj.strength === val;
    if (typeof obj === 'boolean') return String(obj) === val;
    return obj === val || String(obj) === val;
  });
}

export function analyzeCareer(ctx: SharedContext): AnalysisItem[] {
  const items: AnalysisItem[] = [];
  const patterns = content().patterns || {};

  // 1. 核心事业格局匹配
  for (const [name, rule] of Object.entries(patterns) as any) {
    if (rule.condition && matchCondition(rule.condition, ctx)) {
      items.push({
        level: '确定',
        layer1: rule.l1 || '',
        layer2: rule.l2 || '',
        layer3: rule.l3 || '',
      });
    }
  }

  // 2. 行业方向（用神五行 → 行业映射）
  const industries = content().industryDirections || {};
  const yongShenEl = ctx.yongShen;
  if (yongShenEl && industries[yongShenEl]) {
    items.push({
      level: '参考',
      layer1: `用神为${yongShenEl}，宜从事${yongShenEl}属性行业`,
      layer2: `${industries[yongShenEl]}等行业与你的用神五行相符，更容易发挥优势`,
      layer3: `优先考虑${yongShenEl}属性的行业方向，事半功倍`,
    });
  }

  // 3. 当前大运的事业策略
  const dy = ctx.dayunContext.current;
  if (dy) {
    const isYongShenYun = ctx.xiShen.some(x =>
      x === dy.ganShishen || dy.ganShishen.includes('印') || dy.ganShishen.includes('比')
    );
    const isJiShenYun = ctx.jiShen.some(j =>
      j === dy.ganShishen || dy.ganShishen.includes('官') || dy.ganShishen.includes('杀')
    );

    if (isYongShenYun) {
      const adv = content().dayunAdvice?.['用神运'];
      if (adv) items.push({ level: '确定', layer1: adv.l1.replace('{yongShen}', ctx.yongShen), layer2: adv.l2, layer3: adv.l3 });
    } else if (isJiShenYun) {
      const adv = content().dayunAdvice?.['忌神运'];
      if (adv) items.push({ level: '确定', layer1: adv.l1.replace('{jiElement}', dy.ganShishen), layer2: adv.l2, layer3: adv.l3 });
    } else {
      const adv = content().dayunAdvice?.['平运'];
      if (adv) items.push({ level: '参考', layer1: adv.l1, layer2: adv.l2, layer3: adv.l3 });
    }
  }

  return items;
}

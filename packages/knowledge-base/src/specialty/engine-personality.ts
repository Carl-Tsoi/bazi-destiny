/**
 * 专项引擎: 性格 (1/11)
 *
 * 规则从 specialty/content/personality.json 加载，
 * 修改描述只需改 JSON，无需动代码。
 */

import type { SharedContext } from './shared/context.js';
import type { AnalysisItem } from './types.js';
import type { SpecContext } from './types.js';

// ── 加载配置文件 ──────────────────────────────────
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadContent(): any {
  const path = join(__dirname, 'content', 'personality.json');
  return JSON.parse(readFileSync(path, 'utf-8'));
}

// 旧版兼容（待所有引擎迁移后移除）
export function personalityEngine(ctx: SpecContext): string[] {
  const p: string[] = [];
  p.push(`日主${ctx.dayGan}（${ctx.dayEl}）：身${ctx.dayStrength}，格局${ctx.pattern}。`);
  if (ctx.isStrong) p.push('身强自主果断。');
  else if (ctx.isWeak) p.push('身弱谨慎谦虚，善借力。');
  if (ctx.foodHurtStars.length>=2) p.push('食伤旺，才华外露。');
  if (ctx.yins.length>=2) p.push('印星重重，喜思考有内涵。');
  if (ctx.killers.length>0) p.push('七杀在命，刚烈果断。');
  if (ctx.biJie.length>=3) p.push('比劫林立，重义气喜交友。');
  return p;
}

// ── 新版引擎 ──────────────────────────────────────

/** 从 JSON 取模板，替换占位符 {dayEl} {dayGan} 等 */
function tpl(key: string, vars?: Record<string, string>): string {
  const content = loadContent();
  const keys = key.split('.');
  let val: any = content;
  for (const k of keys) val = val?.[k];
  if (typeof val !== 'string') return '';
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      val = val.replace(`{${k}}`, v);
    }
  }
  return val;
}

export function analyzePersonality(ctx: SharedContext): AnalysisItem[] {
  const items: AnalysisItem[] = [];
  const dg = ctx.dayGan;

  // 1. 日干体性
  const traitL1 = tpl(`dayGanTraits.${dg}.l1`);
  if (traitL1) {
    items.push({
      level: '确定',
      layer1: traitL1,
      layer2: tpl(`dayGanTraits.${dg}.l2`),
      layer3: tpl(`dayGanTraits.${dg}.l3`),
    });
  }

  // 2. 身强/身弱
  const swKey = ctx.dayStrength === '身强' ? '强' : '弱';
  items.push({
    level: '确定',
    layer1: tpl(`strongWeak.${swKey}.l1`, { dayEl: ctx.dayEl }),
    layer2: tpl(`strongWeak.${swKey}.l2`),
    layer3: tpl(`strongWeak.${swKey}.l3`),
  });

  // 3. 食伤 → 才华表达
  const osKey = ctx.outputStars.strength === '强' ? '强' : ctx.outputStars.strength === '无' ? '无' : '';
  if (osKey) {
    items.push({
      level: osKey === '强' ? '确定' : '参考',
      layer1: tpl(`outputStars.${osKey}.l1`),
      layer2: tpl(`outputStars.${osKey}.l2`),
      layer3: tpl(`outputStars.${osKey}.l3`),
    });
  }

  // 4. 官杀
  if (ctx.officials.strength === '强') {
    items.push({
      level: '确定',
      layer1: tpl('officials.强.l1'),
      layer2: tpl('officials.强.l2'),
      layer3: tpl('officials.强.l3'),
    });
  }

  // 5. 印星
  if (ctx.seals.strength === '强') {
    items.push({
      level: '确定',
      layer1: tpl('seals.强.l1'),
      layer2: tpl('seals.强.l2'),
      layer3: tpl('seals.强.l3'),
    });
  }

  // 6. 五行缺失
  for (const el of ctx.elementBalance.missing) {
    const l1 = tpl(`missingElements.${el}.l1`);
    if (l1) {
      items.push({
        level: '参考',
        layer1: l1,
        layer2: tpl(`missingElements.${el}.l2`),
        layer3: tpl(`missingElements.${el}.l3`),
      });
    }
  }

  return items;
}

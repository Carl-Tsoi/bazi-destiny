/**
 * 统一模板查找 — 所有L5a引擎共享的模板解析逻辑
 *
 * 替代各引擎中 ad-hoc 的 key 构造:
 *   - pick() → lookupStarTemplate()
 *   - 直接 Y()[key] / J()[key] → lookupStarTemplate()
 *   - 手写 fallback → 统一的优先级链
 */

import { loadContent, loadBase } from './content-loader.js';
import type { StarEvaluation, PalaceEvaluation } from './evaluator.js';
import type { AnalysisItem } from '../types.js';

// ── 模板查找 ─────────────────────────────────────

/**
 * 按优先级链在 yong.json / ji.json 中查找模板
 * 链: key_strength → key → (base fallback)
 */
export function lookupStarTemplate(
  dim: string,
  starKey: string,
  evaluation: StarEvaluation,
  cdir: string,
): AnalysisItem | null {
  if (!evaluation.present) return null;

  const yong = loadContent(cdir, dim, 'yong');
  const ji = loadContent(cdir, dim, 'ji');
  const base = loadBase(cdir, dim);
  const favour = evaluation.favorable ? yong : ji;
  const opposite = evaluation.favorable ? ji : yong;

  // 优先级链: specific → general
  const chain = buildKeyChain(starKey, evaluation.strength);

  for (const key of chain) {
    // 优先在 favourable 侧查找
    if (favour[key]) {
      return buildItem(favour[key], '确定');
    }
    // fallback: opposite 侧（次优，降低为"参考"）
    if (opposite[key]) {
      return buildItem(opposite[key], '参考');
    }
  }

  // base fallback
  if (base[starKey]) {
    return buildItem(base[starKey], '参考');
  }

  return null;
}

/**
 * 查找组合模板（如官印相生、食伤生财）
 * 组合模板的喜忌由涉及的第一个星决定
 */
export function lookupComboTemplate(
  dim: string,
  comboKey: string,
  favorable: boolean,
  cdir: string,
): AnalysisItem | null {
  const yong = loadContent(cdir, dim, 'yong');
  const ji = loadContent(cdir, dim, 'ji');
  const base = loadBase(cdir, dim);

  const primary = favorable ? yong : ji;
  const secondary = favorable ? ji : yong;

  // 尝试 primary favour
  if (primary[comboKey]) {
    return buildItem(primary[comboKey], '确定');
  }
  // 尝试 secondary favour
  if (secondary[comboKey]) {
    return buildItem(secondary[comboKey], '参考');
  }
  // base fallback
  if (base[comboKey]) {
    return buildItem(base[comboKey], '参考');
  }
  return null;
}

/**
 * 查找宫位模板
 */
export function lookupPalaceTemplate(
  dim: string,
  palaceKey: string,
  palace: PalaceEvaluation,
  cdir: string,
): AnalysisItem | null {
  const yong = loadContent(cdir, dim, 'yong');
  const ji = loadContent(cdir, dim, 'ji');
  const base = loadBase(cdir, dim);

  // 优先用神侧
  if (palace.isYongShen) {
    // 尝试嵌套 key: spousePalace.用神
    const nested = yong[palaceKey];
    if (nested && typeof nested === 'object' && nested['用神']) {
      return buildItem(nested['用神'], '确定');
    }
    // 尝试平铺 key
    const flatKey = `${palaceKey}_yong`;
    if (yong[flatKey]) {
      return buildItem(yong[flatKey], '确定');
    }
    if (base[`${palaceKey}_yong`]) {
      return buildItem(base[`${palaceKey}_yong`], '参考');
    }
  }

  // 忌神侧
  if (palace.isJiShen) {
    const nested = ji[palaceKey];
    if (nested && typeof nested === 'object' && nested['忌神']) {
      return buildItem(nested['忌神'], '确定');
    }
    const flatKey = `${palaceKey}_ji`;
    if (ji[flatKey]) {
      return buildItem(ji[flatKey], '确定');
    }
  }

  // 通用宫位模板
  if (yong[palaceKey] && typeof yong[palaceKey] === 'object' && yong[palaceKey].l1) {
    return buildItem(yong[palaceKey], '参考');
  }
  if (base[palaceKey]) {
    return buildItem(base[palaceKey], '参考');
  }

  return null;
}

/**
 * 查找 base.json 中的模板（日主特性、五行缺失等）
 */
export function lookupBaseTemplate(
  dim: string,
  key: string,
  cdir: string,
  level: '确定' | '参考' = '参考',
): AnalysisItem | null {
  const base = loadBase(cdir, dim);
  if (base[key]) {
    return buildItem(base[key], level);
  }
  return null;
}

/**
 * 查找 base.json 中的模板并替换占位符
 */
export function lookupBaseTemplateWithReplace(
  dim: string,
  key: string,
  replacements: Record<string, string>,
  cdir: string,
  level: '确定' | '参考' = '参考',
): AnalysisItem | null {
  const base = loadBase(cdir, dim);
  const template = base[key];
  if (!template) return null;

  let l1 = template.l1 ?? '';
  let l2 = template.l2 ?? '';
  let l3 = template.l3 ?? '';
  for (const [k, v] of Object.entries(replacements)) {
    l1 = l1.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    l2 = l2.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    l3 = l3.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
  }
  return { level, layer1: l1, layer2: l2, layer3: l3 };
}

/**
 * 查找嵌套 base.json 模板（如 dayGanTraits.壬）
 * key 格式: "parent.child"
 */
export function lookupBaseNested(
  dim: string,
  parentKey: string,
  childKey: string,
  cdir: string,
  level: '确定' | '参考' = '确定',
): AnalysisItem | null {
  const base = loadBase(cdir, dim);
  const parent = base[parentKey];
  if (!parent || typeof parent !== 'object') return null;
  const template = parent[childKey];
  if (!template) return null;
  return buildItem(template, level);
}

// ── 辅助函数 ─────────────────────────────────────

function buildItem(template: { l1: string; l2: string; l3: string }, level: '确定' | '参考'): AnalysisItem {
  return {
    level,
    layer1: template.l1,
    layer2: template.l2,
    layer3: template.l3,
  };
}

/** 构建模板 key 的优先级链 */
function buildKeyChain(baseKey: string, strength: string): string[] {
  const chain: string[] = [];
  // strength-specific key first
  if (strength !== 'absent') {
    chain.push(`${baseKey}_${strength}`);
  }
  // general key always in chain
  chain.push(baseKey);
  return chain;
}

/**
 * 查找 yong/ji.json 中的模板并替换占位符
 */
export function lookupContentTemplateWithReplace(
  dim: string,
  key: string,
  replacements: Record<string, string>,
  cdir: string,
  favour: 'yong' | 'ji' = 'ji',
  level: '确定' | '参考' = '确定',
): AnalysisItem | null {
  const content = loadContent(cdir, dim, favour);
  const template = content[key];
  if (!template) return null;

  let l1 = template.l1 ?? '';
  let l2 = template.l2 ?? '';
  let l3 = template.l3 ?? '';
  for (const [k, v] of Object.entries(replacements)) {
    l1 = l1.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    l2 = l2.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    l3 = l3.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
  }
  return { level, layer1: l1, layer2: l2, layer3: l3 };
}

/**
 * 简单模板查找（不上报错误），用于兜底
 */
export function lookupGeneralTemplate(
  dim: string,
  key: string,
  cdir: string,
): AnalysisItem | null {
  const base = loadBase(cdir, dim);
  if (base[key]) {
    return buildItem(base[key], '参考');
  }
  return null;
}

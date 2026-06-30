/**
 * 内容加载器 — 所有专项引擎共享
 * 从 collector 产出读取 (bazi-knowledge-collector/output/content/)
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { SharedContext } from './context.js';

// collector 产出路径 (Lucky 同级项目)
const COLLECTOR_OUTPUT = join(
  import.meta.dirname, '..', '..', '..', '..', '..', '..',
  'bazi-knowledge-collector', 'output', 'content',
);

const _cache: Record<string, any> = {};

function loadJson(filePath: string): any {
  if (!_cache[filePath]) {
    if (!existsSync(filePath)) return {};
    _cache[filePath] = JSON.parse(readFileSync(filePath, 'utf-8'));
  }
  return _cache[filePath];
}

export function loadContent(
  _localDir: string, dim: string, favour: 'yong' | 'ji',
): any {
  return loadJson(join(COLLECTOR_OUTPUT, dim, `${favour}.json`));
}

export function loadBase(_localDir: string, dim: string): any {
  return loadJson(join(COLLECTOR_OUTPUT, dim, 'base.json'));
}

// ── 统一的喜忌判断 ──────────────────────────────────
const ORDER = ['木','火','土','金','水'];

export function isStarJi(ctx: SharedContext, offset: number): boolean {
  const di = ORDER.indexOf(ctx.dayEl);
  return ctx.jiShen.includes(ORDER[(di + offset) % 5]);
}

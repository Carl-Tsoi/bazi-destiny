/**
 * 内容加载器 — 所有专项引擎共享
 * 优先读 collector 产出, 没有则 fallback 到本地 content/
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { SharedContext } from './context.js';

// ── collector 产出路径 ────────────────────────────
// bazi-destiny 和 bazi-knowledge-collector 是 Lucky 下的同级项目
const COLLECTOR_OUTPUT = join(
  import.meta.dirname, '..', '..', '..', '..', '..', '..',
  'bazi-knowledge-collector', 'output', 'content',
);

// 模块级缓存
const _cache: Record<string, any> = {};

function loadJson(filePath: string): any {
  if (!_cache[filePath]) {
    _cache[filePath] = JSON.parse(readFileSync(filePath, 'utf-8'));
  }
  return _cache[filePath];
}

/** 优先 collector → 本地 fallback */
function resolvePath(localDir: string, dim: string, file: string): string {
  const collectorPath = join(COLLECTOR_OUTPUT, dim, file);
  if (existsSync(collectorPath)) return collectorPath;
  return join(localDir, dim, file);
}

export function loadContent(
  localDir: string, dim: string, favour: 'yong' | 'ji',
): any {
  return loadJson(resolvePath(localDir, dim, `${favour}.json`));
}

export function loadBase(localDir: string, dim: string): any {
  return loadJson(resolvePath(localDir, dim, 'base.json'));
}

// ── 统一的喜忌判断 ──────────────────────────────────
const ORDER = ['木','火','土','金','水'];

/** 判断某个十神的五行是否为忌神 */
export function isStarJi(ctx: SharedContext, offset: number): boolean {
  const di = ORDER.indexOf(ctx.dayEl);
  return ctx.jiShen.includes(ORDER[(di + offset) % 5]);
}

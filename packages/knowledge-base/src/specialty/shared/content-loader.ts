/**
 * 内容加载器 — 所有专项引擎共享
 * 从 content/<dimension>/{yong,ji,base}.json 加载
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import type { SharedContext } from './context.js';

// 模块级缓存
const _cache: Record<string, any> = {};

function loadJson(filePath: string): any {
  if (!_cache[filePath]) {
    _cache[filePath] = JSON.parse(readFileSync(filePath, 'utf-8'));
  }
  return _cache[filePath];
}

export function loadContent(
  contentDir: string,
  dim: string,
  favour: 'yong' | 'ji',
): any {
  return loadJson(join(contentDir, dim, `${favour}.json`));
}

export function loadBase(contentDir: string, dim: string): any {
  return loadJson(join(contentDir, dim, 'base.json'));
}

// ── 统一的喜忌判断 ──────────────────────────────────
// 五行顺序: 木(0) 火(1) 土(2) 金(3) 水(4)
// offset: 0=比劫(同我) 1=食伤(我生) 2=财星(我克) 3=官杀(克我) 4=印星(生我)
const ORDER = ['木','火','土','金','水'];

/** 判断某个十神的五行是否为忌神 */
export function isStarJi(ctx: SharedContext, offset: number): boolean {
  const di = ORDER.indexOf(ctx.dayEl);
  return ctx.jiShen.includes(ORDER[(di + offset) % 5]);
}

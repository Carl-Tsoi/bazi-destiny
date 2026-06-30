/**
 * 内容加载器 — 所有专项引擎共享
 * 从 content/<dimension>/{yong,ji,base}.json 加载
 */
import { readFileSync } from 'fs';
import { join } from 'path';

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

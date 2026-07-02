/**
 * 内容加载器 — 所有专项引擎共享
 * 从本地 specialty/content/ 读取（由 bazi-knowledge-collector 产出到此目录）
 *
 * v3: 改用 localDir 参数，读 destiny 自己的 content 目录
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const _cache: Record<string, any> = {};

function loadJson(filePath: string): any {
  if (!_cache[filePath]) {
    if (!existsSync(filePath)) return {};
    _cache[filePath] = JSON.parse(readFileSync(filePath, 'utf-8'));
  }
  return _cache[filePath];
}

/**
 * 加载维度内容（yong.json 或 ji.json）
 */
export function loadContent(
  localDir: string,
  dim: string,
  favour: 'yong' | 'ji',
): any {
  return loadJson(join(localDir, dim, `${favour}.json`));
}

/**
 * 加载维度基础内容（base.json）
 */
export function loadBase(localDir: string, dim: string): any {
  return loadJson(join(localDir, dim, 'base.json'));
}

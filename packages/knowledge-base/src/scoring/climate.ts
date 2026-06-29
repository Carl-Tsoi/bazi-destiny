/**
 * 气候系数系统 — 支持多版本切换
 *
 * 用法:
 *   import { getClimate, loadVersion } from './climate.js';
 *   const wt = getClimate('寅', '木');  // 0.85
 *   loadVersion(2);                      // 切换到 v2
 *
 * 数据文件: climate-coeff-v1.json, climate-coeff-v2.json, ...
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export type ClimateData = Record<string, Record<string, number>>;

let _active: ClimateData | null = null;
let _activeVersion = 0;

/** 加载指定版本的气候数据 */
export function loadVersion(version: number): ClimateData {
  if (version === _activeVersion && _active) return _active;
  const path = join(__dirname, '..', `climate-coeff-v${version}.json`);
  const json = JSON.parse(readFileSync(path, 'utf-8'));
  _active = (json.data ?? json) as ClimateData;
  _activeVersion = version;
  return _active;
}

/** 获取当前激活版本号 */
export function activeVersion(): number {
  return _activeVersion;
}

/** 获取五行在月令的气候系数 */
export function getClimate(monthZhi: string, element: string): number {
  if (!_active) loadVersion(1);
  return _active?.[monthZhi]?.[element] ?? 1.0;
}

/** 直接设置气候数据（用于测试，绕过文件读取） */
export function setClimateData(data: ClimateData, version: number): void {
  _active = data;
  _activeVersion = version;
}

#!/usr/bin/env npx tsx
/**
 * sync-collector — 自动同步引擎需求 → collector，检查产出 → 输出缺口
 *
 * 运行: npx tsx packages/knowledge-base/src/specialty/shared/sync-collector.ts
 *
 * 产出文件: bazi-knowledge-collector/GAPS.md (collector 会话直接读)
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── 路径 ──────────────────────────────────────────

const ENGINE_DIR = join(__dirname, '..');         // specialty/
const COLLECTOR_OUTPUT = join(__dirname, '..', '..', '..', '..', '..', '..', 'bazi-knowledge-collector', 'output', 'content');
const COLLECTOR_ROOT = join(__dirname, '..', '..', '..', '..', '..', '..', 'bazi-knowledge-collector');
const LOCAL_CONTENT = join(__dirname, '..', 'content');
const GAPS_FILE = join(COLLECTOR_ROOT, 'GAPS.md');

// ── 扫描引擎 key 需求 ─────────────────────────────

interface KeyReq {
  dimension: string;
  key: string;
  file: 'yong' | 'ji' | 'base';
  engine: string;
  isDynamic: boolean;  // 动态 key (如财星_strong/weak)
}

function scanEngines(): KeyReq[] {
  const reqs: KeyReq[] = [];
  const files = readdirSync(ENGINE_DIR).filter(f => f.startsWith('engine-') && f.endsWith('.ts'));

  for (const f of files) {
    const dim = f.replace('engine-', '').replace('.ts', '');
    const code = readFileSync(join(ENGINE_DIR, f), 'utf-8');

    // 静态 key: Y()['xxx'], J()['xxx'], B()['xxx']
    for (const m of code.matchAll(/([YJB])\(\)\['([^']+)'\]/g)) {
      const funcChar = m[1];
      const key = m[2];
      const file: 'yong' | 'ji' | 'base' = funcChar === 'Y' ? 'yong' : funcChar === 'J' ? 'ji' : 'base';
      reqs.push({ dimension: dim, key, file, engine: f, isDynamic: false });
    }

    // 动态 key 模式
    const dynamicPatterns: { pattern: RegExp; dim: string; entries: { key: string; file: 'yong' | 'ji' | 'base' }[] }[] = [
      { pattern: /key\s*=\s*'财星_'/, dim, entries: [
        { key: '财星_strong', file: 'yong' }, { key: '财星_weak', file: 'yong' },
        { key: '财星_strong', file: 'ji' }, { key: '财星_weak', file: 'ji' },
      ]},
      { pattern: /key\s*=\s*'印星_'/, dim, entries: [
        { key: '印星_strong', file: 'yong' }, { key: '印星_weak', file: 'yong' },
        { key: '印星_strong', file: 'ji' }, { key: '印星_weak', file: 'ji' },
      ]},
      { pattern: /\(ji\?'ji':'yong'\)\+'_'/, dim, entries: [
        { key: 'yong_strong', file: 'yong' }, { key: 'yong_weak', file: 'yong' },
        { key: 'ji_strong', file: 'ji' }, { key: 'ji_weak', file: 'ji' },
      ]},
      { pattern: /key\s*=\s*'peers_'/, dim, entries: [
        { key: 'peers_strong', file: 'yong' }, { key: 'peers_weak', file: 'yong' },
        { key: 'peers_strong', file: 'ji' }, { key: 'peers_weak', file: 'ji' },
      ]},
      { pattern: /key\s*=\s*'wealth_'/, dim, entries: [
        { key: 'wealth_strong', file: 'yong' }, { key: 'wealth_weak', file: 'yong' },
        { key: 'wealth_strong', file: 'ji' }, { key: 'wealth_weak', file: 'ji' },
      ]},
      { pattern: /'deficient_'\+el/, dim, entries: [
        { key: 'deficient_木', file: 'base' }, { key: 'deficient_火', file: 'base' },
        { key: 'deficient_土', file: 'base' }, { key: 'deficient_金', file: 'base' }, { key: 'deficient_水', file: 'base' },
      ]},
      { pattern: /'excess_'\+el/, dim, entries: [
        { key: 'excess_木', file: 'ji' }, { key: 'excess_火', file: 'ji' },
        { key: 'excess_土', file: 'ji' }, { key: 'excess_金', file: 'ji' }, { key: 'excess_水', file: 'ji' },
      ]},
    ];

    for (const dp of dynamicPatterns) {
      if (dp.pattern.test(code)) {
        for (const e of dp.entries) {
          reqs.push({ dimension: dp.dim, key: e.key, file: e.file, engine: f, isDynamic: true });
        }
      }
    }
  }

  return reqs;
}

// ── 扫描 collector 产出 ────────────────────────────

function scanCollector(): Map<string, Set<string>> {
  const existing = new Map<string, Set<string>>(); // "dim:file" → Set<keys>
  if (!existsSync(COLLECTOR_OUTPUT)) return existing;

  for (const dim of readdirSync(COLLECTOR_OUTPUT)) {
    const dimDir = join(COLLECTOR_OUTPUT, dim);
    if (!existsSync(dimDir)) continue;
    for (const file of ['yong.json', 'ji.json', 'base.json']) {
      const fp = join(dimDir, file);
      if (!existsSync(fp)) continue;
      try {
        const data = JSON.parse(readFileSync(fp, 'utf-8'));
        const tag = `${dim}:${file.replace('.json', '')}`;
        existing.set(tag, new Set(Object.keys(data)));
      } catch { /* skip invalid JSON */ }
    }
  }

  return existing;
}

// ── 生成缺口报告 ──────────────────────────────────

function generateGapReport(reqs: KeyReq[], existing: Map<string, Set<string>>): string {
  const lines: string[] = [];
  lines.push('# Collector 缺口报告');
  lines.push('');
  lines.push(`> 自动生成于 ${new Date().toISOString().replace('T', ' ').substring(0, 19)}`);
  lines.push('> bazi-destiny 引擎扫描 → collector 产出对比');
  lines.push('');

  // 按维度分组
  const byDim = new Map<string, KeyReq[]>();
  for (const r of reqs) {
    if (!byDim.has(r.dimension)) byDim.set(r.dimension, []);
    byDim.get(r.dimension)!.push(r);
  }

  let totalGaps = 0;
  const dimGaps: string[] = [];

  for (const [dim, dimReqs] of [...byDim.entries()].sort()) {
    const gaps: { key: string; file: string; empty: boolean }[] = [];

    for (const r of dimReqs) {
      const tag = `${dim}:${r.file}`;
      const keys = existing.get(tag);
      if (!keys || !keys.has(r.key)) {
        gaps.push({ key: r.key, file: r.file, empty: false });
      } else {
        // 检查是否为空内容
        try {
          const fp = join(COLLECTOR_OUTPUT, dim, `${r.file}.json`);
          const data = JSON.parse(readFileSync(fp, 'utf-8'));
          const v = data[r.key];
          if (v && typeof v === 'object' && !v.l1 && !v.l2 && !v.l3) {
            gaps.push({ key: r.key, file: r.file, empty: true });
          }
        } catch { /* skip */ }
      }
    }

    if (gaps.length > 0) {
      totalGaps += gaps.length;
      lines.push(`## ${dim}`);
      lines.push('');
      lines.push('| File | Key | 状态 |');
      lines.push('|------|-----|------|');
      for (const g of gaps) {
        const status = g.empty ? '⚠️ 空内容' : '❌ 缺失';
        lines.push(`| \`${g.file}.json\` | \`${g.key}\` | ${status} |`);
      }
      lines.push('');
      dimGaps.push(dim);
    }
  }

  // 汇总
  lines.push('---');
  lines.push('');
  if (totalGaps === 0) {
    lines.push('## ✅ 全部覆盖，无缺口');
  } else {
    lines.push(`## ⚠️ ${totalGaps} 个缺口，涉及 ${dimGaps.length} 个维度`);
    lines.push('');
    lines.push('### 待补充维度');
    for (const d of dimGaps) lines.push(`- ${d}`);
  }

  // 按优先级分类
  lines.push('');
  lines.push('### 优先级');
  lines.push('');
  const p0Dims = new Set(['career', 'marriage', 'benefactors', 'property', 'siblings']);
  const p0 = dimGaps.filter(d => p0Dims.has(d));
  const p1 = dimGaps.filter(d => !p0Dims.has(d));
  if (p0.length > 0) lines.push(`**P0**: ${p0.join(', ')}`);
  if (p1.length > 0) lines.push(`**P1**: ${p1.join(', ')}`);

  return lines.join('\n');
}

// ── 主流程 ────────────────────────────────────────

console.log('🔍 扫描 bazi-destiny 引擎 key 需求...');
const reqs = scanEngines();
console.log(`  找到 ${reqs.length} 个 key 需求`);

console.log('📦 扫描 collector 产出...');
const existing = scanCollector();
let totalKeys = 0;
for (const [, keys] of existing) totalKeys += keys.size;
console.log(`  找到 ${totalKeys} 个已产出 key`);

console.log('📝 生成缺口报告...');
const report = generateGapReport(reqs, existing);
writeFileSync(GAPS_FILE, report, 'utf-8');
console.log(`  → ${GAPS_FILE}`);

// 统计
const gaps = (report.match(/❌|⚠️/g) || []).length;
if (gaps === 0) {
  console.log('✅ 全部覆盖，无缺口');
} else {
  console.log(`⚠️ ${gaps} 个缺口，详见 GAPS.md`);
}

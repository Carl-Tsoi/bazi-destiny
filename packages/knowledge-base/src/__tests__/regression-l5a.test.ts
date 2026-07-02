/**
 * L5a 回归测试 — 验证所有 case 通过新架构产出合规的 11 维分析
 * 运行: npx tsx packages/knowledge-base/src/__tests__/regression-l5a.test.ts
 */
import { BaziEngine } from '@bazi-destiny/engine-bazi';
import { scoreChart } from '../scoring/score-engine.js';
import { analyzeChart } from '../analysis/analyzer.js';
import { buildContext } from '../specialty/shared/context.js';
import { analyzeAllDimensions } from '../specialty/index.js';
import type { ChartResult } from '../analysis/types.js';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

interface CaseEntry {
  name: string;
  gender: 'M' | 'F';
  birth: string;
}

async function main() {
  const dataDir = join(import.meta.dirname, '..', '..', '..', '..', 'data');
  const casesPath = join(dataDir, 'cases.json');
  const cases: CaseEntry[] = JSON.parse(readFileSync(casesPath, 'utf-8'));

  const engine = new BaziEngine();
  let pass = 0, fail = 0;
  const errors: string[] = [];
  const dimStats: Record<string, number[]> = {}; // dim -> item counts per case

  for (const c of cases) {
    const name = c.name;
    try {
      const result = await engine.calculate({
        datetime: c.birth.replace(' ', 'T'),
        latitude: 0, longitude: 0,
        timezone: 'Asia/Shanghai', gender: c.gender,
      });

      if (!result.success) {
        fail++; errors.push(`${name}: engine error - ${result.error}`); continue;
      }

      const bazi = result.data;
      const birthYear = new Date(c.birth).getFullYear();
      const age = new Date().getFullYear() - birthYear;

      const chart: ChartResult = {
        pillars: bazi.pillars as ChartResult['pillars'],
        dayun: bazi.dayun as ChartResult['dayun'],
        pattern: (bazi.pattern as string) || '',
        shensha: (bazi.shensha || {}) as ChartResult['shensha'],
        dayGan: (bazi.pillars as Record<string, {gan: string}>).日柱?.gan ?? '',
        dayZhi: (bazi.pillars as Record<string, {zhi: string}>).日柱?.zhi ?? '',
        monthZhi: (bazi.pillars as Record<string, {zhi: string}>).月柱?.zhi ?? '',
      };

      const score = scoreChart(chart);
      const analysis = await analyzeChart(chart, score, { age, gender: c.gender });
      const ctx = buildContext(chart, score, analysis, { age, gender: c.gender });
      const specialty = analyzeAllDimensions(chart, score, analysis, { age, gender: c.gender });

      // 验证
      let casePass = true;

      // 1. 11个维度
      if (specialty.dimensions.length !== 11) {
        casePass = false;
        errors.push(`${name}: expected 11 dims, got ${specialty.dimensions.length}`);
      }

      // 2. 每个维度检查
      for (const dim of specialty.dimensions) {
        if (!dimStats[dim.dimension]) dimStats[dim.dimension] = [];
        dimStats[dim.dimension].push(dim.items.length);

        for (const item of dim.items) {
          if (!item.layer1 || !item.layer2 || !item.layer3) {
            casePass = false;
            errors.push(`${name}/${dim.dimension}: item missing L1/L2/L3`);
          }
          if (!['确定', '参考'].includes(item.level)) {
            casePass = false;
            errors.push(`${name}/${dim.dimension}: invalid level "${item.level}"`);
          }
        }
      }

      // 3. Rating 有效
      if (!['A', 'B', 'C', 'D'].includes(specialty.rating.grade)) {
        casePass = false;
        errors.push(`${name}: invalid grade "${specialty.rating.grade}"`);
      }

      // 4. Context 验证
      const stars = [ctx.officials, ctx.seals, ctx.wealthStars, ctx.outputStars, ctx.peers];
      for (const s of stars) {
        if (s.present && s.strength === 'absent') {
          casePass = false;
          errors.push(`${name}: star present but strength=absent`);
        }
        if (s.favorable === undefined) {
          casePass = false;
          errors.push(`${name}: star missing favorable`);
        }
      }

      if (casePass) pass++;
      else fail++;

      console.log(`${casePass ? '✅' : '⚠️'} ${name}: ${score.dayStrength} ${analysis.yongShen} grade=${specialty.rating.grade} dims=${specialty.dimensions.map(d => d.items.length).join(',')}`);

    } catch (e: any) {
      fail++;
      errors.push(`${name}: EXCEPTION - ${e.message}`);
      console.log(`💥 ${name}: ${e.message}`);
    }
  }

  // 汇总
  console.log(`\n${'='.repeat(60)}`);
  console.log(`结果: ${pass}✅ / ${fail}❌ (${cases.length} cases)`);

  // 维度统计
  console.log(`\n维度覆盖 (items/case avg):`);
  for (const [dim, counts] of Object.entries(dimStats)) {
    const avg = (counts.reduce((a, b) => a + b, 0) / counts.length).toFixed(1);
    const empty = counts.filter(c => c === 0).length;
    console.log(`  ${dim}: avg ${avg} items, ${empty} cases empty`);
  }

  if (errors.length > 0) {
    console.log(`\n错误详情:`);
    for (const e of errors.slice(0, 20)) console.log(`  ${e}`);
    if (errors.length > 20) console.log(`  ... and ${errors.length - 20} more`);
  }

  // 保存一个样例输出
  const sampleDir = join(import.meta.dirname, '..', '..', '..', '..', 'output', 'REGRESSION');
  if (!existsSync(sampleDir)) mkdirSync(sampleDir, { recursive: true });
  const summary = {
    total: cases.length, pass, fail,
    errors: errors.slice(0, 50),
    dimStats: Object.fromEntries(Object.entries(dimStats).map(([k, v]) => [
      k, { avg: (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1), emptyCases: v.filter(c => c === 0).length }
    ])),
  };
  writeFileSync(join(sampleDir, 'regression-l5a-summary.json'), JSON.stringify(summary, null, 2));
  console.log(`\n汇总已保存到 output/REGRESSION/regression-l5a-summary.json`);
}

main().catch(console.error);

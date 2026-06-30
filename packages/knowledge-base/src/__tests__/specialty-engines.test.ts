/**
 * 专项引擎单元测试 — 验证所有11个引擎可正常输出
 *
 * 测试数据: 张耿 (1985-12-09 10:30, M) — 壬水日主，身弱
 */

import { BaziEngine } from '@bazi-destiny/engine-bazi';
import { scoreChart } from '../scoring/score-engine.js';
import { analyzeChart } from '../analysis/analyzer.js';
import { buildContext } from '../specialty/shared/context.js';
import { analyzeAllDimensions } from '../specialty/index.js';
import type { ChartResult } from '../analysis/types.js';

async function setupTestChart() {
  const engine = new BaziEngine();
  const r = await engine.calculate({
    datetime: '1985-12-09T10:30', latitude: 0, longitude: 0,
    timezone: 'Asia/Shanghai', gender: 'M',
  });
  const b = (r as any).data;
  const chart: ChartResult = {
    pillars: b.pillars as ChartResult['pillars'],
    dayun: b.dayun as ChartResult['dayun'],
    pattern: b.pattern || '',
    shensha: (b as any).shensha || {},
    dayGan: (b.pillars as any).日柱.gan,
    dayZhi: (b.pillars as any).日柱.zhi,
    monthZhi: (b.pillars as any).月柱.zhi,
  };
  return chart;
}

async function runTests() {
  const chart = await setupTestChart();
  const score = scoreChart(chart);
  const analysis = await analyzeChart(chart, score, { age: 41, gender: 'M' });
  const ctx = buildContext(chart, score, analysis, { age: 41, gender: 'M' });

  // Test 1: SharedContext has all required fields
  console.log('Test 1: SharedContext fields');
  const required = ['dayGan','dayEl','dayStrength','yongShen','jiShen',
    'officials','seals','wealthStars','outputStars','peers',
    'spousePalace','parentsPalace','childrenPalace','siblingsPalace',
    'elementBalance','dayunContext','pattern','gender','age'];
  let pass = 0, fail = 0;
  for (const key of required) {
    if ((ctx as any)[key] !== undefined) pass++;
    else { console.log(`  ❌ missing: ${key}`); fail++; }
  }
  console.log(`  ${pass} present, ${fail} missing`);

  // Test 2: analyzeAllDimensions returns 11 dimensions
  console.log('Test 2: analyzeAllDimensions');
  const result = analyzeAllDimensions(chart, score, analysis, { age: 41, gender: 'M' });
  if (result.dimensions.length === 11) {
    console.log(`  ✅ 11 dimensions returned`);
  } else {
    console.log(`  ❌ expected 11, got ${result.dimensions.length}`);
    fail++;
  }

  // Test 3: Each dimension has items with valid structure
  console.log('Test 3: Item structure validation');
  let dimsWithItems = 0;
  for (const dim of result.dimensions) {
    const hasItems = dim.items.length > 0;
    if (hasItems) dimsWithItems++;
    // Check each item has L1/L2/L3
    for (const item of dim.items) {
      if (!item.layer1 || !item.layer2 || !item.layer3) {
        console.log(`  ❌ ${dim.dimension}: item missing L1/L2/L3`);
        fail++;
      }
      if (!['确定','参考'].includes(item.level)) {
        console.log(`  ❌ ${dim.dimension}: invalid level "${item.level}"`);
        fail++;
      }
    }
  }
  console.log(`  ${dimsWithItems}/11 dimensions have items (剩余无匹配规则)`);

  // Test 4: Rating is valid
  console.log('Test 4: Rating');
  const validGrades = ['A','B','C','D'];
  if (validGrades.includes(result.rating.grade) && result.rating.summary.length > 10) {
    console.log(`  ✅ Grade: ${result.rating.grade} — ${result.rating.summary.substring(0,40)}...`);
  } else {
    console.log(`  ❌ Invalid rating: ${JSON.stringify(result.rating)}`);
    fail++;
  }

  // Test 5: 张耿 specific checks
  console.log('Test 5: 张耿 specific');
  if (ctx.dayGan === '壬') pass++; else { console.log('  ❌ dayGan should be 壬'); fail++; }
  if (ctx.dayStrength === '身弱') pass++; else { console.log('  ❌ should be 身弱'); fail++; }
  if (ctx.yongShen.includes('水')) pass++; else { console.log('  ❌ yongShen should include 水'); fail++; }
  console.log(`  dayGan=壬 dayStrength=身弱 yongShen=${ctx.yongShen.join(',')}`);

  console.log(`\n${fail > 0 ? '❌ FAILED' : '✅ PASSED'} — ${fail} failures`);
}

runTests().catch(console.error);

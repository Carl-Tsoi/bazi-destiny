/**
 * L3 计分层回归测试 — 验证 24 例强弱判定
 * 运行: npx tsx packages/knowledge-base/src/__tests__/regression-l3.test.ts
 */
import { BaziEngine } from '@bazi-destiny/engine-bazi';
import { scoreChart } from '../scoring/score-engine.js';
import type { ChartResult } from '../analysis/types.js';
import { readFileSync } from 'fs';
import { join } from 'path';

interface CaseEntry {
  name: string;
  gender: 'M' | 'F';
  birth: string;
}

async function main() {
  const casesPath = join(import.meta.dirname, '..', '..', '..', '..', 'data', 'cases.json');
  const expectedPath = join(import.meta.dirname, '..', '..', '..', '..', 'data', 'expected.json');
  const cases: CaseEntry[] = JSON.parse(readFileSync(casesPath, 'utf-8'));
  const expected: Record<string, string> = JSON.parse(readFileSync(expectedPath, 'utf-8'));

  const engine = new BaziEngine();
  let pass = 0, fail = 0;
  const skipped: string[] = [];

  for (const c of cases) {
    const expectedDS = expected[c.name];
    if (!expectedDS || expectedDS === '从格') {
      skipped.push(`${c.name} (${expectedDS || '无预期'})`);
      continue;
    }

    try {
      const result = await engine.calculate({
        datetime: c.birth.replace(' ', 'T'),
        latitude: 0, longitude: 0,
        timezone: 'Asia/Shanghai', gender: c.gender,
      });

      if (!result.success) {
        fail++; console.log(`❌ ${c.name}: engine error - ${result.error}`); continue;
      }

      const bazi = result.data;
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

      if (score.dayStrength === expectedDS) {
        pass++;
        console.log(`✅ ${c.name}: ${score.dayStrength} (自党${score.ziDang} 异党${score.yiDang})`);
      } else {
        fail++;
        console.log(`❌ ${c.name}: got ${score.dayStrength} expected ${expectedDS} (自党${score.ziDang} 异党${score.yiDang})`);
      }
    } catch (e: any) {
      fail++;
      console.log(`❌ ${c.name}: exception - ${e.message}`);
    }
  }

  if (skipped.length > 0) console.log(`\n⏭️ 跳过: ${skipped.join(', ')}`);
  console.log(`\n结果: ${pass}✅ / ${fail}❌ (命中率 ${pass + fail > 0 ? (pass / (pass + fail) * 100).toFixed(0) : 0}%)`);
}

main().catch(console.error);

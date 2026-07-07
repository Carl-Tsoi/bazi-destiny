/**
 * L4 变格回归测试 — 验证从格(及专旺/食伤制杀)判定
 * 运行: npx tsx packages/knowledge-base/src/__tests__/regression-l4.test.ts
 *
 * 与 regression-l3 (强弱二分) 分层：本测试专管 L4 变格是否触发 + 类型 + 真假。
 * ground truth 见 data/expected-l4.json。
 */
import { BaziEngine } from '@bazi-destiny/engine-bazi';
import { scoreChart } from '../scoring/score-engine.js';
import { analyzeChart } from '../analysis/analyzer.js';
import type { ChartResult } from '../analysis/types.js';
import { readFileSync } from 'fs';
import { join } from 'path';

interface CaseEntry {
  name: string;
  gender: 'M' | 'F';
  birth: string;
}

// analyzeChart 返回的 engines 项运行时形如 { name, yongShen, diagnostics }（specialPattern 在映射中丢失）
type EngineEntry = { name: string; yongShen: string | null; diagnostics: string[] };

/** 从 engines 数组提取变格判定字符串，与 expected-l4.json 比对 */
function detectBianGe(engines: EngineEntry[]): string {
  // 从格：触发时 diagnostics[0] 形如 "从格:从财格(真从)" / "从格:从杀格（从官格）(假从)"
  const cong = engines.find(e => e.name === '从格');
  if (cong && cong.diagnostics[0]?.startsWith('从格:')) {
    const body = cong.diagnostics[0].slice('从格:'.length);
    const i1 = body.indexOf('(');
    const i2 = body.indexOf('（');
    const cut = [i1, i2].filter(i => i >= 0).sort((a, b) => a - b)[0] ?? body.length;
    const type = body.slice(0, cut); // 从财格 / 从杀格 / 从儿格 / 从势格
    const truth = cong.diagnostics.join(' ').includes('真从') ? '真从' : '假从';
    return type + truth;
  }
  // 专旺格 / 食神制杀：本批 ground truth 预期均不触发；若触发则原样上报，便于立即发现
  const other = engines.find(e => (e.name === '专旺格' || e.name === '食神制杀') && e.yongShen);
  if (other) return `${other.name}触发`;
  return '无';
}

async function main() {
  const root = join(import.meta.dirname, '..', '..', '..', '..');
  const cases: CaseEntry[] = JSON.parse(readFileSync(join(root, 'data', 'cases.json'), 'utf-8'));
  const expected: Record<string, string> = JSON.parse(readFileSync(join(root, 'data', 'expected-l4.json'), 'utf-8'));

  const engine = new BaziEngine();
  let pass = 0, fail = 0;
  const skipped: string[] = [];

  for (const c of cases) {
    const exp = expected[c.name];
    if (!exp) { skipped.push(c.name); continue; }

    try {
      const result = await engine.calculate({
        datetime: c.birth.replace(' ', 'T'),
        latitude: 0, longitude: 0,
        timezone: 'Asia/Shanghai', gender: c.gender,
      });
      if (!result.success) { fail++; console.log(`❌ ${c.name}: engine error - ${result.error}`); continue; }

      const bazi = result.data;
      const chart: ChartResult = {
        pillars: bazi.pillars as ChartResult['pillars'],
        dayun: bazi.dayun as ChartResult['dayun'],
        pattern: (bazi.pattern as string) || '',
        shensha: (bazi.shensha || {}) as ChartResult['shensha'],
        dayGan: (bazi.pillars as Record<string, { gan: string }>).日柱?.gan ?? '',
        dayZhi: (bazi.pillars as Record<string, { zhi: string }>).日柱?.zhi ?? '',
        monthZhi: (bazi.pillars as Record<string, { zhi: string }>).月柱?.zhi ?? '',
      };
      const score = scoreChart(chart);
      const analysis = await analyzeChart(chart, score);
      const got = detectBianGe(analysis.engines as unknown as EngineEntry[]);

      if (got === exp) {
        pass++;
        console.log(`✅ ${c.name}: ${got}${got === '无' ? '' : ''}`);
      } else {
        fail++;
        console.log(`❌ ${c.name}: got ${got} expected ${exp}`);
      }
    } catch (e: any) {
      fail++;
      console.log(`❌ ${c.name}: exception - ${e.message}`);
    }
  }

  if (skipped.length > 0) console.log(`\n⏭️ 跳过(无expected): ${skipped.join(', ')}`);
  console.log(`\n结果: ${pass}✅ / ${fail}❌ (命中率 ${pass + fail > 0 ? (pass / (pass + fail) * 100).toFixed(0) : 0}%)`);
}

main().catch(console.error);

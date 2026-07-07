/**
 * ASCII chart rendering for terminal output
 */
import type { BaziChart } from '@bazi-destiny/core';

/** Render Bazi Four Pillars as an ASCII table */
export function renderBazi(chart: BaziChart): string {
  const ps = chart.pillars;
  const lines: string[] = [];

  lines.push('╔════════════════════════════════════════════════╗');
  lines.push('║            八 字 排 盘  (Bazi Chart)            ║');
  lines.push('╠══════╤══════╤══════╤══════╤══════╤══════╤══════╣');
  lines.push('║      │ 天干 │ 地支 │ 纳音 │ 十神 │ 藏干         ║');
  lines.push('╟──────┼──────┼──────┼──────┼──────┼──────────────╢');

  for (const [key, p] of Object.entries(ps)) {
    const label = { year: '年柱', month: '月柱', day: '日柱', hour: '时柱' }[key] ?? key;
    const shishen = p.shishen.padEnd(4);
    const canggan = p.canggan.map((h: {stem: string; tenGod: string}) => `${h.stem}(${h.tenGod})`).join(' ');
    lines.push(`║ ${label} │ ${p.gan.padEnd(4)} │ ${p.zhi.padEnd(4)} │ ${p.nayin.padEnd(4)} │ ${shishen} │ ${canggan.padEnd(12)} ║`);
  }

  lines.push('╠══════╧══════╧══════╧══════╧══════╧══════════════╣');
  lines.push(`║  格局: ${chart.pattern.padEnd(42)} ║`);
  lines.push(`║  用神: ${chart.yongShen.padEnd(42)} ║`);
  lines.push(`║  起运: ${String(chart.dayun.startAgeYears).padEnd(42)} ║`);

  if (chart.dayun.steps.length > 0) {
    lines.push('╠══════════════════════════════════════════════════╣');
    lines.push('║            大 运  (Da Yun)                       ║');
    lines.push('╠══════╤══════╤══════╤══════╤══════════════════════╣');
    lines.push('║ 年龄 │ 天干 │ 地支 │ 十神(干) │ 十神(支)        ║');
    lines.push('╟──────┼──────┼──────┼──────────┼──────────────────╢');
    for (const step of chart.dayun.steps) {
      lines.push(`║ ${String(step.startAge).padEnd(4)} │ ${step.gan.padEnd(4)} │ ${step.zhi.padEnd(4)} │ ${step.ganShishen.padEnd(8)} │ ${step.zhiShishen.padEnd(16)} ║`);
    }
  }

  lines.push('╚══════════════════════════════════════════════════╝');
  return lines.join('\n');
}

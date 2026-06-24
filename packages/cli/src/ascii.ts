/**
 * ASCII chart rendering for terminal output
 */
import type { BaziChart, ZiweiChart, WesternChart } from '@bazi-destiny/core';

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

/** Render Ziwei 12 Palaces as an ASCII layout */
export function renderZiwei(chart: ZiweiChart): string {
  const lines: string[] = [];
  lines.push('╔══════════════════════════════════════════════════╗');
  lines.push('║         紫 微 斗 数  (Ziwei Chart)               ║');
  lines.push('╠══════════════════════════════════════════════════╣');

  for (const palace of chart.palaces) {
    const stars = [...palace.majorStars, ...palace.minorStars].filter(Boolean).join('、');
    lines.push(`║ ${palace.name.padEnd(8)} [${palace.earthlyBranch}] ${stars.padEnd(30)} ║`);
  }

  lines.push('╠══════════════════════════════════════════════════╣');
  lines.push(`║  生年四化: 禄=${chart.sihua.huaLu} 权=${chart.sihua.huaQuan} 科=${chart.sihua.huaKe} 忌=${chart.sihua.huaJi}  ║`);
  lines.push(`║  生肖: ${chart.shengxiao.padEnd(42)} ║`);
  lines.push('╚══════════════════════════════════════════════════╝');
  return lines.join('\n');
}

/** Render Western Astrology chart as ASCII */
export function renderAstrology(chart: WesternChart): string {
  const lines: string[] = [];
  lines.push('╔══════════════════════════════════════════════════╗');
  lines.push('║      西 洋 占 星  (Western Astrology)            ║');
  lines.push('╠══════╤══════╤══════╤══════╤══════════════════════╣');
  lines.push('║ 行星 │ 星座 │ 宫位 │ 度数 │ 逆行                 ║');
  lines.push('╟──────┼──────┼──────┼──────┼──────────────────────╢');

  for (const p of chart.planets) {
    const retro = p.retrograde ? ' ℞' : '';
    lines.push(`║ ${p.name.padEnd(4)} │ ${p.sign.padEnd(4)} │ ${String(p.house).padEnd(4)} │ ${String(p.degrees.toFixed(1)).padEnd(4)} │ ${retro.padEnd(20)} ║`);
  }

  lines.push('╠══════╧══════╧══════╧══════╧══════════════════════╣');
  lines.push(`║  上升: ${chart.ascendant.sign} ${chart.ascendant.degrees.toFixed(1)}°  │  天顶: ${chart.midheaven.sign} ${chart.midheaven.degrees.toFixed(1)}°  ║`);
  lines.push(`║  宫位系统: ${chart.houses.system.padEnd(38)} ║`);
  lines.push('╚══════════════════════════════════════════════════╝');
  return lines.join('\n');
}

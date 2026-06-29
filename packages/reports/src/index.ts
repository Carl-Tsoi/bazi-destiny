/**
 * reports — Professional destiny analysis report generator.
 *
 * Combines engine outputs + cross-validation consensus + classical citations
 * into a structured markdown report for professional practitioners.
 */
import type { BaziChart, ZiweiChart, WesternChart } from '@bazi-destiny/core';
import { validate, renderConsensusMarkdown } from '@bazi-destiny/cross-validator';
import { cite, analyzeZiwei } from '@bazi-destiny/knowledge-base';

export interface ReportInput {
  bazi: BaziChart;
  ziwei: ZiweiChart;
  astrology: WesternChart;
  birthInfo?: {
    datetime: string;
    location: string;
    gender: string;
  };
}

/** Calculate current age, dayun, and liunian context */
function getCurrentContext(bazi: BaziChart, birthDate: string) {
  const now = new Date();
  const birth = new Date(birthDate);
  const age = now.getFullYear() - birth.getFullYear() -
    (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate()) ? 1 : 0);

  // Current dayun step
  const startAge = bazi.dayun.startAgeYears;
  const currentDayun = bazi.dayun.steps.find(s => age >= s.startAge && age <= s.endAge) ?? null;

  // Current liunian (year stem-branch)
  const tianGan = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  const diZhi = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  const currentYear = now.getFullYear();
  const ganIndex = (currentYear - 4) % 10;
  const zhiIndex = (currentYear - 4) % 12;
  const liunian = `${tianGan[ganIndex]}${diZhi[zhiIndex]}年`;

  return {
    reportDate: now.toISOString().split('T')[0],
    currentYear,
    age,
    currentDayun,
    liunian,
    startAge,
  };
}

/** Generate a professional markdown report */
export function generateReport(input: ReportInput): string {
  const { bazi, ziwei, astrology, birthInfo } = input;
  const consensus = validate(bazi, ziwei, astrology);
  const now = new Date();
  const ctx = birthInfo ? getCurrentContext(bazi, birthInfo.datetime) : null;

  const lines: string[] = [];

  // ── Header ──
  lines.push(`# 三术交叉验证命理报告`);
  lines.push('');
  lines.push(`**报告生成时间:** ${now.toISOString().replace('T', ' ').substring(0, 19)}`);
  if (birthInfo) {
    lines.push(`**出生时间:** ${birthInfo.datetime}  |  **地点:** ${birthInfo.location}  |  **性别:** ${birthInfo.gender}`);
  }
  if (ctx) {
    lines.push(`**当前时间:** ${ctx.currentYear}年  |  **命主年龄:** ${ctx.age}岁  |  **当前流年:** ${ctx.liunian}`);
    if (ctx.currentDayun) {
      const d = ctx.currentDayun;
      lines.push(`**当前大运:** ${d.startAge}-${d.endAge}岁 ${d.gan}${d.zhi} (${d.ganShishen}/${d.zhiShishen})`);
    }
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  // ── Section 1: Consensus Summary ──
  lines.push('## 一、交叉验证总览');
  lines.push('');
  lines.push(`**综合结论:** ${consensus.overallSummary}`);
  lines.push('');
  lines.push(renderConsensusMarkdown(consensus));
  lines.push('');

  // ── Section 2: Bazi Details ──
  lines.push('## 二、八字排盘');
  lines.push('');
  const ps = bazi.pillars;
  lines.push('| 柱 | 天干 | 地支 | 纳音 | 十神 | 藏干 |');
  lines.push('|----|------|------|------|------|------|');
  for (const [key, p] of Object.entries(ps)) {
    const label = { year: '年柱', month: '月柱', day: '日柱', hour: '时柱' }[key] ?? key;
    lines.push(`| ${label} | ${p.gan} | ${p.zhi} | ${p.nayin} | ${p.shishen} | ${p.canggan.map((h: any) => h.stem + '(' + h.tenGod + ')').join('、')} |`);
  }
  lines.push('');
  if (bazi.pattern) lines.push(`- **格局:** ${bazi.pattern}`);
  if (bazi.yongShen) lines.push(`- **用神:** ${bazi.yongShen}`);
  lines.push(`- **起运年龄:** ${bazi.dayun.startAgeYears}岁  |  **方向:** ${bazi.dayun.direction === 'forward' ? '顺行' : '逆行'}`);
  lines.push('');

  // ── Section 3: Ziwei Details ──
  lines.push('## 三、紫微斗数');
  lines.push('');

  const ziweiAnalysis = analyzeZiwei(ziwei);

  // Pattern
  lines.push(`### 格局: ${ziweiAnalysis.pattern.name}`);
  lines.push('');
  lines.push(ziweiAnalysis.pattern.commentary);
  lines.push('');

  // Sihua
  if (ziweiAnalysis.sihuaAnalysis.length > 0) {
    lines.push('### 四化飞星');
    lines.push('');
    for (const s of ziweiAnalysis.sihuaAnalysis) {
      lines.push(`- **${s.star}化${s.type}** (在${s.palace}) — ${s.comment}`);
    }
    lines.push('');
  }

  // Palace detail table
  lines.push('### 十二宫详析');
  lines.push('');
  lines.push('| 宫位 | 天干 | 地支 | 主星(亮度) | 辅星 | 喜忌 |');
  lines.push('|------|------|------|------------|------|------|');
  for (const p of ziweiAnalysis.palaceAnalysis) {
    const majorStars = ziwei.palaces.find(x => x.name === p.name)?.majorStars.map(s => `${s.name}(${s.brightness})`) ?? [];
    const minorStars = ziwei.palaces.find(x => x.name === p.name)?.minorStars.map(s => s.name) ?? [];
    const compatibility = p.stars.filter(s => s.compatibility).map(s => `**${s.name}**: ${s.compatibility}`).join('<br>');
    lines.push(`| ${p.name} | ${p.tianGan} | ${p.diZhi} | ${majorStars.join('、') || '—'} | ${minorStars.join('、') || '—'} | ${compatibility || '—'} |`);
  }
  lines.push('');
  lines.push(`- **生肖:** ${ziwei.shengxiao}`);
  lines.push('');

  // ── Section 4: Western Astrology ──
  lines.push('## 四、西洋占星');
  lines.push('');
  lines.push(`- **上升星座:** ${astrology.ascendant.sign} ${astrology.ascendant.degrees.toFixed(1)}°`);
  lines.push(`- **天顶:** ${astrology.midheaven.sign} ${astrology.midheaven.degrees.toFixed(1)}°`);
  lines.push(`- **宫位系统:** ${astrology.houses.system}`);
  lines.push('');

  // ── Section 5: Classical Citations ──
  lines.push('## 五、古籍参考');
  lines.push('');

  if (bazi.pattern || bazi.pillars) {
    const keywords: string[] = [];
    for (const [, p] of Object.entries(bazi.pillars)) {
      if (p.shishen && p.shishen !== '日主') keywords.push(p.shishen);
    }
    if (bazi.yongShen) keywords.push(bazi.yongShen);

    if (keywords.length > 0) {
      const citationText = cite({ pattern: bazi.pattern || '', keywords, limit: 5 });
      lines.push(citationText);
    } else {
      lines.push('（格局未定，暂无古籍匹配）');
    }
  }
  lines.push('');

  // ── Footer ──
  lines.push('---');
  lines.push(`*报告由 bazi-destiny Phase 2 生成 | 系统时间: ${now.toISOString().replace('T', ' ').substring(0, 19)}*`);

  return lines.join('\n');
}

export { generateNarratives } from './narrative.js';
export type { NarrativeInput } from './narrative.js';

/** Export as text (alias for generateReport, same format) */
export { generateReport as generateText };

export { generateAiAnalyses } from './ai-engines.js';
export type { AiInput, AiResult } from './ai-engines.js';
/**
 * 计分系统详细报告生成器
 */
import type { BaziChart } from '@bazi-destiny/core';
import { determineYongShen, CLIMATE_COEFF } from '@bazi-destiny/knowledge-base';

function now(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export async function generateScoringReport(
  bazi: BaziChart,
  birthInfo?: { datetime: string; location: string; gender: string; name?: string; skipAi?: boolean },
): Promise<string> {
  const lines: string[] = [];
  const n = now();
  const age = birthInfo ? new Date().getFullYear() - new Date(birthInfo.datetime).getFullYear() : 0;

  lines.push('# 计分系统详细报告');
  lines.push('');
  if (birthInfo?.name) lines.push(`**命主:** ${birthInfo.name}`);
  lines.push(`**生成时间:** ${n}`);
  if (birthInfo) lines.push(`**出生:** ${birthInfo.datetime} | ${birthInfo.gender === 'M' ? '男' : '女'} | **${age}岁**`);
  lines.push('');
  lines.push('---');
  lines.push('');

  const yongShenResult = await determineYongShen(
    bazi.pillars as any, bazi.pattern || '', bazi.pillars.月柱.zhi, bazi.pillars.日柱.gan,
  );

  // 五行颜色
  const wxColor: Record<string, string> = {
    '甲': '#4CAF50', '乙': '#4CAF50', '寅': '#4CAF50', '卯': '#4CAF50',
    '丙': '#F44336', '丁': '#F44336', '巳': '#F44336', '午': '#F44336',
    '戊': '#8B4513', '己': '#8B4513', '辰': '#8B4513', '戌': '#8B4513', '丑': '#8B4513', '未': '#8B4513',
    '庚': '#DAA520', '辛': '#DAA520', '申': '#DAA520', '酉': '#DAA520',
    '壬': '#2196F3', '癸': '#2196F3', '亥': '#2196F3', '子': '#2196F3',
  };
  function c(s: string) { return `<span style="color:${wxColor[s] ?? '#000'}">${s}</span>`; }
  const pillarOrder = ['时柱', '日柱', '月柱', '年柱'] as const;

  // ═══ 一、四柱基础 ════════════════════════════════
  lines.push('## 一、四柱基础');
  lines.push('');
  lines.push('| | ' + pillarOrder.map(k => k.replace('柱', '')).join(' | ') + ' |');
  lines.push('|---|' + pillarOrder.map(() => '---|').join('') + '');
  lines.push('| 干支 | ' + pillarOrder.map(k => c(bazi.pillars[k].gan) + c(bazi.pillars[k].zhi)).join(' | ') + ' |');
  lines.push('| 十神 | ' + pillarOrder.map(k => bazi.pillars[k].shishen).join(' | ') + ' |');
  lines.push('| 纳音 | ' + pillarOrder.map(k => bazi.pillars[k].nayin).join(' | ') + ' |');
  lines.push('| 主气 | ' + pillarOrder.map(k => bazi.pillars[k].canggan[0] ? `${c(bazi.pillars[k].canggan[0].stem)}(${bazi.pillars[k].canggan[0].tenGod})` : '—').join(' | ') + ' |');
  lines.push('| 中气 | ' + pillarOrder.map(k => bazi.pillars[k].canggan[1] ? `${c(bazi.pillars[k].canggan[1].stem)}(${bazi.pillars[k].canggan[1].tenGod})` : '—').join(' | ') + ' |');
  lines.push('| 余气 | ' + pillarOrder.map(k => bazi.pillars[k].canggan[2] ? `${c(bazi.pillars[k].canggan[2].stem)}(${bazi.pillars[k].canggan[2].tenGod})` : '—').join(' | ') + ' |');
  lines.push('');

  // ═══ 二、气候系数 ════════════════════════════════
  lines.push('## 二、气候系数 (CLIMATE_COEFF)');
  lines.push('');
  const monthZhi = bazi.pillars.月柱.zhi;
  lines.push(`月令: **${monthZhi}月**`);
  lines.push('');
  const elOrder = ['木', '火', '土', '金', '水'] as const;
  lines.push('| 五行 | ' + elOrder.join(' | ') + ' |');
  lines.push('|------|' + elOrder.map(() => '---|').join('') + '');
  const row = elOrder.map(e => CLIMATE_COEFF[monthZhi]?.[e]?.toString() ?? '?');
  lines.push('| 气候系数 | ' + row.join(' | ') + ' |');
  lines.push('');

  // ═══ 三、逐项计分 ════════════════════════════════
  lines.push('## 三、逐项计分');
  lines.push('');
  const grouped: Record<string, string[]> = { 天干: [], 地支: [], 同柱: [], 干生克: [], 地生: [], 地克: [], 合化: [], 空亡: [], 刑冲: [], 克关系: [] };
  for (const d of yongShenResult.fuyi.details) {
    if (d.startsWith('天干')) grouped.天干.push(d);
    else if (d.startsWith('地支') && !d.includes('六合') && !d.includes('半合') && !d.includes('拱合') && !d.includes('三合') && !d.includes('三会')) grouped.地支.push(d);
    else if (d.startsWith('同柱')) grouped.同柱.push(d);
    else if (d.startsWith('干生') || d.startsWith('干克')) grouped.干生克.push(d);
    else if (d.startsWith('地生')) grouped.地生.push(d);
    else if (d.startsWith('地克')) grouped.地克.push(d);
    else if (d.includes('六合') || d.includes('半合') || d.includes('拱合') || d.includes('三合') || d.includes('三会')) grouped.合化.push(d);
    else if (d.includes('空亡')) grouped.空亡.push(d);
    else if (d.includes('刑') || d.includes('冲')) grouped.刑冲.push(d);
    else if (d.includes('克关系')) grouped.克关系.push(d);
  }
  for (const [title, items] of Object.entries(grouped)) {
    if (!items.length) continue;
    lines.push(`### ${title}`);
    for (const d of items) lines.push(`- ${d}`);
    lines.push('');
  }

  // ═══ 四、汇总 ════════════════════════════════════
  const scores = yongShenResult.fuyi.elementScores;
  const se = Object.entries(scores).sort(([, a], [, b]) => b - a);
  const clrMap: Record<string, string> = { '木': '#4CAF50', '火': '#F44336', '土': '#8B4513', '金': '#DAA520', '水': '#2196F3' };
  const sl = se.map(([el, v]) => `<span style="color:${clrMap[el] ?? '#000'}">${el}${v.toFixed(1)}</span>`).join('  ');
  lines.push('## 四、汇总');
  lines.push('');
  lines.push(`**五行力量**: ${sl}`);
  lines.push(`**日主得分**: ${yongShenResult.fuyi.dayScore.toFixed(1)}分`);
  lines.push(`**日主强弱**: ${yongShenResult.fuyi.dayStrength}`);
  lines.push(`**喜用神**: ${yongShenResult.final.xiShen.join('、')}`);
  lines.push(`**忌神**: ${yongShenResult.final.jiShen.join('、')}`);
  lines.push('');

  // ═══ 五、天干根气明细 ════════════════════════════
  lines.push('## 五、天干根气明细');
  lines.push('');
  lines.push('| 天干 | 坐支 | 气候系数 | 根气分 | 总得分 |');
  lines.push('|------|------|---------|-------|-------|');
  for (const d of yongShenResult.fuyi.details.filter(d => d.startsWith('天干'))) {
    const m = d.match(/天干(.)\(.\): (.+)=([\d.]+)/);
    if (m) {
      const gan = m[1], calc = m[2], total = m[3];
      const zhi = bazi.pillars.年柱.gan === gan ? bazi.pillars.年柱.zhi
        : bazi.pillars.月柱.gan === gan ? bazi.pillars.月柱.zhi
        : bazi.pillars.日柱.gan === gan ? bazi.pillars.日柱.zhi
        : bazi.pillars.时柱.zhi;
      const coeff = calc.match(/×([\d.]+)\+/)?.[1] ?? '?';
      lines.push(`| ${c(gan)} | ${c(zhi)} | ×${coeff} | ${calc.match(/根(\d+)/)?.[1] ?? '?'} | ${parseFloat(total).toFixed(0)} |`);
    }
  }
  lines.push('');

  // ═══ 六、地支力量明细 ════════════════════════════
  lines.push('## 六、地支力量明细');
  lines.push('');
  lines.push('| 柱位 | 地支 | 五行 | 基础分 | 气候系数 | 实际得分 |');
  lines.push('|------|------|------|-------|---------|---------|');
  for (const d of yongShenResult.fuyi.details.filter(d => d.startsWith('地支') && !d.includes('六合') && !d.includes('半合') && !d.includes('拱合') && !d.includes('三合') && !d.includes('三会'))) {
    const m = d.match(/地支(.)\(.\) ?(.+)?: (\d+)×([\d.]+)=([\d.]+)/);
    if (m) {
      const zhi = m[1], label = m[2] || '', base = m[3], wt = m[4], pts = m[5];
      const zhiEl: Record<string, string> = { '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水' };
      lines.push(`| ${label || zhi} | ${c(zhi)} | ${zhiEl[zhi] ?? ''} | ${base} | ×${wt} | ${pts} |`);
    }
  }
  lines.push('');

  // ═══ 七、强弱判定 ════════════════════════════════
  lines.push('## 七、强弱判定逻辑');
  const fuyi = yongShenResult.fuyi;
  lines.push('');
  lines.push(`- 日主得分: ${fuyi.dayScore.toFixed(1)}分`);
  const se2 = Object.entries(fuyi.elementScores);
  const dayEl = se2.find(([, v]) => v === fuyi.dayScore)?.[0] ?? '';
  const dayIdx2 = ['木', '火', '土', '金', '水'].indexOf(dayEl);
  const oppEls = [['木', '火', '土', '金', '水'][(dayIdx2 + 3) % 5], ['木', '火', '土', '金', '水'][(dayIdx2 + 1) % 5], ['木', '火', '土', '金', '水'][(dayIdx2 + 2) % 5]];
  const oppScore = oppEls.reduce((s, e) => s + (scores[e] ?? 0), 0);
  lines.push(`- 克泄耗(官+食+财): ${oppScore.toFixed(1)}分`);
  const shengEl = ['木', '火', '土', '金', '水'][(dayIdx2 + 4) % 5];
  const shengSc = scores[shengEl] ?? 0;
  const effectiveD = shengSc > fuyi.dayScore ? fuyi.dayScore + Math.floor(shengSc / 2) : fuyi.dayScore;
  lines.push(`- 印星(${shengEl}): ${shengSc.toFixed(1)}分 → 有效日主 = ${effectiveD.toFixed(1)}分`);
  lines.push(`- 判定: effectiveDay(${effectiveD.toFixed(1)}) vs opposeScore(${oppScore.toFixed(1)}) → ${fuyi.dayStrength}`);
  lines.push('');

  lines.push('---');
  lines.push(`*${n}*`);
  return lines.join('\n');
}

/**
 * 八字详细分析报告
 */
import type { BaziChart } from '@bazi-destiny/core';
import { determineYongShen, judgeDayun, judgeLiunian, analyzeSpecialty, analyzeInteractions, checkElementFlow } from '@bazi-destiny/knowledge-base';
import type { YongShenResult } from '@bazi-destiny/knowledge-base';
import { generateNarratives } from '@bazi-destiny/reports';

// Re-export scoring report (extracted to separate module)
export { generateScoringReport } from './report-scoring.js';

// ── 紫微/占星报告暂停（后续开发时启用） ──
// export function generateZiweiReport(ziwei: ZiweiChart, ...) { ... }
// export function generateAstrologyReport(astro: WesternChart, ...) { ... }

function now(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

const BAZI_DIMENSIONS = [
  { id: 'mingge', name: '命格' },
  { id: 'career', name: '事业' },
  { id: 'wealth', name: '财运' },
  { id: 'marriage', name: '婚姻' },
  { id: 'children', name: '子女' },
  { id: 'health', name: '健康' },
  { id: 'parents', name: '父母' },
  { id: 'siblings', name: '兄弟' },
  { id: 'property', name: '田宅' },
  { id: 'dayun', name: '大运' },
];

function baziDimension(
  bazi: BaziChart,
  dim: string,
  interactions: ReturnType<typeof analyzeInteractions>,
  opts?: { gender?: string; xiShen?: string[] },
): string[] {
  const notes: string[] = [];
  const ps = bazi.pillars;
  const gender = opts?.gender;
  const xiShen = opts?.xiShen ?? [];

  function shishenToElement(shishen: string, dayGan: string): string {
    const wx: Record<string, string> = { '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水' };
    const dayEl = wx[dayGan] ?? '';
    const generates: Record<string, string> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
    const controls: Record<string, string> = { '木': '土', '火': '金', '土': '水', '金': '木', '水': '火' };
    const generatedBy: Record<string, string> = { '木': '水', '火': '木', '土': '火', '金': '土', '水': '金' };
    const controlsBy: Record<string, string> = { '木': '金', '火': '水', '土': '木', '金': '火', '水': '土' };
    if (shishen.includes('比') || shishen.includes('劫')) return dayEl;
    if (shishen.includes('食') || shishen.includes('伤')) return generates[dayEl] ?? '';
    if (shishen.includes('正财') || shishen.includes('偏财')) return controls[dayEl] ?? '';
    if (shishen.includes('正官') || shishen.includes('七杀')) return controlsBy[dayEl] ?? '';
    if (shishen.includes('正印') || shishen.includes('偏印')) return generatedBy[dayEl] ?? '';
    return '';
  }

  const dayGan = ps.日柱.gan;
  const dayZhi = ps.日柱.zhi;
  const wxMap: Record<string, string> = { '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水' };
  const dayEl = wxMap[dayGan] ?? '';

  switch (dim) {
    case 'mingge': {
      const pattern = bazi.pattern || '正格';
      notes.push(`格局: ${pattern}`);
      const combos = (interactions as any).combos || [];
      if (combos.length > 0) notes.push(`特殊组合: ${combos.join('；')}`);
      break;
    }
    case 'career': {
      const officials = Object.entries(ps).filter(([, p]) => p.shishen.includes('官'));
      const seals = Object.entries(ps).filter(([, p]) => p.shishen.includes('印'));
      if (officials.length > 0) notes.push(`官星${officials.map(([k, p]) => `${k}${p.gan}`).join('、')}`);
      if (seals.length > 0) notes.push(`印星${seals.map(([k, p]) => `${k}${p.gan}`).join('、')}`);
      if (xiShen.length > 0) notes.push(`喜用神${xiShen.join('、')}得力`);
      const careerInteraction = (interactions as any).summary?.career;
      if (careerInteraction) notes.push(careerInteraction);
      break;
    }
    case 'wealth': {
      const cais = Object.entries(ps).filter(([, p]) => p.shishen.includes('财'));
      if (cais.length > 0) notes.push(`财星${cais.map(([k, p]) => `${k}${p.gan}`).join('、')}`);
      const wealthInteraction = (interactions as any).summary?.wealth;
      if (wealthInteraction) notes.push(wealthInteraction);
      break;
    }
    case 'marriage': {
      if (gender === 'M') {
        const cais = Object.entries(ps).filter(([, p]) => p.shishen.includes('财'));
        if (cais.length > 0) notes.push(`妻星(财): ${cais.map(([k, p]) => `${k}${p.gan}`).join('、')}`);
      } else {
        const officials = Object.entries(ps).filter(([, p]) => p.shishen.includes('官'));
        if (officials.length > 0) notes.push(`夫星(官): ${officials.map(([k, p]) => `${k}${p.gan}`).join('、')}`);
      }
      const rizhi = ps.日柱;
      const rizhiCang = rizhi.canggan.map(h => h.tenGod).join('、');
      notes.push(`日支${rizhi.zhi}藏${rizhiCang}，夫妻宫`);
      break;
    }
    case 'children': {
      const childrenStars = Object.entries(ps).filter(([, p]) => p.shishen.includes('食') || p.shishen.includes('伤'));
      if (childrenStars.length > 0) notes.push(`子女星(食伤): ${childrenStars.map(([k, p]) => `${k}${p.gan}`).join('、')}`);
      const shiZhu = ps.时柱;
      notes.push(`时柱${shiZhu.gan}${shiZhu.zhi}为子女宫`);
      break;
    }
    case 'health': {
      const scoresAny = (interactions as any).scores || {};
      const dayElScore = scoresAny[dayEl] ?? 0;
      const weakEls = Object.entries(scoresAny).filter(([e, v]: [string, any]) => e !== dayEl && v >= dayElScore * 1.5);
      if (weakEls.length > 0) notes.push(`强旺五行: ${weakEls.map(([e]) => e).join('、')}`);
      else notes.push('五行相对平衡');
      break;
    }
    case 'parents': {
      const seals = Object.entries(ps).filter(([, p]) => p.shishen.includes('印'));
      if (seals.length > 0) notes.push(`印星(母): ${seals.map(([k, p]) => `${k}${p.gan}`).join('、')}`);
      const nianZhu = ps.年柱;
      notes.push(`年柱${nianZhu.gan}${nianZhu.zhi}为父母宫`);
      break;
    }
    case 'siblings': {
      const peers = Object.entries(ps).filter(([, p]) => p.shishen.includes('比') || p.shishen.includes('劫'));
      if (peers.length > 0) notes.push(`比劫(兄弟姐妹): ${peers.map(([k, p]) => `${k}${p.gan}`).join('、')}`);
      break;
    }
    case 'property': {
      if (ps.年柱.shishen.includes('印')) notes.push(`年柱${ps.年柱.gan}${ps.年柱.zhi}十神${ps.年柱.shishen}，印星代表房产田宅。`);
      break;
    }
    case 'dayun': {
      const currentDayun = bazi.dayun.steps.find(s => s.startAge <= (bazi.dayun.startAgeYears + 11) && s.endAge >= (bazi.dayun.startAgeYears + 11));
      if (currentDayun) notes.push(`当前大运: ${currentDayun.gan}${currentDayun.zhi}(${currentDayun.ganShishen}/${currentDayun.zhiShishen})`);
      break;
    }
  }
  return notes;
}

// ── 八字专业报告 ────────────────────────────────────

export async function generateBaziReport(
  bazi: BaziChart,
  birthInfo?: { datetime: string; location: string; gender: string; name?: string; skipAi?: boolean },
  precomputed?: { yongShenResult?: YongShenResult; score?: { dayStrength: string; dayScore: number; elementScores: Record<string, number>; ziDang: number; yiDang: number } },
): Promise<string> {
  const lines: string[] = [];
  const n = now();
  const age = birthInfo ? new Date().getFullYear() - new Date(birthInfo.datetime).getFullYear() : 0;

  lines.push('# 八字命理分析报告');
  lines.push('');
  if (birthInfo?.name) lines.push(`**命主:** ${birthInfo.name}`);
  lines.push(`**生成时间:** ${n}`);
  if (birthInfo) lines.push(`**出生:** ${birthInfo.datetime} | ${birthInfo.gender === 'M' ? '男' : '女'} | **${age}岁**`);
  lines.push('');
  lines.push('---');
  lines.push('');

  const wxColor: Record<string, string> = {
    '甲': '#4CAF50', '乙': '#4CAF50', '寅': '#4CAF50', '卯': '#4CAF50',
    '丙': '#F44336', '丁': '#F44336', '巳': '#F44336', '午': '#F44336',
    '戊': '#8B4513', '己': '#8B4513', '辰': '#8B4513', '戌': '#8B4513', '丑': '#8B4513', '未': '#8B4513',
    '庚': '#DAA520', '辛': '#DAA520', '申': '#DAA520', '酉': '#DAA520',
    '壬': '#2196F3', '癸': '#2196F3', '亥': '#2196F3', '子': '#2196F3',
  };
  function colored(c: string) { return `<span style="color:${wxColor[c] ?? '#000'}">${c}</span>`; }
  const pillarOrder = ['时柱', '日柱', '月柱', '年柱'] as const;

  // 命盘
  lines.push('## 命盘');
  lines.push('');
  lines.push(`**${bazi.pattern || ''}** | 日主: ${colored(bazi.pillars.日柱.gan)}${colored(bazi.pillars.日柱.zhi)} | 起运${bazi.dayun.startAgeYears}岁${bazi.dayun.direction === 'forward' ? '顺行' : '逆行'}`);
  lines.push('');
  lines.push('| | ' + pillarOrder.map(k => k.replace('柱', '')).join(' | ') + ' |');
  lines.push('|---|' + pillarOrder.map(() => '---|').join('') + '');
  lines.push('| 天干十神 | ' + pillarOrder.map(k => bazi.pillars[k].shishen).join(' | ') + ' |');
  lines.push('| 天干 | ' + pillarOrder.map(k => colored(bazi.pillars[k].gan)).join(' | ') + ' |');
  lines.push('| 地支 | ' + pillarOrder.map(k => colored(bazi.pillars[k].zhi)).join(' | ') + ' |');
  lines.push('| 地支十神 | ' + pillarOrder.map(k => bazi.pillars[k].canggan[0]?.tenGod ?? '—').join(' | ') + ' |');
  const maxCang = Math.max(...pillarOrder.map(k => bazi.pillars[k].canggan.length));
  for (let i = 0; i < maxCang; i++) {
    lines.push('| ' + (['主气', '中气', '余气'][i] || '藏干') + ' | ' + pillarOrder.map(k => {
      const h = bazi.pillars[k].canggan[i];
      return h ? `${colored(h.stem)}(${h.tenGod})` : '—';
    }).join(' | ') + ' |');
  }
  lines.push('');

  // 用神分析（优先使用外部传入的预计算结果）
  const yongShenResult = precomputed?.yongShenResult
    ?? await determineYongShen(
      bazi.pillars as any, bazi.pattern || '', bazi.pillars.月柱.zhi, bazi.pillars.日柱.gan,
    );

  lines.push('## 用神分析');
  lines.push('');
  lines.push('| 分析维度 | 类型 | 用神 | 诊断 |');
  lines.push('|----------|------|------|------|');
  const typeNames: Record<string, string> = { 格局用神: '格局', 平衡用神: '扶抑', 调候用神: '调候', 病药用神: '病药', 神煞: '神煞', 奇格: '奇格' };
  for (const e of yongShenResult.engines ?? []) {
    lines.push(`| ${e.name} | ${typeNames[e.yongShenType ?? ''] ?? ''} | ${e.yongShen ?? '—'} | ${e.diagnostics.join('；')} |`);
  }
  lines.push('');

  const strengthLabel = yongShenResult.fuyi.dayStrength.includes('弱') ? '身弱，喜生扶' : '身强，喜克泄';
  lines.push(`**结论**: ${bazi.pattern || '正格'}，${yongShenResult.fuyi.dayStrength}（${strengthLabel}）`);
  if (yongShenResult.final.xiShen.length > 0) lines.push(`**喜用神: ${yongShenResult.final.xiShen.join('、')}**`);
  if (yongShenResult.final.jiShen.length > 0) lines.push(`**忌神: ${yongShenResult.final.jiShen.join('、')}**`);
  lines.push('');

  // 五行力量
  const scores = yongShenResult.fuyi.elementScores;
  const scoreEntries = Object.entries(scores).sort(([, a], [, b]) => b - a);
  const clrMap: Record<string, string> = { '木': '#4CAF50', '火': '#F44336', '土': '#8B4513', '金': '#DAA520', '水': '#2196F3' };
  const scoreLine = scoreEntries.map(([el, v]) => `<span style="color:${clrMap[el] ?? '#000'}">${el}${v}</span>`).join('  ');
  lines.push('**五行力量**: ' + scoreLine + ` | 日主${yongShenResult.fuyi.dayScore}分`);
  lines.push('');
  lines.push('<details>');
  lines.push('<summary>计分过程</summary>');
  lines.push('');
  for (const d of yongShenResult.fuyi.details) {
    lines.push(`- ${d}`);
  }
  lines.push('</details>');
  lines.push('');

  // 大运详析
  const dayunJudgments = judgeDayun(bazi.dayun.steps, bazi.pillars, yongShenResult.final.xiShen, yongShenResult.final.jiShen, yongShenResult.final.yongShen);
  lines.push('## 大运详析');
  lines.push('');
  lines.push('| 年龄 | 干支 | 天干(前5年) | 地支(后5年) | 与命局互动 |');
  lines.push('|------|------|------------|------------|-----------|');
  for (const d of dayunJudgments) {
    lines.push(`| ${d.step.startAge}-${d.step.endAge} | ${d.step.gan}${d.step.zhi} | ${d.ganJudgment || ''} | ${d.zhiJudgment || ''} | ${d.interactions.join('；') || ''} |`);
  }
  lines.push('');

  const currentDayun = dayunJudgments.find(d => d.step.startAge <= age && d.step.endAge >= age);
  if (currentDayun) {
    lines.push(`**当前大运**: ${currentDayun.step.startAge}-${currentDayun.step.endAge}岁 ${currentDayun.step.gan}${currentDayun.step.zhi}（${currentDayun.ganJudgment}）`);
    lines.push('');
  }

  // 专项分析
  const birthYear = birthInfo ? new Date(birthInfo.datetime).getFullYear() : 1980;
  const interactions = analyzeInteractions(bazi.pillars, bazi.dayun.steps, birthYear, bazi.pattern || '');
  const flow = checkElementFlow(bazi.pillars);
  const specialty = analyzeSpecialty(bazi, yongShenResult.fuyi.dayStrength, bazi.pattern || '', birthInfo?.gender);

  lines.push('## 专项分析');
  lines.push('');

  for (const dim of BAZI_DIMENSIONS) {
    const dimNotes = baziDimension(bazi, dim.id, interactions, { gender: birthInfo?.gender, xiShen: yongShenResult.final.xiShen });
    if (dimNotes.length > 0) {
      lines.push(`### ${dim.name}`);
      for (const note of dimNotes) lines.push(`- ${note}`);
      lines.push('');
    }
  }

  lines.push('---');
  lines.push('');
  lines.push(`**命格等级: ${specialty.rating.grade}** — ${specialty.rating.summary}`);
  lines.push('');

  // AI叙事（默认跳过，--ai 启用）
  if (!birthInfo?.skipAi) {
    try {
      const narratives = await generateNarratives({
        name: birthInfo?.name,
        pattern: bazi.pattern || '',
        yongShen: {
          yongShen: yongShenResult.final.yongShen,
          xiShen: yongShenResult.final.xiShen,
          jiShen: yongShenResult.final.jiShen,
          methods: (yongShenResult.engines ?? []).map((e: any) => ({
            method: e.name, yongShen: e.yongShen ?? '', reason: e.diagnostics?.join('；') ?? '',
          })),
        },
        finalYongShen: yongShenResult.final.yongShen,
        finalXiShen: yongShenResult.final.xiShen,
        finalJiShen: yongShenResult.final.jiShen,
        dayStrength: yongShenResult.fuyi.dayStrength,
        pillars: Object.fromEntries(
          (['年柱','月柱','日柱','时柱'] as const).map(k => [k, `${(bazi.pillars as any)[k].gan}${(bazi.pillars as any)[k].zhi} ${(bazi.pillars as any)[k].shishen} ${(bazi.pillars as any)[k].nayin || ''}`])
        ),
        dayun: bazi.dayun.steps.map(s => ({
          age: `${s.startAge}-${s.endAge}`, ganZhi: `${s.gan}${s.zhi}`, tenGod: `${s.ganShishen}/${s.zhiShishen}`,
        })),
        currentDayun: '',
        currentYear: String(new Date().getFullYear()),
        liunian: '',
        dimensions: Object.fromEntries(
          BAZI_DIMENSIONS.map(dim => [dim.id, baziDimension(bazi, dim.id, interactions, { gender: birthInfo?.gender, xiShen: yongShenResult.final.xiShen })])
        ),
        interactions: { gans: [], zhis: [], dayunEffects: [] },
      });
      lines.push('## AI 叙事分析');
      lines.push('');
      lines.push(narratives.yuanjuEvaluation || '');
      lines.push('');
      if (narratives.dayunEvaluation) {
        lines.push(narratives.dayunEvaluation);
        lines.push('');
      }
    } catch (e: any) {
      lines.push(`<!-- AI narrative skipped: ${e?.message || e} -->`);
    }
  }

  lines.push('---');
  lines.push(`*${n}*`);
  return lines.join('\n');
}

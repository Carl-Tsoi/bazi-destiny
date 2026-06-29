/**
 * 八字详细分析报告
 */
import type { BaziChart } from '@bazi-destiny/core';
import { determineYongShen, judgeDayun, analyzeSpecialty, analyzeInteractions, checkElementFlow, CLIMATE_COEFF } from '@bazi-destiny/knowledge-base';
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
  precomputed?: import('./types.js').PrecomputedData,
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

  // ═══ 一、排盘总览 ═══
  lines.push('## 排盘总览');
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

  // ═══ 二、五行旺衰分析 ═══
  const scoreData = (precomputed as any)?.score;
  lines.push('## 五行旺衰');
  lines.push('');
  const wxMap: Record<string,string> = {'甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水'};
  const dayEl2 = wxMap[bazi.pillars.日柱.gan] ?? '';
  if (scoreData) {
    lines.push(`| 项目 | 数值 |`);
    lines.push(`|------|------|`);
    lines.push(`| 日主${bazi.pillars.日柱.gan}(${dayEl2})得分 | ${scoreData.dayScore.toFixed(1)} 分 |`);
    lines.push(`| 自党（日主+印扶） | ${scoreData.ziDang.toFixed(1)} 分 |`);
    lines.push(`| 异党（官杀+食伤+财） | ${scoreData.yiDang.toFixed(1)} 分 |`);
    lines.push(`| 判定 | **${scoreData.dayStrength}** |`);
    const monthZhi3 = bazi.pillars.月柱.zhi;
    const dayCl = CLIMATE_COEFF[monthZhi3]?.[dayEl2] ?? 1.0;
    lines.push(`| 月令 | ${monthZhi3}月，${dayEl2}气候系数 ${dayCl} |`);
    lines.push('');
  }
  lines.push('');

  // 用神分析（优先使用外部传入的预计算结果）
  const yongShenResult = precomputed?.yongShenResult
    ?? await determineYongShen(
      bazi.pillars as any, bazi.pattern || '', bazi.pillars.月柱.zhi, bazi.pillars.日柱.gan,
    );

  lines.push('## 用神喜忌');
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

  lines.push('');

  // ═══ 四、十神分布 ═══
  lines.push('## 十神分布');
  lines.push('');
  const wxMap3: Record<string,string> = {'甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水'};
  const ORDER3 = ['木','火','土','金','水'];
  const dayEl3 = wxMap3[bazi.pillars.日柱.gan] ?? '';
  const dayIdx3 = ORDER3.indexOf(dayEl3);
  const shishenEl = (ss:string) => { if(ss.includes('比')||ss.includes('劫')) return dayEl3; if(ss.includes('食')||ss.includes('伤')) return ORDER3[(dayIdx3+1)%5]; if(ss.includes('财')) return ORDER3[(dayIdx3+2)%5]; if(ss.includes('官')||ss.includes('杀')) return ORDER3[(dayIdx3+3)%5]; if(ss.includes('印')) return ORDER3[(dayIdx3+4)%5]; return ''; };
  const jiShen = yongShenResult.final.jiShen;
  const xiShen = yongShenResult.final.xiShen;
  lines.push('| 柱 | 天干 | 十神 | 五行 | 喜忌 |');
  lines.push('|------|------|------|------|------|');
  for (const [k, p] of Object.entries(bazi.pillars)) {
    const el = shishenEl(p.shishen);
    const tag = !el ? '' : jiShen.includes(el) ? '忌' : xiShen.includes(el) ? '喜' : '—';
    lines.push(`| ${k} | ${colored(p.gan)} | ${p.shishen} | ${el||'—'} | ${tag} |`);
  }
  lines.push('');

  // 专项分析 — 优先使用新版引擎结果（L5预计算），fallback旧版
  const specialtyV2 = (precomputed as any)?.specialty;
  const birthYear = birthInfo ? new Date(birthInfo.datetime).getFullYear() : 1980;
  const interactions = analyzeInteractions(bazi.pillars, bazi.dayun.steps, birthYear, bazi.pattern || '');
  const flow = checkElementFlow(bazi.pillars);
  lines.push('## 专项分析');
  lines.push('');

  const chapterMap: Record<string,string> = {
    '性格':'五','事业':'六','财运':'六','婚姻':'七','健康':'八',
    '子女':'九','父母':'九','人际':'九','兄弟':'九','田宅':'九','晚年':'九'
  };
  let lastChapter = '';

  if (specialtyV2?.dimensions) {
    for (const dim of specialtyV2.dimensions) {
      if (!dim.items || dim.items.length === 0) continue;
      const ch = chapterMap[dim.dimension] || '';
      if (ch && ch !== lastChapter) {
        const titles: Record<string,string> = {
          '五':'性格分析','六':'事业财运','七':'婚姻家庭','八':'健康提示','九':'六亲简析'
        };
        lines.push(`### ${titles[ch] || dim.dimension}`);
        lines.push('');
        lastChapter = ch;
      }
      lines.push(`**${dim.dimension}**`);
      for (const item of dim.items) {
        lines.push(`- **${item.layer1}**`);
        lines.push(`  ${item.layer2}`);
        lines.push(`  > ${item.layer3}`);
      }
      lines.push('');
    }
    lines.push(`**命格等级: ${specialtyV2.rating.grade}** — ${specialtyV2.rating.summary}`);
    lines.push('');
  } else {
    // 旧版 fallback
    const specialty = analyzeSpecialty(bazi, yongShenResult.fuyi.dayStrength, bazi.pattern || '', birthInfo?.gender);
    for (const dim of BAZI_DIMENSIONS) {
      const dimNotes = baziDimension(bazi, dim.id, interactions, { gender: birthInfo?.gender, xiShen: yongShenResult.final.xiShen });
      if (dimNotes.length > 0) {
        lines.push(`**${dim.name}**`);
        for (const note of dimNotes) lines.push(`- ${note}`);
        lines.push('');
      }
    }
    lines.push(`**命格等级: ${specialty.rating.grade}** — ${specialty.rating.summary}`);
    lines.push('');
  }

    // ═══ 十、大运详析
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



  // ═══ 十一、趋吉避凶 ═══
  lines.push('## 趋吉避凶');
  lines.push('');
  const directionMap: Record<string,string> = {'木':'东方','火':'南方','土':'中央/本地','金':'西方','水':'北方'};
  const colorMap: Record<string,string> = {'木':'绿色/青色','火':'红色/紫色','土':'黄色/棕色','金':'白色/金色','水':'黑色/蓝色'};
  const yEl = yongShenResult.final.yongShen;
  if (yEl) {
    lines.push(`- **有利行业**: ${yEl}属性行业（见事业财运章节）`);
    lines.push(`- **有利方位**: ${directionMap[yEl] || yEl}`);
    lines.push(`- **有利颜色**: ${colorMap[yEl] || yEl}`);
    lines.push(`- **贵人属相**: ${yEl === '木' ? '虎/兔' : yEl === '火' ? '蛇/马' : yEl === '土' ? '龙/狗/牛/羊' : yEl === '金' ? '猴/鸡' : '鼠/猪'}`);
    lines.push('');
  }

  // ═══ 附录：计分过程 ═══
  const scores = yongShenResult.fuyi.elementScores;
  const scoreEntries = (Object.entries(scores) as [string, number][]).sort((a, b) => b[1] - a[1]);
  const clrMap: Record<string, string> = { '木': '#4CAF50', '火': '#F44336', '土': '#8B4513', '金': '#DAA520', '水': '#2196F3' };
  lines.push('<details>');
  lines.push('<summary>附录：五行计分详情</summary>');
  lines.push('');
  const scoreLine = scoreEntries.map(([el, v]) => `<span style="color:${clrMap[el] ?? '#000'}">${el}${v.toFixed(1)}</span>`).join('  ');
  lines.push(`**五行力量**: ${scoreLine} | 日主${yongShenResult.fuyi.dayScore.toFixed(1)}分`);
  lines.push('');
  for (const d of yongShenResult.fuyi.details) {
    lines.push(`- ${d}`);
  }
  lines.push('</details>');
  lines.push('');

  // 古籍参考
  const classicalRefs = (yongShenResult.engines ?? [])
    .flatMap((e: any) => (e.diagnostics || []).map((d: string) => ({ engine: e.name, text: d })))
    .filter((r: any) => /穷通宝鉴|滴天髓|子平真诠|神峰通考|渊海子平|三命通会/.test(r.text));
  if (classicalRefs.length > 0) {
    lines.push('## 古籍参考');
    lines.push('');
    const sources = ['穷通宝鉴','滴天髓','子平真诠','神峰通考','渊海子平','三命通会'];
    for (const src of sources) {
      const refs = classicalRefs.filter((r: any) => r.text.includes(src));
      if (refs.length === 0) continue;
      lines.push(`**${src}**`);
      for (const r of refs) lines.push(`- ${r.text}`);
      lines.push('');
    }
  }

  // AI 分析章节（--ai 启用时，优先使用预计算结果）
  if (!birthInfo?.skipAi) {
    const aiData = (precomputed as any)?.aiResult;
    if (aiData?.yuanju) {
      lines.push('### 原局分析'); lines.push(''); lines.push(aiData.yuanju); lines.push('');
      if (aiData.dayun) { lines.push('### AI解读'); lines.push(''); lines.push(aiData.dayun); lines.push(''); }
      if (aiData.liunian) { lines.push('### AI解读'); lines.push(''); lines.push(aiData.liunian); lines.push(''); }
    }
  }

  lines.push('---');
  lines.push(`*${n}*`);
  return lines.join('\n');
}

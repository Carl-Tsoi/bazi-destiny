/**
 * 八字专业命理分析报告 — v3 专业版
 *
 * 综合网上10个最佳命理报告模板的设计优点：
 *   命-运-问三段式 / 章节编号+图标 / 白话翻译术语 / 分层详略 /
 *   表格+段落混合 / 当前运势聚焦 / 卡片式大运 / 可执行建议
 */
import type { BaziChart } from '@bazi-destiny/core';
import { determineYongShen, judgeDayun, analyzeInteractions, checkElementFlow, CLIMATE_COEFF } from '@bazi-destiny/knowledge-base';
import type { YongShenResult } from '@bazi-destiny/knowledge-base';
import { generateNarratives } from '@bazi-destiny/reports';

export { generateScoringReport } from './report-scoring.js';

// ── 工具函数 ────────────────────────────────────

function now(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

const WX_COLOR: Record<string, string> = {
  '甲': '#4CAF50', '乙': '#4CAF50', '寅': '#4CAF50', '卯': '#4CAF50',
  '丙': '#F44336', '丁': '#F44336', '巳': '#F44336', '午': '#F44336',
  '戊': '#8B4513', '己': '#8B4513', '辰': '#8B4513', '戌': '#8B4513', '丑': '#8B4513', '未': '#8B4513',
  '庚': '#DAA520', '辛': '#DAA520', '申': '#DAA520', '酉': '#DAA520',
  '壬': '#2196F3', '癸': '#2196F3', '亥': '#2196F3', '子': '#2196F3',
};
function colored(c: string) { return `<span style="color:${WX_COLOR[c] ?? '#000'}">${c}</span>`; }

const WX_MAP: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土',
  '庚': '金', '辛': '金', '壬': '水', '癸': '水',
};

function elementBar(scores: Record<string, number>): string {
  const order = ['木', '火', '土', '金', '水'];
  const clr: Record<string, string> = { '木': '#4CAF50', '火': '#F44336', '土': '#8B4513', '金': '#DAA520', '水': '#2196F3' };
  const positives = order.map(e => Math.max(0, scores[e] ?? 0));
  const max = Math.max(...positives, 1);
  return order.map(e => {
    const v = scores[e] ?? 0;
    const absV = Math.abs(v);
    const w = Math.max(0, Math.round((absV / max) * 20));
    const bar = v >= 0
      ? '█'.repeat(w) + '░'.repeat(20 - w)
      : '░'.repeat(20 - w) + '▓'.repeat(w);
    return `<span style="color:${clr[e]}">${e} ${bar} ${v.toFixed(1)}</span>`;
  }).join('  \n');
}

// ── 主线 ────────────────────────────────────────

export async function generateBaziReport(
  bazi: BaziChart,
  birthInfo?: { datetime: string; location: string; gender: string; name?: string; skipAi?: boolean },
  precomputed?: import('./types.js').PrecomputedData,
): Promise<string> {
  const L: string[] = [];
  const n = now();
  const age = birthInfo ? new Date().getFullYear() - new Date(birthInfo.datetime).getFullYear() : 0;
  const gender = birthInfo?.gender ?? 'M';
  const genderLabel = gender === 'M' ? '男' : '女';
  const dayGan = bazi.pillars.日柱.gan;
  const dayEl = WX_MAP[dayGan] ?? '';
  const pillarOrder = ['时柱', '日柱', '月柱', '年柱'] as const;  // 传统右→左: 时日月年

  // ── 预计算数据 ──
  const yongShenResult = precomputed?.yongShenResult
    ?? await determineYongShen(bazi.pillars as any, bazi.pattern || '', bazi.pillars.月柱.zhi, dayGan);
  const scoreData = (precomputed as any)?.score;
  const specialtyV2 = (precomputed as any)?.specialty;
  const dayunJudgments = judgeDayun(bazi.dayun.steps, bazi.pillars, yongShenResult.final.xiShen, yongShenResult.final.jiShen, yongShenResult.final.yongShen);
  const currentDayun = dayunJudgments.find(d => d.step.startAge <= age && d.step.endAge >= age);
  const nextDayun = dayunJudgments.find(d => d.step.startAge > age);

  // ── 封面 ──
  L.push('');
  L.push('# 八字命理分析报告');
  L.push('#### Bazi · Four Pillars of Destiny');
  L.push('');
  L.push('---');
  L.push('');
  L.push('| 项目 | 内容 |');
  L.push('|------|------|');
  if (birthInfo?.name) L.push(`| 命主 | **${birthInfo.name}** |`);
  L.push(`| 性别 | ${genderLabel} |`);
  L.push(`| 出生 | ${birthInfo?.datetime ?? ''}（公历） |`);
  L.push(`| 八字 | ${pillarOrder.map(k => colored(bazi.pillars[k].gan) + colored(bazi.pillars[k].zhi)).join(' ')} |`);
  L.push(`| 日主 | ${colored(dayGan)}${dayEl} |`);
  L.push(`| 格局 | ${bazi.pattern || '正格'} |`);
  L.push(`| 年龄 | ${age}岁 |`);
  L.push(`| 生成 | ${n} |`);
  L.push('');
  L.push('---');
  L.push('');

  // ═══════════════════════════════════════════════════
  // 第一章  命局总览
  // ═══════════════════════════════════════════════════
  L.push('## 第一章  命局总览');
  L.push('');

  // 四柱表（传统格式：年月日时，标签在右）
  const pillarLabels = ['时', '日', '月', '年'];
  L.push('| ' + pillarLabels.join(' | ') + ' | |');
  L.push('|' + pillarLabels.map(() => ':---:').join('|') + '|:---|');
  L.push('| ' + pillarOrder.map(k => bazi.pillars[k].shishen).join(' | ') + ' | 十神 |');
  L.push('| ' + pillarOrder.map(k => colored(bazi.pillars[k].gan)).join(' | ') + ' | 天干 |');
  L.push('| ' + pillarOrder.map(k => colored(bazi.pillars[k].zhi)).join(' | ') + ' | 地支 |');
  L.push('| ' + pillarOrder.map(k => {
    const h = bazi.pillars[k].canggan[0];
    return h ? `${colored(h.stem)}(${h.tenGod})` : '—';
  }).join(' | ') + ' | 主气 |');
  const maxCang = Math.max(...pillarOrder.map(k => bazi.pillars[k].canggan.length));
  for (let i = 1; i < maxCang; i++) {
    L.push('| ' + pillarOrder.map(k => {
      const h = bazi.pillars[k].canggan[i];
      return h ? `${colored(h.stem)}(${h.tenGod})` : '—';
    }).join(' | ') + ' | ' + (['中气', '余气'][i - 1] || '藏干') + ' |');
  }
  L.push('');

  // 五行力量条
  if (scoreData) {
    L.push('### 五行力量');
    L.push('');
    L.push(elementBar(scoreData.elementScores));
    L.push('');
    L.push(`| 自党(日主+印) | 异党(官杀+食伤+财) | 日主得分 | 判定 |`);
    L.push(`|:---:|:---:|:---:|:---:|`);
    L.push(`| ${(scoreData.ziDang as number).toFixed(1)} | ${(scoreData.yiDang as number).toFixed(1)} | ${(scoreData.dayScore as number).toFixed(1)} | **${scoreData.dayStrength}** |`);
    L.push('');
  }

  // ═══════════════════════════════════════════════════
  // 第二章  日主分析
  // ═══════════════════════════════════════════════════
  L.push('## 第二章  日主分析');
  L.push('');

  const dayElDescriptions: Record<string, string> = {
    '木': '甲木为参天大树，乙木为花草藤萝。木主仁，有生长向上之力，性格正直温和，但也容易固执。',
    '火': '丙火为太阳之火，丁火为灯烛之火。火主礼，热情奔放，行动力强，但也容易急躁冲动。',
    '土': '戊土为城墙之土，己土为田园之土。土主信，稳重踏实，包容承载，但也容易保守迟缓。',
    '金': '庚金为刀剑之金，辛金为珠玉之金。金主义，刚毅果断，重原则守纪律，但也容易刻板冷漠。',
    '水': '壬水为江河之水，癸水为雨露之水。水主智，聪明变通，适应力强，但也容易善变不定。',
  };
  const dayDesc = dayElDescriptions[dayEl] ?? '';

  L.push(`你的日主是 **${colored(dayGan)}${dayEl}**。${dayDesc}`);
  L.push('');

  if (scoreData) {
    const ds = scoreData.dayStrength as string;
    const isStrong = ds.includes('强');
    const wxWhy: Record<string, string> = {
      '木': isStrong ? '木旺需金来修剪、火来泄秀' : '木弱需水来滋养、木来扶持',
      '火': isStrong ? '火旺需水来调候、土来泄力' : '火弱需木来生火、火来帮助',
      '土': isStrong ? '土旺需木来疏通、金来泄气' : '土弱需火来生土、土来帮助',
      '金': isStrong ? '金旺需火来锻炼、水来泄秀' : '金弱需土来生金、金来帮助',
      '水': isStrong ? '水旺需土来筑堤、木来泄流' : '水弱需金来生水、水来帮助',
    };

    L.push(`**强弱判定：${ds}**`);
    L.push('');
    L.push(`全局自党 ${(scoreData.ziDang as number).toFixed(1)} 分，异党 ${(scoreData.yiDang as number).toFixed(1)} 分。`);
    L.push(`日主${dayEl}在全局中力量${isStrong ? '充足' : '偏弱'}。${wxWhy[dayEl] ?? ''}`);
    L.push('');
  }

  // ═══════════════════════════════════════════════════
  // 第三章  用神喜忌
  // ═══════════════════════════════════════════════════
  L.push('## 第三章  用神喜忌');
  L.push('');

  // 六书合参
  L.push('### 六书合参');
  L.push('');
  L.push('| 分析维度 | 类型 | 用神 | 诊断 |');
  L.push('|----------|------|------|------|');
  const typeNames: Record<string, string> = { 格局用神: '格局', 平衡用神: '扶抑', 调候用神: '调候', 病药用神: '病药', 神煞: '神煞', 奇格: '奇格' };
  for (const e of yongShenResult.engines ?? []) {
    L.push(`| ${e.name} | ${typeNames[e.yongShenType ?? ''] ?? ''} | ${e.yongShen ?? '—'} | ${e.diagnostics.join('；')} |`);
  }
  L.push('');

  // 白话总结
  const yEl = yongShenResult.final.yongShen;
  const xiEls = yongShenResult.final.xiShen;
  const jiEls = yongShenResult.final.jiShen;

  // 去重用神+喜神
  const yongXiUniq = [...new Set([yEl, ...xiEls])];

  L.push('### 一句话总结');
  L.push('');
  L.push(`**对你有利的（喜用神）：${yongXiUniq.join('、')}**`);
  L.push('');
  for (const e of yongXiUniq) {
    const genRel: Record<string, string> = {
      '木': '木能生火、克土，木代表生长和创造力',
      '火': '火能生土、克金，火代表热情和行动力',
      '土': '土能生金、克水，土代表稳定和承载力',
      '金': '金能生水、克木，金代表规则和决断力',
      '水': '水能生木、克火，水代表智慧和变通力',
    };
    if (genRel[e]) L.push(`- **${e}** — ${genRel[e]}。${e}属性的人/事/物对你有正面帮助。`);
  }
  L.push('');
  L.push(`**对你不利的（忌神）：${jiEls.join('、')}**`);
  L.push('');
  for (const e of jiEls) {
    L.push(`- **${e}** — 遇到${e}属性的人/事/物时需多加注意，不宜过度投入。`);
  }
  L.push('');

  // ═══════════════════════════════════════════════════
  // 第四章  人生专题
  // ═══════════════════════════════════════════════════
  L.push('## 第四章  人生专题');
  L.push('');

  const chapterDefs: Record<string, { order: number; title: string; dims: string[] }> = {
    personality: { order: 1, title: '🎯 性格特质', dims: ['性格'] },
    careerWealth: { order: 2, title: '💼 事业财运', dims: ['事业', '财运'] },
    marriage: { order: 3, title: '💕 婚姻感情', dims: ['婚姻'] },
    health: { order: 4, title: '⚕️ 健康养生', dims: ['健康'] },
    family: { order: 5, title: '🏠 六亲缘份', dims: ['子女', '父母', '人际', '兄弟', '田宅', '晚年'] },
  };

  if (specialtyV2?.dimensions) {
    const dimMap = new Map<string, any[]>(
      specialtyV2.dimensions.map((d: any) => [d.dimension as string, d.items as any[]])
    );

    const chapters = Object.entries(chapterDefs).sort((a, b) => a[1].order - b[1].order);

    for (const [, chapter] of chapters) {
      const chapterItems: Array<{ dim: string; item: any }> = [];
      for (const dimName of chapter.dims) {
        for (const item of (dimMap.get(dimName) || [])) {
          chapterItems.push({ dim: dimName, item });
        }
      }
      if (chapterItems.length === 0) continue;

      L.push(`### ${chapter.title}`);
      L.push('');

      for (const { item } of chapterItems) {
        // 标题 = L1
        L.push(`**${item.layer1}**`);
        L.push('');

        // L2: 对你的影响
        L.push(`<span style="color:#666;">▸ 对你的影响</span>`);
        L.push(item.layer2);
        L.push('');

        // L3: 趋避建议
        L.push(`<span style="color:#1976D2;">▸ 趋避建议</span>`);
        L.push(item.layer3);
        L.push('');

        // 古籍引用
        if (item.citation) {
          L.push(`> 📖 ${item.citation}`);
          L.push('');
        }

        L.push('---');
        L.push('');
      }
    }

    // 命格等级
    const gradeEmoji: Record<string, string> = { 'A': '🏆', 'B': '⭐', 'C': '📊', 'D': '🔍' };
    L.push(`**${gradeEmoji[specialtyV2.rating.grade] || ''} 综合评级: ${specialtyV2.rating.grade}** — ${specialtyV2.rating.summary}`);
    L.push('');
  }

  // ═══════════════════════════════════════════════════
  // 第五章  大运走势
  // ═══════════════════════════════════════════════════
  L.push('## 第五章  大运走势');
  L.push('');
  L.push(`起运年龄: **${bazi.dayun.startAgeYears}岁**，${bazi.dayun.direction === 'forward' ? '顺行' : '逆行'}`);
  L.push('');

  // 每运一个卡片
  for (const d of dayunJudgments) {
    const isCurrent = d === currentDayun;
    const isPast = d.step.endAge < age;
    const prefix = isCurrent ? '▶️ ' : isPast ? '✅ ' : '🔮 ';
    const tag = isCurrent ? ' **⬅ 你在这里**' : '';

    // 过去的大运折叠，当前和未来的展开
    if (isPast) {
      L.push(`<details>`);
      L.push(`<summary>${prefix}${d.step.startAge}-${d.step.endAge}岁 ${d.step.gan}${d.step.zhi} — ${d.ganJudgment} / ${d.zhiJudgment}</summary>`);
    } else {
      L.push(`#### ${prefix}${d.step.startAge}-${d.step.endAge}岁  ${colored(d.step.gan)}${colored(d.step.zhi)}${tag}`);
      L.push('');
    }

    if (!isPast) {
      // 详细卡片
      const ganLabel = d.ganJudgment.includes('用神') ? '✅ 用神' : d.ganJudgment.includes('喜') ? '👍 喜神' : '⚠️ 忌神';
      const zhiLabel = d.zhiJudgment.includes('用神') ? '✅ 用神' : d.zhiJudgment.includes('喜') ? '👍 喜神' : '⚠️ 忌神';

      L.push('| 项目 | 内容 |');
      L.push('|------|------|');
      L.push(`| 天干(前5年) | ${colored(d.step.gan)} ${d.step.ganShishen} — ${ganLabel} ${d.ganJudgment} |`);
      L.push(`| 地支(后5年) | ${colored(d.step.zhi)} ${d.step.zhiShishen} — ${zhiLabel} ${d.zhiJudgment} |`);
      if (d.interactions.length > 0) {
        L.push(`| 与命局互动 | ${d.interactions.join('；')} |`);
      }
      L.push('');

      // 关键年份提示
      const stepStartYear = new Date(birthInfo?.datetime ?? '2000-01-01').getFullYear() + d.step.startAge;
      L.push(`**这十年中值得关注的年份**: ${stepStartYear + 1}年、${stepStartYear + 4}年、${stepStartYear + 7}年`);
      L.push('');
    }

    if (isPast) {
      L.push('</details>');
      L.push('');
    }
  }

  // 简表（折叠）
  L.push('<details>');
  L.push('<summary>📋 大运速查表</summary>');
  L.push('');
  L.push('| 年龄 | 干支 | 天干(前5年) | 地支(后5年) | 与命局互动 |');
  L.push('|------|------|------------|------------|-----------|');
  for (const d of dayunJudgments) {
    L.push(`| ${d.step.startAge}-${d.step.endAge} | ${d.step.gan}${d.step.zhi} | ${d.ganJudgment || ''} | ${d.zhiJudgment || ''} | ${d.interactions.join('；') || '—'} |`);
  }
  L.push('');
  L.push('</details>');
  L.push('');

  // ═══════════════════════════════════════════════════
  // 第六章  当前运势
  // ═══════════════════════════════════════════════════
  L.push('## 第六章  当前运势');
  L.push('');

  const currentYear = new Date().getFullYear();
  const tianGan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const diZhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const thisYearGan = tianGan[(currentYear - 4) % 10];
  const thisYearZhi = diZhi[(currentYear - 4) % 12];
  const nextYearGan = tianGan[(currentYear - 3) % 10];
  const nextYearZhi = diZhi[(currentYear - 3) % 12];

  if (currentDayun) {
    L.push('### 当前大运');
    L.push('');
    L.push(`你正处于 **${currentDayun.step.startAge}-${currentDayun.step.endAge}岁 ${colored(currentDayun.step.gan)}${colored(currentDayun.step.zhi)}** 大运中。`);
    L.push('');
    L.push(`- **前5年（${currentDayun.step.startAge}-${currentDayun.step.startAge + 4}岁）**: ${currentDayun.step.gan}${currentDayun.step.ganShishen}主事 — ${currentDayun.ganJudgment}`);
    L.push(`- **后5年（${currentDayun.step.startAge + 5}-${currentDayun.step.endAge}岁）**: ${currentDayun.step.zhi}${currentDayun.step.zhiShishen}主事 — ${currentDayun.zhiJudgment}`);
    if (currentDayun.interactions.length > 0) {
      L.push(`- **与命局互动**: ${currentDayun.interactions.join('；')}`);
    }
    L.push('');
  }

  L.push('### 流年分析');
  L.push('');
  L.push(`#### ${currentYear}年 — ${thisYearGan}${thisYearZhi}年`);
  L.push('');

  // 简单流年判断
  const thisYearEl = WX_MAP[thisYearGan] ?? '';
  const isLiuNianYong = yongShenResult.final.xiShen.includes(thisYearEl) || yongShenResult.final.yongShen === thisYearEl;
  const isLiuNianJi = yongShenResult.final.jiShen.includes(thisYearEl);
  const liunianLabel = isLiuNianYong ? '✅ 用神年' : isLiuNianJi ? '⚠️ 忌神年' : '➖ 平年';

  L.push(`流年干支 ${colored(thisYearGan)}${colored(thisYearZhi)}，天干${thisYearEl}${liunianLabel}。`);
  if (currentDayun) {
    const dayunGanEl = WX_MAP[currentDayun.step.gan] ?? '';
    const dayunZhiEl = WX_MAP[currentDayun.step.zhi] ?? '';
    L.push(`大运${colored(currentDayun.step.gan)}${colored(currentDayun.step.zhi)}与流年互动，需结合大运走势综合判断。`);
  }
  L.push('');

  L.push(`#### ${currentYear + 1}年 — ${nextYearGan}${nextYearZhi}年（预告）`);
  const nextYearEl = WX_MAP[nextYearGan] ?? '';
  const isNextYong = yongShenResult.final.xiShen.includes(nextYearEl) || yongShenResult.final.yongShen === nextYearEl;
  L.push(`明年天干${nextYearEl}，${isNextYong ? '用神到位，值得期待' : '需要提前规划，做好准备'}。`);
  L.push('');

  if (nextDayun) {
    L.push('### 下一大运预告');
    L.push('');
    L.push(`**${nextDayun.step.startAge}-${nextDayun.step.endAge}岁 ${colored(nextDayun.step.gan)}${colored(nextDayun.step.zhi)}** — ${nextDayun.ganJudgment} / ${nextDayun.zhiJudgment}`);
    L.push('');
  }

  // ═══════════════════════════════════════════════════
  // 第七章  趋吉避凶
  // ═══════════════════════════════════════════════════
  L.push('## 第七章  趋吉避凶');
  L.push('');

  const directionMap: Record<string, string> = { '木': '东方', '火': '南方', '土': '中央/本地', '金': '西方', '水': '北方' };
  const colorMap: Record<string, string> = { '木': '绿色/青色', '火': '红色/紫色', '土': '黄色/棕色', '金': '白色/金色', '水': '黑色/蓝色' };
  const industryMap: Record<string, string> = {
    '木': '教育/出版/医疗/环保/农业', '火': '能源/餐饮/互联网/传媒/娱乐',
    '土': '房地产/建筑/金融/农业/矿产', '金': '法律/军警/机械/金融/汽车',
    '水': '物流/贸易/旅游/咨询/渔业',
  };
  const animalMap: Record<string, string> = {
    '木': '虎/兔', '火': '蛇/马', '土': '龙/狗/牛/羊', '金': '猴/鸡', '水': '鼠/猪',
  };

  const yEl1 = yongShenResult.final.yongShen;
  const jiEl1 = jiEls[0] || '';
  const yongXiDisplay = yongXiUniq.join('、');

  L.push('| 维度 | ✅ 有利 | ⚠️ 注意 |');
  L.push('|------|---------|---------|');
  L.push(`| 五行 | ${yongXiDisplay} | ${jiEls.join('、') || '—'} |`);
  L.push(`| 行业 | ${industryMap[yEl1] || yEl1 + '属性行业'} | ${industryMap[jiEl1] || (jiEl1 ? jiEl1 + '属性行业' : '—')} |`);
  L.push(`| 方位 | ${directionMap[yEl1] || yEl1} | ${jiEls.map((e: string) => directionMap[e] || e).join('、') || '—'} |`);
  L.push(`| 颜色 | ${colorMap[yEl1] || yEl1} | ${jiEls.map((e: string) => colorMap[e] || e).join('、') || '—'} |`);
  L.push(`| 贵人 | 属${animalMap[yEl1] || yEl1} | — |`);
  L.push(`| 季节 | ${yEl1 === '木' ? '春' : yEl1 === '火' ? '夏' : yEl1 === '金' ? '秋' : yEl1 === '水' ? '冬' : '四季'}季 | — |`);
  L.push('');

  // ═══════════════════════════════════════════════════
  // 附录
  // ═══════════════════════════════════════════════════
  L.push('## 附录');
  L.push('');

  // 计分详情
  L.push('<details>');
  L.push('<summary>📊 五行计分详情</summary>');
  L.push('');
  if (scoreData) {
    const scores = (yongShenResult.fuyi as any).elementScores || scoreData.elementScores;
    const clrMap: Record<string, string> = { '木': '#4CAF50', '火': '#F44336', '土': '#8B4513', '金': '#DAA520', '水': '#2196F3' };
    const scoreEntries = (Object.entries(scores) as [string, number][]).sort((a, b) => b[1] - a[1]);
    const scoreLine = scoreEntries.map(([el, v]) => `<span style="color:${clrMap[el] ?? '#000'}">${el}${v.toFixed(1)}</span>`).join('  ');
    L.push(`**五行力量**: ${scoreLine} | 日主${(yongShenResult.fuyi as any).dayScore?.toFixed(1) ?? scoreData.dayScore?.toFixed(1) ?? '?'}分`);
    L.push('');
    for (const d of (yongShenResult.fuyi.details || [])) {
      L.push(`- ${d}`);
    }
  }
  L.push('');
  L.push('</details>');
  L.push('');

  // 古籍参考
  const classicalRefs = (yongShenResult.engines ?? [])
    .flatMap((e: any) => (e.diagnostics || []).map((d: string) => ({ engine: e.name, text: d })))
    .filter((r: any) => /穷通宝鉴|滴天髓|子平真诠|神峰通考|渊海子平|三命通会/.test(r.text));
  if (classicalRefs.length > 0) {
    L.push('<details>');
    L.push('<summary>📖 古籍参考</summary>');
    L.push('');
    const sources = ['穷通宝鉴', '滴天髓', '子平真诠', '神峰通考', '渊海子平', '三命通会'];
    for (const src of sources) {
      const refs = classicalRefs.filter((r: any) => r.text.includes(src));
      if (refs.length === 0) continue;
      L.push(`**${src}**`);
      for (const r of refs) L.push(`- ${r.text}`);
      L.push('');
    }
    L.push('</details>');
    L.push('');
  }

  // AI 深度解读（--ai 启用时）
  if (!birthInfo?.skipAi) {
    const aiData = (precomputed as any)?.aiResult;
    if (aiData?.yuanju) {
      L.push('## 第八章  AI 深度解读');
      L.push('');
      L.push('> 🤖 以下内容由 AI 模型生成，仅供参考。命理分析的核心结论以上述规则引擎产出为准。');
      L.push('');
      const clean = (s: string) => s.replace(/^###[^\n]*\n?/gm, '').trim();
      L.push('### 原局分析');
      L.push('');
      L.push(clean(aiData.yuanju));
      L.push('');
      if (aiData.dayun) {
        L.push('### 大运解读');
        L.push('');
        L.push(clean(aiData.dayun));
        L.push('');
      }
      if (aiData.liunian) {
        L.push('### 流年解读');
        L.push('');
        L.push(clean(aiData.liunian));
        L.push('');
      }
    }
  }

  L.push('---');
  L.push(`*报告由 Bazi-Destiny 命理分析系统生成 · ${n}*`);
  L.push('');
  L.push('> ⚠️ 免责声明：本报告仅供学习参考，不构成任何决策建议。命理分析是概率性工具，人生选择仍需结合实际情况理性判断。');
  L.push('');

  return L.join('\n');
}

/**
 * Narrative generation via Anthropic Claude API.
 * Generates 格局综述, 大运评价, 流年评价 based on structured analysis data.
 */
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

export interface NarrativeInput {
  pattern: string;
  yongShen: {
    yongShen: string;
    xiShen: string[];
    jiShen: string[];
    methods: Array<{ method: string; yongShen: string; reason: string }>;
  };
  /** System-determined final result — AI must follow this */
  finalYongShen: string;
  finalXiShen: string[];
  finalJiShen: string[];
  dayStrength: string;
  pillars: Record<string, string>;
  dayun: Array<{ age: string; ganZhi: string; tenGod: string }>;
  currentDayun: string;
  currentYear: string;
  liunian: string;
  dimensions: Record<string, string[]>;
  interactions: {
    gans: string[];
    zhis: string[];
    dayunEffects: string[];
  };
}

export async function generateNarratives(input: NarrativeInput & { name?: string }): Promise<{
  yuanjuEvaluation: string;
  dayunEvaluation: string;
  liunianEvaluation: string;
}> {
  // If name provided, read system result from data/ as authoritative source
  if (input.name) {
    try {
      const fs = await import('fs');
      const sysFile = `data/${input.name}/system-result.json`;
      if (fs.existsSync(sysFile)) {
        const sys = JSON.parse(fs.readFileSync(sysFile, 'utf-8'));
        // Override all fields from authoritative file
        input.finalYongShen = sys.yongShen ?? input.finalYongShen;
        input.finalXiShen = sys.final?.xiShen ?? input.finalXiShen;
        input.finalJiShen = sys.final?.jiShen ?? input.finalJiShen;
        input.dayStrength = sys.dayStrength ?? input.dayStrength;
        input.pattern = sys.pattern ?? input.pattern;
        // Reconstruct四柱 strings from pillar data
        if (sys.pillars) {
          const formatPillar = (p: { gan: string; zhi: string; shishen: string } | undefined) =>
            p ? `${p.gan}${p.zhi} ${p.shishen}` : '';
          const nayinMap: Record<string, string> = {};
          // Preserve existing nayin if available
          for (const [k, v] of Object.entries(input.pillars)) {
            const parts = v.split(' '); if (parts.length >= 2) nayinMap[k] = parts.slice(2).join(' ');
          }
          input.pillars = {
            '年柱': formatPillar(sys.pillars.年柱) + (nayinMap['年柱'] ? ' ' + nayinMap['年柱'] : ''),
            '月柱': formatPillar(sys.pillars.月柱) + (nayinMap['月柱'] ? ' ' + nayinMap['月柱'] : ''),
            '日柱': formatPillar(sys.pillars.日柱) + (nayinMap['日柱'] ? ' ' + nayinMap['日柱'] : ''),
            '时柱': formatPillar(sys.pillars.时柱) + (nayinMap['时柱'] ? ' ' + nayinMap['时柱'] : ''),
          };
        }
        // Reconstruct大运 from file
        if (sys.dayun?.steps) {
          input.dayun = sys.dayun.steps.map((s: { startAge: number; endAge: number; gan: string; zhi: string; ganShishen: string; zhiShishen: string }) => ({
            age: `${s.startAge}-${s.endAge}`,
            ganZhi: `${s.gan}${s.zhi}`,
            tenGod: `${s.ganShishen}/${s.zhiShishen}`,
          }));
        }
      }
    } catch { /* fall through to inline data */ }
  }
  const context = buildContext(input);

  const [yuanjuEvaluation, dayunEvaluation, liunianEvaluation] = await Promise.all([
    callClaude(`你是一位专业八字命理师。根据【系统判断结果】和命盘数据，写一段150-250字的原局评价。

⚠️ 重要：只讨论【命盘数据】中列出的实际四柱天干地支。古籍引用中的干支（如"首选甲"）是理论推荐，不代表命盘中有。不要捏造不存在的天干地支。

要求覆盖五个方面：1.格局成败—格局是否成立？高低如何？有何缺陷？ 2.日主强弱—身强还是身弱？依据是什么？ 3.用神喜忌—用神是什么？为什么？喜神和忌神分别代表什么？ 4.五行流通—五行是否齐全？缺什么？流通断在哪里？ 5.刑冲会合—地支关系对命局的整体影响。

必须引用系统给出的用神/喜忌/忌神结论，不得自行重新判断。不要套话，用中文。

${context}`),
    callClaude(`你是一位专业八字命理师。根据【系统判断结果】和命盘数据，写一段150-250字的大运评价。

要求分三段：1.当前大运（重点）—当前在哪个大运？干支是什么？对用神/喜忌的影响？是好运还是坏运？为什么？ 2.回顾已过—命主已经历哪些大运？关键趋势？ 3.展望未来—下一个大运趋势？哪个大运最佳？哪个需要警惕？

判断标准：大运干支为用神/喜神→好运；为忌神→坏运；天干喜地支忌→先好后差；天干忌地支喜→先差后好；与原局刑冲→注意变动。

${context}`),
    callClaude(`你是一位专业八字命理师。根据【系统判断结果】和命盘数据，写一段150-250字的流年评价。

重点分析${input.currentYear}年${input.liunian}：1.流年干支是用神/喜神还是忌神？ 2.岁运关系—流年与大运是战/冲/和/好？ 3.流年与原局的刑冲合会—哪个柱被冲/合/刑？ 4.具体影响—事业/财运/婚姻/健康，哪个领域最受影响？ 5.给出具体行动建议。

必须引用系统给出的用神/喜忌/忌神结论来判断吉凶。

${context}`),
  ]);

  return { yuanjuEvaluation, dayunEvaluation, liunianEvaluation };
}

function buildContext(input: NarrativeInput): string {
  // Extract stems from pillar strings for explicit listing
  const stems = Object.entries(input.pillars).map(([k, v]) => v.split(' ')[0]);
  // Compute五行动态 from四柱天干地支
  const ganWx: Record<string,string> = {'甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水'};
  const zhiWx: Record<string,string> = {'寅':'木','卯':'木','巳':'火','午':'火','申':'金','酉':'金','亥':'水','子':'水','辰':'土','戌':'土','丑':'土','未':'土'};
  const allWx = new Set<string>();
  for (const v of Object.values(input.pillars)) {
    const parts = v.split(' ');
    const gan = parts[0]?.[0] ?? '';
    const zhi = parts[0]?.[1] ?? '';
    if (ganWx[gan]) allWx.add(ganWx[gan]);
    if (zhiWx[zhi]) allWx.add(zhiWx[zhi]);
  }
  const allElements = ['木','火','土','金','水'];
  const present = allElements.filter(e => allWx.has(e));
  const missing = allElements.filter(e => !allWx.has(e));
  return `
【系统判断结果 — 必须以此为准】
用神: ${input.finalYongShen}
喜神: ${input.finalXiShen.join('、')}
忌神: ${input.finalJiShen.join('、')}
日主强弱: ${input.dayStrength}

【命盘数据 — 以下为命盘实际存在的干支，分析时只引用这些】
格局: ${input.pattern}
四柱天干: ${stems.join(' ')}
四柱: 年${input.pillars['年柱']} 月${input.pillars['月柱']} 日${input.pillars['日柱']} 时${input.pillars['时柱']}
五行现状: 有${present.join('、') || '无'}，缺${missing.join('、') || '无'}

【用神分析参考 — 注意：古籍引用（如"首选甲""次选丙"）是理论推荐，不代表命盘中实际存在这些天干】
${input.yongShen.methods.map(m => `- ${m.method}: ${m.yongShen} — ${m.reason}`).join('\n')}

【大运】
当前大运: ${input.currentDayun}
${input.dayun.map(d => `- ${d.age}岁: ${d.ganZhi} ${d.tenGod}`).join('\n')}

【当前流年】${input.currentYear}年 流年${input.liunian}

【天干互动】${input.interactions.gans.join('; ')}
【地支互动】${input.interactions.zhis.join('; ')}
【大运影响】${input.interactions.dayunEffects.join('; ')}
【十维度】${Object.entries(input.dimensions).map(([dim, notes]) => dim + ':' + notes.join(';')).join(' | ')}
`;
}

async function callClaude(prompt: string): Promise<string> {
  const model = process.env.BAZI_LLM_MODEL || 'claude-sonnet-4-6';
  const msg = await anthropic.messages.create({
    model,
    max_tokens: 1024,
    temperature: 0.3,
    system: `你是一位专业八字命理师。

【核心铁律】
1. 只讨论命盘中实际存在的干支。四柱天干地支是按【命盘数据】列出的，不得臆造、推断或引用不存在的天干地支。
2. 【用神分析参考】中引用的古籍内容（如"首选甲""次选丙"等）是古典理论的推荐，不代表命盘中有这些天干。切勿将其当作命盘实际存在的元素来分析。
3. 【系统判断结果】是用神/喜忌/强弱的确定性结论，必须以此为准，不得推翻或重新判断。
4. 你的任务是：基于系统结论和命盘实际数据，用流畅中文写出有洞察的分析。输出具体，不套话，不加前缀。`,
    messages: [{ role: 'user', content: prompt }],
  });

  for (const block of msg.content) {
    if (block.type === 'text') return cleanPunctuation(block.text);
  }
  return '';
}

function cleanPunctuation(text: string): string {
  return text
    .replace(/。；/g, '；')
    .replace(/；。/g, '；')
    .replace(/。。/g, '。')
    .replace(/，，/g, '，')
    .replace(/：：/g, '：')
    .replace(/、、/g, '、')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * AI 分析引擎 — 原局/大运/流年
 *
 * Prompt 从 content/ai-prompts.json 加载，系统数据自动填入占位符。
 * 修改提示词只需改 JSON，不动此文件。
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const anthropic = new Anthropic();

// ── 类型 ──────────────────────────────────────────

export interface AiInput {
  chartData: string;
  scoreData: string;
  analysisData: string;
  specialtySummary: string;
  currentDayun: string;
  nextDayun: string;
  dayunInteractions: string;
  liunianData: string;
  currentDayunContext: string;
  yongShen: string;
  xiShen: string[];
  jiShen: string[];
  dayStrength: string;
}

export interface AiResult {
  yuanju: string;
  dayun: string;
  liunian: string;
}

// ── 加载配置 ──────────────────────────────────────

let _prompts: any = null;
function prompts(): any {
  if (!_prompts) {
    _prompts = JSON.parse(readFileSync(join(__dirname, 'content', 'ai-prompts.json'), 'utf-8'));
  }
  return _prompts;
}

function fillTemplate(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [k, v] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
  }
  return result;
}

// ── 核心函数 ─────────────────────────────────────

async function callClaude(prompt: string, maxTokens = 1024): Promise<string> {
  const model = process.env.BAZI_LLM_MODEL || 'claude-sonnet-4-6';
  const msg = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
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
    if (block.type === 'text') return block.text;
  }
  return '';
}


function formatList(items: string[]): string {
  return items.join('、');
}

// ── 三个分析函数 ─────────────────────────────────

async function generateYuanju(input: AiInput): Promise<string> {
  const p = prompts().yuanju;
  const userPrompt = fillTemplate(p.userPromptTemplate, {
    chartData: input.chartData,
    scoreData: input.scoreData,
    analysisData: input.analysisData,
    specialtySummary: input.specialtySummary,
    wordLimit: p.wordLimit,
  });
  return callClaude(p.systemPrompt + '\n\n' + userPrompt, 2048);
}

async function generateDayun(input: AiInput): Promise<string> {
  const p = prompts().dayun;
  const userPrompt = fillTemplate(p.userPromptTemplate, {
    currentDayun: input.currentDayun,
    nextDayun: input.nextDayun,
    yongShen: input.yongShen,
    xiShen: formatList(input.xiShen),
    jiShen: formatList(input.jiShen),
    dayStrength: input.dayStrength,
    dayunInteractions: input.dayunInteractions,
    wordLimit: p.wordLimit,
  });
  return callClaude(p.systemPrompt + '\n\n' + userPrompt, 1536);
}

async function generateLiunian(input: AiInput): Promise<string> {
  const p = prompts().liunian;
  const userPrompt = fillTemplate(p.userPromptTemplate, {
    liunianData: input.liunianData,
    yongShen: input.yongShen,
    xiShen: formatList(input.xiShen),
    jiShen: formatList(input.jiShen),
    dayStrength: input.dayStrength,
    currentDayunContext: input.currentDayunContext,
    wordLimit: p.wordLimit,
  });
  return callClaude(p.systemPrompt + '\n\n' + userPrompt, 1536);
}

/** 并行调用三个 AI 分析，返回结果 */
export async function generateAiAnalyses(input: AiInput): Promise<AiResult> {
  const [yuanju, dayun, liunian] = await Promise.all([
    generateYuanju(input).catch(e => `原局分析生成失败: ${(e as Error).message}`),
    generateDayun(input).catch(e => `大运分析生成失败: ${(e as Error).message}`),
    generateLiunian(input).catch(e => `流年分析生成失败: ${(e as Error).message}`),
  ]);
  return { yuanju, dayun, liunian };
}

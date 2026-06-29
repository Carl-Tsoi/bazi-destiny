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

async function callClaude(systemPrompt: string, userPrompt: string): Promise<string> {
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 600,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });
  const block = msg.content[0];
  return block?.type === 'text' ? block.text : '';
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
  return callClaude(p.systemPrompt, userPrompt);
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
  return callClaude(p.systemPrompt, userPrompt);
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
  return callClaude(p.systemPrompt, userPrompt);
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

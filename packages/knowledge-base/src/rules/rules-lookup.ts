import type { ClassicalRule } from './rules.js';
import { ALL_RULES } from './rules.js';

export interface SearchInput {
  pattern: string;
  keywords: string[];
  limit?: number;
}

export function cite(input: SearchInput): string {
  const { pattern, keywords = [], limit = 5 } = input;
  const results: Array<{ rule: ClassicalRule; score: number }> = [];

  for (const rule of ALL_RULES) {
    if (pattern && !rule.pattern.includes(pattern) && !pattern.includes(rule.pattern)) continue;
    let score = 0;
    for (const kw of keywords) {
      for (const cond of rule.conditions) {
        if (cond.includes(kw) || kw.includes(cond)) { score++; break; }
      }
    }
    if (rule.pattern === pattern) score += 2;
    if (score > 0) results.push({ rule, score });
  }

  results.sort((a, b) => b.score - a.score);
  if (results.length === 0) return '（未找到相关古籍记载）';

  return results.slice(0, limit).map(r => {
    const src = r.rule.source.chapter
      ? `《${r.rule.source.book}·${r.rule.source.chapter}》`
      : `《${r.rule.source.book}》`;
    return `${src}: ${r.rule.conclusion}`;
  }).join('\n\n');
}

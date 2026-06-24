/**
 * Independent quality evaluator — based on mingli-skills evaluator.md
 * Checks generated reports for consistency, completeness, and quality.
 */

export interface EvalResult {
  passed: string[];
  failed: Array<{ item: string; issue: string; fix: string }>;
  grade: 'A' | 'B' | 'C' | 'D';
  summary: string;
}

export interface EvalInput {
  dayStrength: string;
  pattern: string;
  yongShen: { yongShen: string; xiShen: string[]; jiShen: string[] };
  dayunSteps: Array<{ startAge: number; endAge: number }>;
  birthYear: number;
  specialty: { career: string[]; wealth: string[]; marriage: string[]; health: string[] };
}

export function evaluate(input: EvalInput): EvalResult {
  const passed: string[] = [];
  const failed: Array<{ item: string; issue: string; fix: string }> = [];

  // 1. Internal consistency: dayStrength ↔ pattern ↔ yongShen
  const isStrong = input.dayStrength.includes('强') || input.dayStrength.includes('旺');
  const isWeak = input.dayStrength.includes('弱');

  // Check: pattern's恶格逆用 logic
  if (input.pattern.includes('伤官')) {
    const gejuGood = isStrong
      ? (input.yongShen.xiShen.includes('木') || input.yongShen.yongShen === '财') // 身旺伤官→生财
      : input.yongShen.xiShen.includes('土') || input.yongShen.yongShen === '印';  // 身弱伤官→佩印
    if (gejuGood) {
      passed.push('内部一致性: 伤官格身' + (isStrong ? '旺取财' : '弱取印') + '，与用神一致');
    } else {
      failed.push({ item: '内部一致性', issue: `伤官格${isStrong ? '身旺' : '身弱'}但用神喜忌不匹配`, fix: '检查格局法与扶抑法是否统一' });
    }
  } else {
    passed.push('内部一致性: 格局与用神无冲突');
  }

  // Check: weak day master should not have克泄用神
  if (isWeak && (input.yongShen.yongShen === '克泄' || input.yongShen.yongShen === '泄')) {
    failed.push({ item: '内部一致性', issue: '日主偏弱但用神为克泄', fix: '身弱应用生扶（印比），检查扶抑法是否正确' });
  } else {
    passed.push('内部一致性: 日主强弱与用神方向一致');
  }

  // 2. Dayun coverage: must include current age decade
  const now = new Date();
  const age = now.getFullYear() - input.birthYear;
  const currentDayunCovered = input.dayunSteps.some(s => age >= s.startAge && age <= s.endAge);
  if (currentDayunCovered) {
    passed.push('大运覆盖度: 当前大运已覆盖');
  } else {
    failed.push({ item: '大运覆盖度', issue: `命主${age}岁所在的大运未在分析中覆盖`, fix: '确保大运分析覆盖当前年龄所在的大运' });
  }

  // 3. Reference chain: specialty should reference pattern/yongShen
  let specialtyRefsPattern = false;
  const allSpecialty = [...input.specialty.career, ...input.specialty.wealth];
  for (const s of allSpecialty) {
    if (s.includes('格局') || s.includes('用神') || s.includes('喜') || s.includes('忌')) {
      specialtyRefsPattern = true;
      break;
    }
  }
  if (specialtyRefsPattern) {
    passed.push('引用链: 专项断事引用了格局/用神结论');
  } else {
    failed.push({ item: '引用链', issue: '专项断事未引用格局或用神结论', fix: '事业/财运分析应引用格局和用神喜忌' });
  }

  // 4. 禁止项: no extreme claims
  const extremeWords = ['必定', '绝对', '一生悲惨', '大富大贵', '贵不可言绝对'];
  let hasExtreme = false;
  for (const s of allSpecialty) {
    if (extremeWords.some(w => s.includes(w))) { hasExtreme = true; break; }
  }
  if (!hasExtreme) {
    passed.push('禁止项: 无极端断语');
  } else {
    failed.push({ item: '禁止项', issue: '包含极端断语', fix: '改为程度描述，避免绝对化' });
  }

  // 5. 调候 consistency: winter births need fire/warmth
  let hasTiaoHou = false;
  for (const s of [...input.specialty.career, ...input.specialty.health]) {
    if (s.includes('调候') || s.includes('暖') || s.includes('寒') || s.includes('火')) hasTiaoHou = true;
  }
  if (hasTiaoHou) {
    passed.push('调候一致性: 专项分析考虑了调候因素');
  } // Not a hard fail, just note

  // Grade
  const passCount = passed.length;
  let grade: 'A' | 'B' | 'C' | 'D';
  let summary: string;
  if (passCount >= 5) { grade = 'A'; summary = '逻辑严密，关键一致性检查通过。'; }
  else if (passCount >= 3) { grade = 'B'; summary = '小瑕疵不影响核心结论。'; }
  else if (passCount >= 1) { grade = 'C'; summary = '核心结论可能有误，需修正后重新审查。'; }
  else { grade = 'D'; summary = '建议重做分析。'; }

  return { passed, failed, grade, summary };
}

export function renderEvaluation(result: EvalResult): string {
  const lines: string[] = [];
  lines.push('## 质量评估');
  lines.push('');
  lines.push(`**评级: ${result.grade}** — ${result.summary}`);
  lines.push('');
  if (result.passed.length > 0) {
    lines.push('### 通过项');
    for (const p of result.passed) lines.push(`- ✅ ${p}`);
    lines.push('');
  }
  if (result.failed.length > 0) {
    lines.push('### 需修正');
    for (const f of result.failed) lines.push(`- ❌ **${f.item}**: ${f.issue} → ${f.fix}`);
    lines.push('');
  }
  return lines.join('\n');
}

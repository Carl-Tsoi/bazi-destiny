/**
 * cross-validator — Three-system consensus extraction engine
 *
 * Takes BaziChart, ZiweiChart, WesternChart and compares them
 * across common dimensions (财富/事业/健康/感情/综合).
 * Outputs a ConsensusReport with confidence levels.
 */
import type { BaziChart, ZiweiChart, WesternChart } from '@bazi-destiny/core';

// ── Dimension & Signal Types ──────────────────────────────────────

/** Common analysis dimensions shared by all three systems */
export type Dimension = 'wealth' | 'career' | 'health' | 'relationships' | 'overall';
export const ALL_DIMENSIONS: Dimension[] = ['wealth', 'career', 'health', 'relationships', 'overall'];

/** Signal strength from a single engine for a single dimension */
export type SignalStrength = 'strong_positive' | 'positive' | 'neutral' | 'negative' | 'strong_negative';

export interface DimensionSignal {
  dimension: Dimension;
  strength: SignalStrength;
  /** Human-readable evidence: WHY this engine gave this signal */
  evidence: string[];
}

/** Consensus level across engines */
export type ConsensusLevel = 'full' | 'partial' | 'divergent';

export interface DimensionConsensus {
  dimension: Dimension;
  level: ConsensusLevel;
  bazi: DimensionSignal | null;
  ziwei: DimensionSignal | null;
  astrology: DimensionSignal | null;
  /** Engines that agree (2-3 names) */
  agreeing: string[];
  summary: string;
}

export interface ConsensusReport {
  dimensions: DimensionConsensus[];
  overallConsensus: ConsensusLevel;
  overallSummary: string;
  /** Count of full/partial/divergent dimensions */
  stats: {
    full: number;
    partial: number;
    divergent: number;
  };
}

// ── Signal Extraction ─────────────────────────────────────────────

/**
 * Extract wealth signal from Bazi chart.
 * Rules: 正财/偏财 十神 strength, 财星得令, 财库 etc.
 * PLACEHOLDER — user should refine based on their school.
 */
function baziWealthSignal(chart: BaziChart): DimensionSignal {
  const evidence: string[] = [];
  let score = 0;

  // Check dayun for current decade wealth indicators
  const currentDecade = chart.dayun.steps[0]; // first step = birth decade
  if (currentDecade) {
    if (currentDecade.ganShishen.includes('财')) { score += 2; evidence.push(`大运天干${currentDecade.gan}为${currentDecade.ganShishen}`); }
    if (currentDecade.zhiShishen.includes('财')) { score += 1; evidence.push(`大运地支${currentDecade.zhi}为${currentDecade.zhiShishen}`); }
  }

  // Check pillars for wealth stars
  for (const [pos, p] of Object.entries(chart.pillars)) {
    if (p.shishen.includes('财')) {
      score += 1;
      evidence.push(`${pos}${p.gan}${p.zhi}十神${p.shishen}`);
    }
  }

  const strength: SignalStrength = score >= 3 ? 'strong_positive' : score >= 2 ? 'positive' : score <= 0 ? 'neutral' : 'positive';
  return { dimension: 'wealth', strength, evidence };
}

function baziCareerSignal(chart: BaziChart): DimensionSignal {
  const evidence: string[] = [];
  let score = 0;

  if (chart.pattern && chart.pattern.length > 0) {
    evidence.push(`格局: ${chart.pattern}`);
    score += 2;
  }
  if (chart.yongShen && chart.yongShen.length > 0) {
    evidence.push(`用神: ${chart.yongShen}`);
    score += 1;
  }
  for (const [pos, p] of Object.entries(chart.pillars)) {
    if (p.shishen.includes('官') || p.shishen.includes('杀')) {
      score += 1;
      evidence.push(`${pos}${p.gan}${p.zhi}十神${p.shishen}`);
    }
  }
  const strength: SignalStrength = score >= 2 ? 'positive' : 'neutral';
  return { dimension: 'career', strength, evidence };
}

function baziHealthSignal(chart: BaziChart): DimensionSignal {
  const evidence: string[] = [];
  let score = 0;
  // Day master element balance check
  const dayElement = chart.pillars.日柱.gan;
  evidence.push(`日主${dayElement}`);
  // Simplified: check for clashes
  for (const [pos, p] of Object.entries(chart.pillars)) {
    if (p.shishen.includes('杀') || p.shishen.includes('伤')) {
      score -= 1;
      evidence.push(`${pos}十神${p.shishen}需注意`);
    }
  }
  const strength: SignalStrength = score < 0 ? 'negative' : 'neutral';
  return { dimension: 'health', strength, evidence };
}

function baziRelationshipsSignal(chart: BaziChart): DimensionSignal {
  const evidence: string[] = [];
  let score = 0;
  const dayPillar = chart.pillars.日柱;
  // Check day branch for 桃花
  if (['子', '午', '卯', '酉'].includes(dayPillar.zhi)) {
    evidence.push(`日支${dayPillar.zhi}为桃花`);
    score += 1;
  }
  for (const [pos, p] of Object.entries(chart.pillars)) {
    if (p.shishen.includes('财') && (pos === 'day' || pos === 'month')) {
      score += 1;
    }
  }
  const strength: SignalStrength = score >= 2 ? 'positive' : score >= 1 ? 'positive' : 'neutral';
  return { dimension: 'relationships', strength, evidence };
}

function baziOverallSignal(chart: BaziChart): DimensionSignal {
  const evidence: string[] = [];
  // Aggregate: check day master strength
  evidence.push(`日主${chart.pillars.日柱.gan}${chart.pillars.日柱.zhi}`);
  evidence.push(`格局${chart.pattern || '未定'}`);
  evidence.push(`起运${chart.dayun.startAgeYears}岁`);
  const strength: SignalStrength = chart.pattern ? 'positive' : 'neutral';
  return { dimension: 'overall', strength, evidence };
}

// ── Ziwei Signal Extraction ───────────────────────────────────────

function ziweiWealthSignal(chart: ZiweiChart): DimensionSignal {
  const evidence: string[] = [];
  let score = 0;
  const wealthPalace = chart.palaces.find(p => p.name === '财帛');
  if (wealthPalace) {
    const stars = [...wealthPalace.majorStars, ...wealthPalace.minorStars];
    if (stars.some(s => s.name === '武曲') || stars.some(s => s.name === '天府') || stars.some(s => s.name === '禄存') || stars.some(s => s.name === '太阴')) {
      score += 2;
      evidence.push(`财帛宫有${stars.filter(s => ['武曲','天府','禄存','太阴'].includes(s.name)).map(s => s.name).join('、')}`);
    }
    if (stars.some(s => s.name === '贪狼') || stars.some(s => s.name === '破军')) {
      score -= 1;
      evidence.push(`财帛宫有${stars.filter(s => ['贪狼','破军'].includes(s.name)).map(s => s.name).join('、')}需注意`);
    }
  }
  const strength: SignalStrength = score >= 2 ? 'strong_positive' : score >= 1 ? 'positive' : score < 0 ? 'negative' : 'neutral';
  return { dimension: 'wealth', strength, evidence };
}

function ziweiCareerSignal(chart: ZiweiChart): DimensionSignal {
  const evidence: string[] = [];
  let score = 0;
  const careerPalace = chart.palaces.find(p => p.name === '官禄');
  if (careerPalace) {
    const stars = [...careerPalace.majorStars, ...careerPalace.minorStars];
    if (stars.some(s => s.name === '紫微') || stars.some(s => s.name === '天府') || stars.some(s => s.name === '天相') || stars.some(s => s.name === '太阳')) {
      score += 2;
      evidence.push(`官禄宫有${stars.filter(s => ['紫微','天府','天相','太阳'].includes(s.name)).map(s => s.name).join('、')}`);
    }
  }
  const strength: SignalStrength = score >= 2 ? 'strong_positive' : score >= 1 ? 'positive' : 'neutral';
  return { dimension: 'career', strength, evidence };
}

function ziweiHealthSignal(chart: ZiweiChart): DimensionSignal {
  const evidence: string[] = [];
  const healthPalace = chart.palaces.find(p => p.name === '疾厄');
  if (healthPalace) {
    evidence.push(`疾厄宫主星: ${healthPalace.majorStars.map(s => s.name).join('、') || '无'}`);
  }
  return { dimension: 'health', strength: 'neutral', evidence };
}

function ziweiRelationshipsSignal(chart: ZiweiChart): DimensionSignal {
  const evidence: string[] = [];
  const spousePalace = chart.palaces.find(p => p.name === '夫妻');
  if (spousePalace) {
    evidence.push(`夫妻宫主星: ${spousePalace.majorStars.map(s => s.name).join('、') || '无'}`);
  }
  return { dimension: 'relationships', strength: 'neutral', evidence };
}

function ziweiOverallSignal(chart: ZiweiChart): DimensionSignal {
  const evidence: string[] = [];
  const mingPalace = chart.palaces.find(p => p.name === '命宫');
  if (mingPalace) {
    evidence.push(`命宫主星: ${mingPalace.majorStars.map(s => s.name).join('、')}`);
  }
  evidence.push(`生肖: ${chart.shengxiao}`);
  return { dimension: 'overall', strength: 'neutral', evidence };
}

// ── Western Astrology Signal Extraction ───────────────────────────

function astrologyWealthSignal(chart: WesternChart): DimensionSignal {
  const evidence: string[] = [];
  let score = 0;
  // Jupiter in 2nd or 8th house = wealth indicator
  const jupiter = chart.planets.find(p => p.name === 'Jupiter');
  const venus = chart.planets.find(p => p.name === 'Venus');
  if (jupiter && (jupiter.house === 2 || jupiter.house === 8)) {
    score += 2;
    evidence.push(`木星在第${jupiter.house}宫`);
  }
  if (venus && (venus.house === 2)) {
    score += 1;
    evidence.push(`金星在第${venus.house}宫`);
  }
  const strength: SignalStrength = score >= 2 ? 'positive' : score >= 1 ? 'positive' : 'neutral';
  return { dimension: 'wealth', strength, evidence };
}

function astrologyCareerSignal(chart: WesternChart): DimensionSignal {
  const evidence: string[] = [];
  let score = 0;
  const saturn = chart.planets.find(p => p.name === 'Saturn');
  const mars = chart.planets.find(p => p.name === 'Mars');
  if (saturn && saturn.house === 10) { score += 2; evidence.push('土星在第10宫(事业宫)'); }
  if (mars && mars.house === 10) { score += 1; evidence.push('火星在第10宫'); }
  const strength: SignalStrength = score >= 2 ? 'positive' : score >= 1 ? 'positive' : 'neutral';
  return { dimension: 'career', strength, evidence };
}

function astrologyHealthSignal(chart: WesternChart): DimensionSignal {
  const evidence: string[] = [];
  const mars = chart.planets.find(p => p.name === 'Mars');
  if (mars && (mars.house === 1 || mars.house === 6)) {
    evidence.push('火星在第1/6宫需关注健康');
  }
  return { dimension: 'health', strength: 'neutral', evidence };
}

function astrologyRelationshipsSignal(chart: WesternChart): DimensionSignal {
  const evidence: string[] = [];
  const venus = chart.planets.find(p => p.name === 'Venus');
  if (venus && venus.house === 7) { evidence.push('金星在第7宫(夫妻宫)'); }
  return { dimension: 'relationships', strength: venus?.house === 7 ? 'positive' : 'neutral', evidence };
}

function astrologyOverallSignal(chart: WesternChart): DimensionSignal {
  const evidence: string[] = [];
  evidence.push(`上升${chart.ascendant.sign}`);
  evidence.push(`天顶${chart.midheaven.sign}`);
  return { dimension: 'overall', strength: 'neutral', evidence };
}

// ── Consensus Calculation ─────────────────────────────────────────

const LABELS: Record<Dimension, string> = {
  wealth: '财运',
  career: '事业',
  health: '健康',
  relationships: '感情',
  overall: '综合',
};

function computeConsensus(dimension: Dimension, signals: (DimensionSignal | null)[]): DimensionConsensus {
  const valid = signals.filter((s): s is DimensionSignal => s !== null);
  const positives = valid.filter(s => s.strength === 'strong_positive' || s.strength === 'positive');
  const negatives = valid.filter(s => s.strength === 'strong_negative' || s.strength === 'negative');

  // Determine agreement
  let level: ConsensusLevel;
  let agreeing: string[] = [];
  let summary: string;

  if (positives.length >= 3) {
    level = 'full';
    agreeing = ['bazi', 'ziwei', 'astrology'];
    summary = `${LABELS[dimension]}: 三术一致看好`;
  } else if (negatives.length >= 3) {
    level = 'full';
    agreeing = ['bazi', 'ziwei', 'astrology'];
    summary = `${LABELS[dimension]}: 三术一致警示`;
  } else if (positives.length === 2) {
    level = 'partial';
    agreeing = ['bazi', 'ziwei', 'astrology'].filter((_, i) => signals[i]?.strength.includes('positive'));
    summary = `${LABELS[dimension]}: 两术看好，一术中立/谨慎`;
  } else if (negatives.length === 2) {
    level = 'partial';
    agreeing = ['bazi', 'ziwei', 'astrology'].filter((_, i) => signals[i]?.strength.includes('negative'));
    summary = `${LABELS[dimension]}: 两术警示，需关注`;
  } else {
    level = 'divergent';
    summary = `${LABELS[dimension]}: 三术结论分散，不确定性较高`;
  }

  return {
    dimension,
    level,
    bazi: signals[0],
    ziwei: signals[1],
    astrology: signals[2],
    agreeing,
    summary,
  };
}

// ── Public API ────────────────────────────────────────────────────

export function validate(bazi: BaziChart, ziwei: ZiweiChart, astrology: WesternChart): ConsensusReport {
  const dimensions: DimensionConsensus[] = [
    { dim: 'wealth' as const, fn0: baziWealthSignal, fn1: ziweiWealthSignal, fn2: astrologyWealthSignal },
    { dim: 'career' as const, fn0: baziCareerSignal, fn1: ziweiCareerSignal, fn2: astrologyCareerSignal },
    { dim: 'health' as const, fn0: baziHealthSignal, fn1: ziweiHealthSignal, fn2: astrologyHealthSignal },
    { dim: 'relationships' as const, fn0: baziRelationshipsSignal, fn1: ziweiRelationshipsSignal, fn2: astrologyRelationshipsSignal },
    { dim: 'overall' as const, fn0: baziOverallSignal, fn1: ziweiOverallSignal, fn2: astrologyOverallSignal },
  ].map(({ dim, fn0, fn1, fn2 }) => {
    const signals = [
      tryExtract(fn0, bazi),
      tryExtract(fn1, ziwei),
      tryExtract(fn2, astrology),
    ];
    return computeConsensus(dim, signals);
  });

  const fullCount = dimensions.filter(d => d.level === 'full').length;
  const partialCount = dimensions.filter(d => d.level === 'partial').length;
  const divergentCount = dimensions.filter(d => d.level === 'divergent').length;

  const overallConsensus: ConsensusLevel =
    fullCount >= 3 ? 'full' :
    divergentCount >= 3 ? 'divergent' :
    'partial';

  const overallSummary = overallConsensus === 'full'
    ? '三术在多个维度上达成一致，结论可信度较高。'
    : overallConsensus === 'partial'
    ? '三术在部分维度上一致，部分维度存在分歧。建议结合实际情况判断。'
    : '三术在多个维度上存在分歧，建议进一步分析或咨询命理师。';

  return {
    dimensions,
    overallConsensus,
    overallSummary,
    stats: { full: fullCount, partial: partialCount, divergent: divergentCount },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function tryExtract(fn: (chart: any) => DimensionSignal, chart: unknown): DimensionSignal | null {
  try { return fn(chart); } catch { return null; }
}

function signalLabel(s: SignalStrength): string {
  const map: Record<SignalStrength, string> = {
    strong_positive: '++',
    positive: '+',
    neutral: '○',
    negative: '-',
    strong_negative: '--',
  };
  return map[s];
}

/** Render consensus as ASCII table for CLI output */
export function renderConsensus(report: ConsensusReport): string {
  const lines: string[] = [];
  lines.push('╔══════════════════════════════════════════════════════════════════════╗');
  lines.push('║                 三 术 交 叉 验 证 报 告                              ║');
  lines.push('╠══════╤══════╤══════╤══════╤══════╤══════════════════════════════════╣');
  lines.push('║ 维度 │ 八字 │ 紫微 │ 占星 │ 一致 │ 结论                             ║');
  lines.push('╟──────┼──────┼──────┼──────┼──────┼──────────────────────────────────╢');

  const icons: Record<ConsensusLevel, string> = { full: '🟢', partial: '🟡', divergent: '🔴' };

  for (const d of report.dimensions) {
    const baziLabel = d.bazi ? signalLabel(d.bazi.strength) : '?';
    const ziweiLabel = d.ziwei ? signalLabel(d.ziwei.strength) : '?';
    const astroLabel = d.astrology ? signalLabel(d.astrology.strength) : '?';
    const icon = icons[d.level];
    const agreeStr = d.agreeing.length >= 2 ? d.agreeing.join('+') : '—';
    lines.push(`║ ${LABELS[d.dimension].padEnd(4)} │ ${baziLabel.padEnd(4)} │ ${ziweiLabel.padEnd(4)} │ ${astroLabel.padEnd(4)} │ ${agreeStr.padEnd(4)} │ ${icon} ${d.summary.padEnd(32)} ║`);
  }

  lines.push('╠══════╧══════╧══════╧══════╧══════╧══════════════════════════════════╣');
  lines.push(`║  综合: ${report.overallSummary.padEnd(62)} ║`);
  lines.push(`║  统计: 🟢${report.stats.full} 🟡${report.stats.partial} 🔴${report.stats.divergent}                                                    ║`);
  lines.push('╚══════════════════════════════════════════════════════════════════════╝');

  // Per-dimension evidence
  lines.push('');
  lines.push('评分依据:');
  for (const d of report.dimensions) {
    lines.push(`  [${LABELS[d.dimension]}]`);
    if (d.bazi) lines.push(`    八字: ${d.bazi.evidence.join('; ') || '无'}`);
    if (d.ziwei) lines.push(`    紫微: ${d.ziwei.evidence.join('; ') || '无'}`);
    if (d.astrology) lines.push(`    占星: ${d.astrology.evidence.join('; ') || '无'}`);
  }

  return lines.join('\n');
}

/** Render consensus as markdown for reports */
export function renderConsensusMarkdown(report: ConsensusReport): string {
  const lines: string[] = [];
  const icons: Record<ConsensusLevel, string> = { full: '🟢', partial: '🟡', divergent: '🔴' };

  lines.push('| 维度 | 八字 | 紫微 | 占星 | 一致 | 结论 |');
  lines.push('|------|------|------|------|------|------|');

  for (const d of report.dimensions) {
    const baziLabel = d.bazi ? signalLabel(d.bazi.strength) : '?';
    const ziweiLabel = d.ziwei ? signalLabel(d.ziwei.strength) : '?';
    const astroLabel = d.astrology ? signalLabel(d.astrology.strength) : '?';
    const icon = icons[d.level];
    lines.push(`| ${LABELS[d.dimension]} | ${baziLabel} | ${ziweiLabel} | ${astroLabel} | ${icon} | ${d.summary} |`);
  }

  lines.push('');
  lines.push('### 评分依据');
  for (const d of report.dimensions) {
    lines.push(`- **${LABELS[d.dimension]}**:`);
    if (d.bazi) lines.push(`  - 八字: ${d.bazi.evidence.join('; ') || '无'}`);
    if (d.ziwei) lines.push(`  - 紫微: ${d.ziwei.evidence.join('; ') || '无'}`);
    if (d.astrology) lines.push(`  - 占星: ${d.astrology.evidence.join('; ') || '无'}`);
  }

  return lines.join('\n');
}

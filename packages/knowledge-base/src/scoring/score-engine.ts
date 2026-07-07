/**
 * L3: 计分引擎
 * 输入: ChartResult (L2)
 * 输出: ScoreResult
 */
import { calculatePower } from './power-distribution.js';
import { activeVersion } from './climate.js';
import type { ChartResult, ScoreResult, ElementScores } from '../analysis/types.js';

export function scoreChart(chart: ChartResult): ScoreResult {
  const pillarArray = Object.values(chart.pillars).map(p => ({
    gan: p.gan,
    zhi: p.zhi,
    shishen: p.shishen,
    canggan: p.canggan,
  }));

  const power = calculatePower(pillarArray);

  return {
    elementScores: power.scores as unknown as ElementScores,
    dayScore: power.dayScore,
    dayStrength: power.dayStrength as '身强' | '身弱',
    ziDang: extractZiDang(power.details),
    yiDang: extractYiDang(power.details),
    details: power.details,
    climateVersion: activeVersion(),
  };
}

function extractZiDang(details: string[]): number {
  const line = details.find(d => d.startsWith('归日'));
  if (!line) return 0;
  // [-]? 吃负号：归日行格式 "自党=日-0.09+印...=<ziDang>"，末值可能为负；
  // 不加负号则 [\d.]+ 越过负值误抓同行的异党值。
  const m = line.match(/自党.*?[=＝]([-]?[\d.]+)/);
  return m ? parseFloat(m[1]) : 0;
}

function extractYiDang(details: string[]): number {
  const line = details.find(d => d.startsWith('归日'));
  if (!line) return 0;
  const m = line.match(/异党.*?[=＝]([-]?[\d.]+)/);
  return m ? parseFloat(m[1]) : 0;
}

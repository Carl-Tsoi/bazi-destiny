/**
 * Time sensitivity analysis — run all engines at ±1h and compare
 */
import type { BirthInfo, Result } from '@bazi-destiny/core';
import type { IDivinationEngine } from '@bazi-destiny/core';

export interface SensitivityResult {
  original: BirthInfo;
  minusOneHour: BirthInfo;
  plusOneHour: BirthInfo;
  // Each slot holds JSON output keyed by engine name
  results: {
    original: Record<string, unknown>;
    minusOneHour: Record<string, unknown>;
    plusOneHour: Record<string, unknown>;
  };
  errors: string[];
}

/** Shift a BirthInfo datetime by N hours */
function shiftTime(birthInfo: BirthInfo, hours: number): BirthInfo {
  const date = new Date(birthInfo.datetime);
  date.setHours(date.getHours() + hours);
  return {
    ...birthInfo,
    datetime: date.toISOString().replace(/\.\d{3}Z$/, ''),
  };
}

/** Run sensitivity analysis: original, ±1h */
export async function runSensitivity(
  birthInfo: BirthInfo,
  engines: Array<{ name: string; engine: IDivinationEngine<unknown> }>,
): Promise<SensitivityResult> {
  const minusOneHour = shiftTime(birthInfo, -1);
  const plusOneHour = shiftTime(birthInfo, 1);

  const cases = [
    { label: 'original', input: birthInfo },
    { label: 'minusOneHour', input: minusOneHour },
    { label: 'plusOneHour', input: plusOneHour },
  ];

  const results: SensitivityResult['results'] = {
    original: {},
    minusOneHour: {},
    plusOneHour: {},
  };
  const allErrors: string[] = [];

  for (const c of cases) {
    const engineResults = await Promise.allSettled(
      engines.map(e => e.engine.calculate(c.input)),
    );

    for (let i = 0; i < engines.length; i++) {
      const r = engineResults[i];
      const engineName = engines[i].name;

      if (r.status === 'fulfilled' && r.value.success) {
        results[c.label as keyof typeof results][engineName] = r.value.data;
      } else {
        const err = r.status === 'fulfilled' ? (r.value.success ? '' : r.value.error) : String(r.reason);
        allErrors.push(`[${c.label}][${engineName}] ${err}`);
      }
    }
  }

  return { original: birthInfo, minusOneHour, plusOneHour, results, errors: allErrors };
}

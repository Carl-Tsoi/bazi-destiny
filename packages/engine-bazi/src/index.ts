/**
 * engine-bazi — wraps @openfate/bazi-engine, implements IDivinationEngine<BaziChart>
 */
import type { BirthInfo, Result, IDivinationEngine } from '@bazi-destiny/core';
import { BaziChartSchema } from '@bazi-destiny/core';
import type { BaziChart as BaziOutput } from '@bazi-destiny/core';
import { detectPattern } from '@bazi-destiny/knowledge-base';

export class BaziEngine implements IDivinationEngine<BaziOutput> {
  async calculate(birthInfo: BirthInfo): Promise<Result<BaziOutput>> {
    try {
      const date = new Date(birthInfo.datetime);
      const { calculateBaziChart } = await import('@openfate/bazi-engine');

      // @openfate/bazi-engine expects:
      // - gender: 'male' | 'female' (lowercase)
      // - timezone: number (offset in hours, e.g. 8 for UTC+8)
      // - minute: number
      const raw = calculateBaziChart({
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        hour: date.getHours(),
        minute: date.getMinutes(),
        gender: birthInfo.gender === 'M' ? 'male' : 'female',
        // Only apply true solar time when longitude is provided (non-zero)
        ...(birthInfo.longitude !== 0 ? { longitude: birthInfo.longitude } : {}),
        timezone: 8, // UTC+8
      });

      const ps = raw.pillars;
      const chart: BaziOutput = {
        engine: 'bazi',
        birthInfo: {
          datetime: birthInfo.datetime,
          solarTerm: '',
          trueSolarTime: true,
        },
        pillars: {
          年柱: {
            gan: ps.year.stem,
            zhi: ps.year.branch,
            nayin: ps.year.naYin,
            shishen: ps.year.stemTenGod,
            canggan: ps.year.hiddenStems.map(h => ({ stem: h.stem, tenGod: h.tenGod })),
          },
          月柱: {
            gan: ps.month.stem,
            zhi: ps.month.branch,
            nayin: ps.month.naYin,
            shishen: ps.month.stemTenGod,
            canggan: ps.month.hiddenStems.map(h => ({ stem: h.stem, tenGod: h.tenGod })),
          },
          日柱: {
            gan: ps.day.stem,
            zhi: ps.day.branch,
            nayin: ps.day.naYin,
            shishen: ps.day.stemTenGod,
            canggan: ps.day.hiddenStems.map(h => ({ stem: h.stem, tenGod: h.tenGod })),
          },
          时柱: {
            gan: ps.hour?.stem ?? '',
            zhi: ps.hour?.branch ?? '',
            nayin: ps.hour?.naYin ?? '',
            shishen: ps.hour?.stemTenGod ?? '',
            canggan: ps.hour?.hiddenStems.map(h => ({ stem: h.stem, tenGod: h.tenGod })) ?? [],
          },
        },
        pattern: '',
        yongShen: '',
        shensha: {},
        dayun: {
          startAgeYears: raw.daYun.startAge,
          direction: raw.daYun.isForward ? 'forward' : 'reverse',
          steps: raw.daYun.cycles.map(c => ({
            startAge: c.startAge,
            endAge: c.endAge,
            gan: c.stem,
            zhi: c.branch,
            ganShishen: c.stemTenGod,
            zhiShishen: c.branchTenGod,
            nayin: '',
          })),
        },
      };

      // Auto-detect pattern (格局)
      const patternResult = detectPattern(chart);
      if (patternResult) {
        chart.pattern = patternResult.pattern;
      }

      // 用神/计分不再在Engine内计算，交由上层编排器调用 L3→L4

      // Zod validation
      BaziChartSchema.parse(chart);
      return { success: true, data: chart };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: `Bazi engine failed: ${message}` };
    }
  }
}

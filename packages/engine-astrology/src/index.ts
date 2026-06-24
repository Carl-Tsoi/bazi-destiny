/**
 * engine-astrology — wraps celestine, implements IDivinationEngine<WesternChart>
 */
import type { BirthInfo, Result, IDivinationEngine } from '@bazi-destiny/core';
import { WesternChartSchema } from '@bazi-destiny/core';
import type { WesternChart } from '@bazi-destiny/core';

export class AstrologyEngine implements IDivinationEngine<WesternChart> {
  async calculate(birthInfo: BirthInfo): Promise<Result<WesternChart>> {
    try {
      const date = new Date(birthInfo.datetime);
      const { calculateChart } = await import('celestine');

      const raw = calculateChart({
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        hour: date.getHours(),
        minute: date.getMinutes(),
        timezone: 8,
        latitude: birthInfo.latitude,
        longitude: birthInfo.longitude,
      });

      // Derive house for each planet from its longitude vs house cusps
      const cusps = raw.houses?.cusps?.map((c: { longitude: number }) => c.longitude) ?? [];

      const chart: WesternChart = {
        engine: 'astrology',
        birthInfo: {
          utcDatetime: raw.input ? `${raw.input.year}-${String(raw.input.month).padStart(2, '0')}-${String(raw.input.day).padStart(2, '0')}T${String(raw.input.hour).padStart(2, '0')}:${String(raw.input.minute ?? 0).padStart(2, '0')}:00Z` : birthInfo.datetime,
          latitude: birthInfo.latitude,
          longitude: birthInfo.longitude,
        },
        planets: (raw.planets ?? []).map((p) => ({
          name: p.name,
          sign: p.signName,
          house: this.getHouse(p.longitude, cusps),
          degrees: p.longitude,
          retrograde: p.isRetrograde,
        })),
        houses: {
          system: raw.houses?.system ?? 'Placidus',
          cusps,
        },
        ascendant: {
          sign: raw.angles?.ascendant?.signName ?? '',
          degrees: raw.angles?.ascendant?.longitude ?? 0,
        },
        midheaven: {
          sign: raw.angles?.midheaven?.signName ?? '',
          degrees: raw.angles?.midheaven?.longitude ?? 0,
        },
        aspects: (raw.aspects?.all ?? []).map((a) => ({
          planet1: a.body1,
          planet2: a.body2,
          type: a.type,
          orb: a.orb,
        })),
      };

      WesternChartSchema.parse(chart);
      return { success: true, data: chart };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: `Astrology engine failed: ${message}` };
    }
  }

  /** Determine which house a planet's longitude falls in */
  private getHouse(longitude: number, cusps: number[]): number {
    if (cusps.length < 12) return 0;
    for (let i = 11; i >= 0; i--) {
      if (longitude >= cusps[i]) return i + 1;
    }
    return 1; // fallback: before first cusp = house 1
  }
}

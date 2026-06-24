import { describe, it, expect } from 'vitest';
import { BaziEngine } from '../index.js';

const engine = new BaziEngine();

const cases = [
  {
    name: 'Case 1: 1983-01-12 17:00 深圳 男',
    datetime: '1983-01-12T17:00',
    latitude: 0,
    longitude: 0,
    timezone: 'Asia/Shanghai',
    gender: 'M' as const,
    expected: { year: '壬戌', month: '癸丑', day: '庚子', hour: '乙酉' },
  },
  {
    name: 'Case 2: 1992-12-27 06:05 女',
    datetime: '1992-12-27T06:05',
    latitude: 0,
    longitude: 0,
    timezone: 'Asia/Shanghai',
    gender: 'F' as const,
    expected: { year: '壬申', month: '壬子', day: '丁丑', hour: '癸卯' },
  },
  {
    name: 'Case 3: 1981-07-09 12:30 男',
    datetime: '1981-07-09T12:30',
    latitude: 0,
    longitude: 0,
    timezone: 'Asia/Shanghai',
    gender: 'M' as const,
    expected: { year: '辛酉', month: '乙未', day: '戊子', hour: '戊午' },
  },
  {
    name: 'Case 4: 1990-04-06 07:15 男',
    datetime: '1990-04-06T07:15',
    latitude: 0,
    longitude: 0,
    timezone: 'Asia/Shanghai',
    gender: 'M' as const,
    expected: { year: '庚午', month: '庚辰', day: '辛丑', hour: '壬辰' },
  },
  {
    name: 'Case 5: 1989-07-08 10:07 男',
    datetime: '1989-07-08T10:07',
    latitude: 0,
    longitude: 0,
    timezone: 'Asia/Shanghai',
    gender: 'M' as const,
    expected: { year: '己巳', month: '辛未', day: '己巳', hour: '己巳' },
  },
];

describe('BaziEngine snapshot tests', () => {
  for (const c of cases) {
    it(c.name, async () => {
      const result = await engine.calculate({
        datetime: c.datetime,
        latitude: c.latitude,
        longitude: c.longitude,
        timezone: c.timezone,
        gender: c.gender,
      });

      expect(result.success).toBe(true);
      if (!result.success) throw new Error('unreachable');

      const ps = result.data.pillars;
      expect(ps.年柱.gan + ps.年柱.zhi).toBe(c.expected.year);
      expect(ps.月柱.gan + ps.月柱.zhi).toBe(c.expected.month);
      expect(ps.日柱.gan + ps.日柱.zhi).toBe(c.expected.day);
      expect(ps.时柱.gan + ps.时柱.zhi).toBe(c.expected.hour);
    });
  }
});

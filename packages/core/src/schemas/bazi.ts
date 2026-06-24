import { z } from 'zod';

// Pillar: a single stem-branch pair
const PillarSchema = z.object({
  gan: z.string(),       // 天干: 甲,乙,丙,丁...
  zhi: z.string(),       // 地支: 子,丑,寅,卯...
  nayin: z.string(),     // 纳音五行: 海中金,炉中火...
  shishen: z.string(),   // 十神: 正官,七杀,正财...
  canggan: z.array(z.object({
    stem: z.string(),
    tenGod: z.string(),
  })), // 藏干（带十神）
});

// Shensha (特殊星煞)
const ShenshaSchema = z.record(z.string(), z.boolean());

// Dayun step (one 大运 decade)
const DayunStepSchema = z.object({
  startAge: z.number(),
  endAge: z.number(),
  gan: z.string(),
  zhi: z.string(),
  ganShishen: z.string(),
  zhiShishen: z.string(),
  nayin: z.string(),
});

// Liunian (流年 — one year)
const LiunianSchema = z.object({
  year: z.number(),
  gan: z.string(),
  zhi: z.string(),
  nayin: z.string(),
  relations: z.object({
    toDayun: z.array(z.string()),
    toYuanju: z.array(z.string()),
  }),
});

// Liuri (流日)
const LiuriSchema = z.object({
  date: z.string(),
  gan: z.string(),
  zhi: z.string(),
  nayin: z.string(),
});

// Full Bazi chart output
export const BaziChartSchema = z.object({
  engine: z.literal('bazi'),
  birthInfo: z.object({
    datetime: z.string(),
    solarTerm: z.string(),  // nearest solar term (节气)
    trueSolarTime: z.boolean(),
  }),
  pillars: z.object({
    年柱: PillarSchema,
    月柱: PillarSchema,
    日柱: PillarSchema,
    时柱: PillarSchema,
  }),
  pattern: z.string(),       // 格局: 正官格,七杀格...
  yongShen: z.string(),      // 用神
  shensha: ShenshaSchema,
  dayun: z.object({
    startAgeYears: z.number(),
    direction: z.enum(['forward', 'reverse']),
    steps: z.array(DayunStepSchema),
  }),
  liunian: z.array(LiunianSchema).optional(),
  liuri: z.array(LiuriSchema).optional(),
});

export type BaziChart = z.infer<typeof BaziChartSchema>;

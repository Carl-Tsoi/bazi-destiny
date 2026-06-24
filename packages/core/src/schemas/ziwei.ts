import { z } from 'zod';

const StarSchema = z.object({
  name: z.string(),
  type: z.enum(['major', 'minor']),
  brightness: z.string(),      // 庙/旺/利/得/平/陷
  mutagen: z.string(),         // 禄/权/科/忌 or ''
});

const PalaceSchema = z.object({
  name: z.string(),            // 宫位名称
  heavenlyStem: z.string(),    // 天干
  earthlyBranch: z.string(),   // 地支
  majorStars: z.array(StarSchema),
  minorStars: z.array(StarSchema),
});

export const ZiweiChartSchema = z.object({
  engine: z.literal('ziwei'),
  birthInfo: z.object({
    lunarDate: z.string(),
    gender: z.enum(['M', 'F']),
  }),
  palaces: z.array(PalaceSchema),
  sihua: z.object({
    huaLu: z.object({ star: z.string(), palace: z.string() }),
    huaQuan: z.object({ star: z.string(), palace: z.string() }),
    huaKe: z.object({ star: z.string(), palace: z.string() }),
    huaJi: z.object({ star: z.string(), palace: z.string() }),
  }),
  shengxiao: z.string(),
  pattern: z.string(),         // 格局: 日照雷门格, etc.
  decades: z.array(z.object({
    startAge: z.number(),
    endAge: z.number(),
    palace: z.string(),
  })),
});

export type ZiweiChart = z.infer<typeof ZiweiChartSchema>;

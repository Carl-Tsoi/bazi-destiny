import { z } from 'zod';

const PlanetSchema = z.object({
  name: z.string(),
  sign: z.string(),
  house: z.number(),
  degrees: z.number(),
  retrograde: z.boolean().optional(),
});

const AspectSchema = z.object({
  planet1: z.string(),
  planet2: z.string(),
  type: z.string(),     // conjunction, trine, square, opposition, sextile
  orb: z.number(),
});

const TransitSchema = z.object({
  planet: z.string(),
  aspectType: z.string(),
  targetPlanet: z.string().optional(),
  date: z.string(),
});

export const WesternChartSchema = z.object({
  engine: z.literal('astrology'),
  birthInfo: z.object({
    utcDatetime: z.string(),
    latitude: z.number(),
    longitude: z.number(),
  }),
  planets: z.array(PlanetSchema),
  houses: z.object({
    system: z.string(),          // e.g. Placidus
    cusps: z.array(z.number()),  // 12 house cusp degrees
  }),
  ascendant: z.object({
    sign: z.string(),
    degrees: z.number(),
  }),
  midheaven: z.object({
    sign: z.string(),
    degrees: z.number(),
  }),
  aspects: z.array(AspectSchema),
  transits: z.array(TransitSchema).optional(),
});

export type WesternChart = z.infer<typeof WesternChartSchema>;

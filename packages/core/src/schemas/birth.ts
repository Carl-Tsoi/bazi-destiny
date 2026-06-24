import { z } from 'zod';

// BirthInfo validation schema — mirrors the interface, adds range checks
export const BirthInfoSchema = z.object({
  datetime: z.string().regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/,
    'Expected ISO 8601 format: YYYY-MM-DDTHH:MM or YYYY-MM-DDTHH:MM:SS'
  ),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timezone: z.string().min(1),
  gender: z.enum(['M', 'F']),
});

export type BirthInfo = z.infer<typeof BirthInfoSchema>;

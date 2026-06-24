// @bazi-destiny/core — shared types, interfaces, schemas, utilities, and database

export type { BirthInfo, Result, IDivinationEngine } from './interfaces/IDivinationEngine.js';
export type { ILlmProvider } from './interfaces/ILlmProvider.js';
export { BirthInfoSchema } from './schemas/birth.js';
export { BaziChartSchema, type BaziChart } from './schemas/bazi.js';
export { ZiweiChartSchema, type ZiweiChart } from './schemas/ziwei.js';
export { WesternChartSchema, type WesternChart } from './schemas/astrology.js';
export { initDatabase } from './db/index.js';
export { TWELVE_DIMENSIONS } from './dimensions.js';
export type { DimensionDef } from './dimensions.js';

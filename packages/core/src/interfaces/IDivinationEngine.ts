// Core engine interfaces — every divination system implements IDivinationEngine<TOutput>

/** Unified birth input accepted by all engines */
export interface BirthInfo {
  /** ISO 8601 datetime string, e.g. "1990-01-15T14:30:00" */
  datetime: string;
  /** Latitude for true solar time correction (-90 to 90) */
  latitude: number;
  /** Longitude (-180 to 180) */
  longitude: number;
  /** IANA timezone, e.g. "Asia/Shanghai" */
  timezone: string;
  /** M or F */
  gender: 'M' | 'F';
}

/** Discriminated result type — caller always checks success first */
export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/** Generic divination engine interface */
export interface IDivinationEngine<TOutput> {
  /** Calculate a chart from birth info. Returns Result with typed output or error. */
  calculate(birthInfo: BirthInfo): Promise<Result<TOutput>>;
}

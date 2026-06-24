// Lunar calendar conversion utilities
// Placeholder — will be replaced with a proper lunar calendar library integration

/**
 * Convert solar (Gregorian) date to Chinese lunar date.
 * Stub — returns a placeholder. Replace with @openfate/lunar or similar.
 */
export function solarToLunar(date: Date): {
  year: number;
  month: number;
  day: number;
  isLeapMonth: boolean;
  monthName: string;
  dayName: string;
} {
  // TODO: integrate with a proper lunar calendar library
  // For now, returns a placeholder to unblock schema design
  throw new Error('solarToLunar: not yet implemented — integrate lunar calendar library');
}

/**
 * Convert Chinese lunar date to solar (Gregorian) date.
 * Stub — replace with proper library.
 */
export function lunarToSolar(
  year: number,
  month: number,
  day: number,
  isLeapMonth: boolean,
): Date {
  throw new Error('lunarToSolar: not yet implemented — integrate lunar calendar library');
}

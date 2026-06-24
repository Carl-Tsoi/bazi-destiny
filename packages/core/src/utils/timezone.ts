// Timezone offset utilities

/**
 * Get the UTC offset in minutes for a given IANA timezone at a specific date.
 * Uses Intl.DateTimeFormat for cross-platform compatibility.
 */
export function getTimezoneOffset(timezone: string, date: Date): number {
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  return (tzDate.getTime() - utcDate.getTime()) / 60000;
}

/**
 * Get the IANA timezone identifier for a given latitude/longitude.
 * Simplified — uses a static lookup for common zones. Replace with
 * a geo-tz library (like @vvo/tzdb) for production use.
 */
export function guessTimezone(latitude: number, longitude: number): string {
  // Default to Asia/Shanghai for Chinese longitudes
  if (longitude >= 75 && longitude <= 135 && latitude >= 18 && latitude <= 54) {
    return 'Asia/Shanghai';
  }
  return 'UTC';
}

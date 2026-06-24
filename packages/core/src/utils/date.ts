// Date formatting utilities

/**
 * Parse an ISO 8601 datetime string into a Date object.
 * Supports both "YYYY-MM-DDTHH:MM" and "YYYY-MM-DDTHH:MM:SS" formats.
 */
export function parseISO(datetime: string): Date {
  // Normalize short form (no seconds) to full ISO
  const normalized = datetime.includes('T') && datetime.split('T')[1]?.split(':').length === 2
    ? `${datetime}:00`
    : datetime;

  const date = new Date(normalized);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid datetime: ${datetime}`);
  }
  return date;
}

/**
 * Format a Date object as an ISO 8601 datetime string (without milliseconds).
 */
export function formatDate(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, '');
}

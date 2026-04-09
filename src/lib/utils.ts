/**
 * Safely converts a Firestore timestamp or date-like value to a JavaScript Date object.
 * Handles Firestore Timestamps, ISO strings, and numbers.
 */
export function toDate(value: any): Date {
  if (!value) return new Date();
  
  // Firestore Timestamp
  if (typeof value.toDate === 'function') {
    return value.toDate();
  }
  
  // Firestore Timestamp-like object (seconds/nanoseconds)
  if (value.seconds !== undefined) {
    return new Date(value.seconds * 1000);
  }
  
  // ISO String or Number
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return new Date();
  }
  
  return date;
}

/**
 * Formats a date for display.
 */
export function formatDate(value: any, options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }): string {
  try {
    return toDate(value).toLocaleDateString(undefined, options);
  } catch (e) {
    return 'Invalid Date';
  }
}

/**
 * Formats a time for display.
 */
export function formatTime(value: any, options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }): string {
  try {
    return toDate(value).toLocaleTimeString(undefined, options);
  } catch (e) {
    return 'Invalid Time';
  }
}

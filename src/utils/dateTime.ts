/**
 * Ensures a timestamp string is treated as UTC by adding timezone indicator if missing.
 * Converts formats like "2025-10-22 13:41:54" to "2025-10-22T13:41:54Z"
 * @param timestamp - Date/time string from backend
 * @returns UTC-formatted ISO string
 */
const normalizeToUTC = (timestamp: string): string => {
  const normalized = timestamp.trim();
  
  // Check if timestamp already has timezone info (Z, +, or - after position 10)
  const hasTimezone = normalized.includes('Z') || 
                      normalized.includes('+') || 
                      normalized.includes('-', 10);
  
  if (hasTimezone) {
    return normalized;
  }
  
  // Convert "YYYY-MM-DD HH:MM:SS" to "YYYY-MM-DDTHH:MM:SSZ"
  if (!normalized.includes('T')) {
    return normalized.replace(' ', 'T') + 'Z';
  }
  
  // Has T but no timezone - add Z
  return normalized + 'Z';
};

/**
 * Formats a date string (UTC from backend) to a localized date format
 * @param date - ISO date string in UTC format
 * @returns Formatted date string in user's local timezone (e.g., "Jan 15, 2024")
 */
export const formatDate = (date: string): string => {
  const utcTimestamp = normalizeToUTC(date);
  const dateObj = new Date(utcTimestamp);
  
  return dateObj.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Formats a time string (UTC from backend) to a localized time format
 * @param time - ISO date string in UTC format
 * @returns Formatted time string in user's local timezone (e.g., "02:30 PM")
 */
export const formatTime = (time: string): string => {
  const utcTimestamp = normalizeToUTC(time);
  const dateObj = new Date(utcTimestamp);
  
  return dateObj.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};


/**
 * Utility functions for date handling that respects user's local timezone
 */

/**
 * Get the user's timezone
 */
export const getUserTimezone = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/**
 * Get today's date in user's local timezone as YYYY-MM-DD string
 */
export const getLocalToday = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get a date in local timezone as YYYY-MM-DD string
 */
export const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Add days to a date string and return formatted local date
 */
export const addDaysToDateString = (dateString, days) => {
  const date = new Date(dateString + 'T00:00:00'); // Force local timezone interpretation
  date.setDate(date.getDate() + days);
  return formatLocalDate(date);
};

/**
 * Get current time in user's timezone (for debugging)
 */
export const getCurrentTimeInfo = () => {
  const now = new Date();
  return {
    timezone: getUserTimezone(),
    localDate: getLocalToday(),
    localTime: now.toLocaleTimeString(),
    utcTime: now.toUTCString(),
    timezoneOffset: now.getTimezoneOffset() // minutes behind UTC
  };
};
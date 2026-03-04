import {
  startOfWeek,
  getISOWeek,
  addDays,
  addWeeks,
  format,
  isBefore,
  startOfDay,
} from "date-fns";

/** Get Monday of the week containing the given date. */
export function getWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

/** ISO week number (1-53). */
export function getWeekNumber(date: Date): number {
  return getISOWeek(date);
}

/** Returns an array of 7 dates (Mon-Sun) starting from weekStart. */
export function getWeekDates(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

/**
 * Can shifts be edited for the given week?
 * - Admins can always edit.
 * - Employees can only edit weeks starting next Monday and beyond.
 */
export function isEditable(weekStart: Date, isAdmin: boolean): boolean {
  if (isAdmin) return true;
  const nextMonday = getWeekStart(addWeeks(startOfDay(new Date()), 1));
  return !isBefore(startOfDay(weekStart), nextMonday);
}

/** Navigate to previous or next week. */
export function navigateWeek(current: Date, direction: "prev" | "next"): Date {
  return addWeeks(current, direction === "next" ? 1 : -1);
}

/** Format a date as YYYY-MM-DD (for DB storage). */
export function formatDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** Format day header for desktop, e.g. "Mon 3/3". */
export function formatDayHeader(date: Date): string {
  return format(date, "EEE M/d");
}

/** Format day header for mobile, e.g. "Mo". */
export function formatDayHeaderCompact(date: Date): string {
  return format(date, "EEEEEE");
}

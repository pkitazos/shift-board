import { db } from "@/lib/supabase";
import { formatDateKey, getWeekDates } from "@/lib/dates";
import type { Shift, ShiftType, User } from "@/types";

export type BasicUser = Pick<User, "id" | "name" | "email">;

export interface ShiftWithUser extends Shift {
  users: BasicUser;
}

/** Fetch all shifts for a user within a given week. */
export async function fetchShifts(
  userId: string,
  weekStart: Date,
): Promise<Shift[]> {
  const [startDate, endDate] = [0, 6].map((i) =>
    formatDateKey(getWeekDates(weekStart)[i]),
  );

  const { data, error } = await db
    .from("shifts")
    .select("*")
    .eq("user_id", userId)
    .gte("date", startDate)
    .lte("date", endDate);

  if (error) throw error;
  return data;
}

/** Convert a shifts array into a date-keyed map. */
export function shiftsToMap(shifts: Shift[]): Record<string, ShiftType | null> {
  return Object.fromEntries(
    shifts.filter((s) => s.type).map((s) => [s.date, s.type]),
  );
}

/** Compute the diff between two shift maps (only changed keys). */
export function diffShifts(
  current: Record<string, ShiftType | null>,
  original: Record<string, ShiftType | null>,
): Record<string, ShiftType | null> {
  const allKeys = new Set([...Object.keys(current), ...Object.keys(original)]);
  return Object.fromEntries(
    [...allKeys]
      .filter((key) => (current[key] ?? null) !== (original[key] ?? null))
      .map((key) => [key, current[key] ?? null]),
  );
}

/**
 * Save a week's worth of shift changes.
 * - Entries with a type get upserted.
 * - Entries with null type get deleted.
 */
export async function saveShifts(
  userId: string,
  changes: Record<string, ShiftType | null>,
): Promise<void> {
  const entries = Object.entries(changes);
  const toUpsert = entries
    .filter(([, type]) => type !== null)
    .map(([date, type]) => ({ user_id: userId, date, type: type! }));
  const toDelete = entries
    .filter(([, type]) => type === null)
    .map(([date]) => date);

  if (toUpsert.length > 0) {
    const { error } = await db
      .from("shifts")
      .upsert(toUpsert, { onConflict: "user_id,date" });
    if (error) throw error;
  }

  if (toDelete.length > 0) {
    const { error } = await db
      .from("shifts")
      .delete()
      .eq("user_id", userId)
      .in("date", toDelete);
    if (error) throw error;
  }
}

/** Fetch all users. */
export async function fetchAllUsers(): Promise<BasicUser[]> {
  const { data, error } = await db
    .from("users")
    .select("id, name, email")
    .order("name");

  if (error) throw error;
  return data;
}

/** Fetch all shifts (with user info) across a date range. */
export async function fetchAllShifts(
  startDate: string,
  endDate: string,
): Promise<ShiftWithUser[]> {
  const { data, error } = await db
    .from("shifts")
    .select("*, users(id, name, email)")
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date");

  if (error) throw error;
  return data as ShiftWithUser[];
}

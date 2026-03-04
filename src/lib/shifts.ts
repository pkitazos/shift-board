import { db } from "@/lib/supabase";
import { formatDateKey, getWeekDates } from "@/lib/dates";
import { AppError } from "@/lib/api";
import { SHIFT_TYPES } from "@/types";
import type { Shift, ShiftType } from "@/types";
import type { BasicUser } from "@/lib/users";

export interface ShiftWithUser extends Shift {
  users: BasicUser;
}

/** Cycle through: null -> full -> half -> null */
export function cycleShift(current: ShiftType | null): ShiftType | null {
  if (!current) return SHIFT_TYPES.FULL;
  if (current === SHIFT_TYPES.FULL) return SHIFT_TYPES.HALF;
  return null;
}

/** Fetch all shifts for a user within a given week. */
export async function fetchShifts(
  userId: string,
  weekStart: Date,
): Promise<Shift[]> {
  const dates = getWeekDates(weekStart);
  const startDate = formatDateKey(dates[0]);
  const endDate = formatDateKey(dates[6]);

  return db
    .from("shifts")
    .select("*")
    .eq("user_id", userId)
    .gte("date", startDate)
    .lte("date", endDate)
    .then(({ data, error }) => {
      if (error) throw new AppError("Could not load shifts", error);
      return data;
    });
}

/** Convert a shifts array into a date-keyed map. */
export function shiftsToMap(shifts: Shift[]): Record<string, ShiftType> {
  return Object.fromEntries(
    shifts
      .filter((s): s is Shift & { type: ShiftType } => s.type !== null)
      .map((s) => [s.date, s.type]),
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

  const upsertOp =
    toUpsert.length > 0
      ? db
          .from("shifts")
          .upsert(toUpsert, { onConflict: "user_id,date" })
          .then(({ error }) => {
            if (error) throw error;
          })
      : Promise.resolve();

  const deleteOp =
    toDelete.length > 0
      ? db
          .from("shifts")
          .delete()
          .eq("user_id", userId)
          .in("date", toDelete)
          .then(({ error }) => {
            if (error) throw error;
          })
      : Promise.resolve();

  return Promise.all([upsertOp, deleteOp])
    .then(() => undefined)
    .catch((cause) => {
      throw new AppError("Could not save shifts", cause);
    });
}

/** Fetch all shifts (with user info) across a date range. */
export async function fetchAllShifts(
  startDate: string,
  endDate: string,
): Promise<ShiftWithUser[]> {
  return db
    .from("shifts")
    .select("*, users(id, name, email)")
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date")
    .then(({ data, error }) => {
      if (error) throw new AppError("Could not load shifts", error);
      return data as ShiftWithUser[];
    });
}

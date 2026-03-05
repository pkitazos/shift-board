import { AppError } from "@/lib/errors";
import { SHIFT_TYPES } from "@/types";
import type { ShiftType } from "@/types";
import type { ShiftWithUser } from "@/lib/shifts";
import { saveShifts } from "@/lib/shifts";
import { displayName } from "@/lib/users";
import { match } from "@/lib/utils/match";

export interface CellEntry {
  userId: string;
  userName: string;
  userEmail: string;
  type: ShiftType;
}

/** State: date key -> array of cell entries */
export type GridState = Record<string, CellEntry[]>;

/** Convert raw shift rows into a grid keyed by date. */
export function shiftsToGrid(shifts: ShiftWithUser[]): GridState {
  return shifts.reduce<GridState>((acc, s) => {
    if (!s.type) return acc;
    (acc[s.date] ??= []).push({
      userId: s.users.id,
      userName: displayName(s.users),
      userEmail: s.users.email,
      type: s.type,
    });
    return acc;
  }, {});
}

/** Deep-clone a grid (one level of entry objects). */
export function cloneGrid(grid: GridState): GridState {
  return Object.fromEntries(
    Object.entries(grid).map(([k, v]) => [k, v.map((e) => ({ ...e }))]),
  );
}

/** Compute per-user diffs between two grid states. */
export function computeUserDiffs(
  current: GridState,
  original: GridState,
): Record<string, Record<string, ShiftType | null>> {
  const allDates = new Set([...Object.keys(current), ...Object.keys(original)]);
  const userChanges: Record<string, Record<string, ShiftType | null>> = {};

  [...allDates].forEach((date) => {
    const cur = current[date] ?? [];
    const orig = original[date] ?? [];

    const origMap = Object.fromEntries(orig.map((e) => [e.userId, e.type]));
    const curMap = Object.fromEntries(cur.map((e) => [e.userId, e.type]));

    // Additions and type changes
    cur.forEach((entry) => {
      if (origMap[entry.userId] !== entry.type) {
        (userChanges[entry.userId] ??= {})[date] = entry.type;
      }
    });

    // Removals
    orig.forEach((entry) => {
      if (!(entry.userId in curMap)) {
        (userChanges[entry.userId] ??= {})[date] = null;
      }
    });
  });

  return userChanges;
}

/** Persist all per-user diffs to the database. */
export async function saveGridChanges(
  current: GridState,
  original: GridState,
): Promise<void> {
  const diffs = computeUserDiffs(current, original);
  return Promise.all(
    Object.entries(diffs).map(([userId, changes]) =>
      saveShifts(userId, changes),
    ),
  )
    .then(() => undefined)
    .catch((cause) => {
      throw new AppError("Could not save shift changes", cause);
    });
}

/** Check whether two grids differ. */
export function hasGridChanges(
  current: GridState,
  original: GridState,
): boolean {
  const allDates = new Set([...Object.keys(current), ...Object.keys(original)]);

  return [...allDates].some((date) => {
    const cur = current[date] ?? [];
    const orig = original[date] ?? [];
    if (cur.length !== orig.length) return true;

    const origMap = Object.fromEntries(orig.map((e) => [e.userId, e.type]));
    return cur.some((entry) => origMap[entry.userId] !== entry.type);
  });
}

/** Cycle a cell entry's type between full and half. */
export function cycleGridEntryType(
  grid: GridState,
  dateKey: string,
  userId: string,
): GridState {
  const entries = (grid[dateKey] ?? []).map((e) => {
    if (e.userId !== userId) return e;
    const type = match(e.type, {
      [SHIFT_TYPES.FULL]: () => SHIFT_TYPES.HALF,
      [SHIFT_TYPES.HALF]: () => SHIFT_TYPES.FULL,
    });
    return { ...e, type };
  });
  return { ...grid, [dateKey]: entries };
}

export function removeGridEntry(
  grid: GridState,
  dateKey: string,
  userId: string,
): GridState {
  const entries = (grid[dateKey] ?? []).filter((e) => e.userId !== userId);
  const next = { ...grid };
  if (entries.length === 0) {
    delete next[dateKey];
  } else {
    next[dateKey] = entries;
  }
  return next;
}

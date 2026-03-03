import { createFileRoute } from "@tanstack/react-router";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { addWeeks } from "date-fns";
import { Plus } from "lucide-react";
import {
  getWeekStart,
  getWeekDates,
  getWeekNumber,
  formatDateKey,
  formatDayHeader,
  navigateWeek,
} from "@/lib/dates";
import { fetchAllShifts, fetchAllUsers, saveShifts } from "@/lib/shifts";
import type { ShiftWithUser, BasicUser } from "@/lib/shifts";
import { ShiftType } from "@/types";
import type { ShiftType as ShiftTypeValue } from "@/types";
import { WeekNav } from "@/components/WeekNav";
import { ShiftTag } from "@/components/ShiftTag";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminPage,
});

const ROW_HEIGHT_ESTIMATE = 100;
const CHROME_HEIGHT = 140; // header + nav + padding
const MIN_WEEKS = 4;

function subscribeToResize(cb: () => void) {
  window.addEventListener("resize", cb);
  return () => window.removeEventListener("resize", cb);
}

function getWeeksToShow() {
  return Math.max(
    MIN_WEEKS,
    Math.floor((window.innerHeight - CHROME_HEIGHT) / ROW_HEIGHT_ESTIMATE),
  );
}

function useWeeksToShow() {
  return useSyncExternalStore(subscribeToResize, getWeeksToShow);
}

// -- Types --

interface CellEntry {
  userId: string;
  userName: string;
  userEmail: string;
  type: ShiftTypeValue;
}

/** State: date key -> array of cell entries */
type GridState = Record<string, CellEntry[]>;

// -- Helpers --

function shiftsToGrid(shifts: ShiftWithUser[]): GridState {
  return shifts.reduce<GridState>((acc, s) => {
    if (!s.type) return acc;
    (acc[s.date] ??= []).push({
      userId: s.users.id,
      userName: s.users.name ?? s.users.email,
      userEmail: s.users.email,
      type: s.type,
    });
    return acc;
  }, {});
}

function cloneGrid(grid: GridState): GridState {
  return Object.fromEntries(
    Object.entries(grid).map(([k, v]) => [k, v.map((e) => ({ ...e }))]),
  );
}

/** Compute per-user diffs and call saveShifts for each changed user. */
async function computeAndSave(
  current: GridState,
  original: GridState,
): Promise<void> {
  const allDates = new Set([...Object.keys(current), ...Object.keys(original)]);

  // Build per-user change maps: userId -> { date -> type | null }
  const userChanges: Record<string, Record<string, ShiftTypeValue | null>> = {};

  [...allDates].forEach((date) => {
    const cur = current[date] ?? [];
    const orig = original[date] ?? [];

    // Index originals by userId
    const origMap = Object.fromEntries(orig.map((e) => [e.userId, e.type]));
    const curMap = Object.fromEntries(cur.map((e) => [e.userId, e.type]));

    // Find additions and type changes
    cur.forEach((entry) => {
      if (origMap[entry.userId] !== entry.type) {
        (userChanges[entry.userId] ??= {})[date] = entry.type;
      }
    });

    // Find removals
    orig.forEach((entry) => {
      if (!(entry.userId in curMap)) {
        (userChanges[entry.userId] ??= {})[date] = null;
      }
    });
  });

  return Promise.all(
    Object.entries(userChanges).map(([userId, changes]) =>
      saveShifts(userId, changes),
    ),
  ).then(() => undefined);
}

function hasGridChanges(current: GridState, original: GridState): boolean {
  const allDates = new Set([...Object.keys(current), ...Object.keys(original)]);

  return [...allDates].some((date) => {
    const cur = current[date] ?? [];
    const orig = original[date] ?? [];
    if (cur.length !== orig.length) return true;

    const origMap = Object.fromEntries(orig.map((e) => [e.userId, e.type]));
    return cur.some((entry) => origMap[entry.userId] !== entry.type);
  });
}

// -- Inline combobox for adding an employee --

function AddEmployeeCombobox({
  users,
  existingUserIds,
  onSelect,
  onCancel,
}: {
  users: BasicUser[];
  existingUserIds: Set<string>;
  onSelect: (user: BasicUser) => void;
  onCancel: () => void;
}) {
  const available = users.filter((u) => !existingUserIds.has(u.id));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  return (
    <Combobox
      open
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
      onValueChange={(val) => {
        const user = available.find((u) => u.id === val);
        if (user) onSelect(user);
      }}
    >
      <ComboboxInput
        ref={inputRef}
        className="w-full h-6 sm:h-8 min-w-0 text-2xs sm:text-xs"
        placeholder="Add employee..."
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel();
        }}
      />
      <ComboboxContent>
        <ComboboxList>
          {available.map((u) => (
            <ComboboxItem key={u.id} value={u.id}>
              {u.name ?? u.email}
            </ComboboxItem>
          ))}
          {available.length === 0 && (
            <ComboboxEmpty>No employees available</ComboboxEmpty>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

// -- Main component --

function AdminPage() {
  const weeksToShow = useWeeksToShow();
  const [startWeek, setStartWeek] = useState(() => getWeekStart(new Date()));
  const [grid, setGrid] = useState<GridState>({});
  const [original, setOriginal] = useState<GridState>({});
  const [users, setUsers] = useState<BasicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  // Track which cells have an open combobox: "YYYY-MM-DD"
  const [pendingCells, setPendingCells] = useState<Set<string>>(new Set());

  const weeks = Array.from({ length: weeksToShow }, (_, i) =>
    addWeeks(startWeek, i),
  );

  const hasChanges = hasGridChanges(grid, original);

  const loadData = useCallback(() => {
    const startDate = formatDateKey(startWeek);
    const endDate = formatDateKey(addWeeks(startWeek, weeksToShow));

    setLoading(true);
    setPendingCells(new Set());

    Promise.all([fetchAllShifts(startDate, endDate), fetchAllUsers()])
      .then(([shifts, allUsers]) => {
        const g = shiftsToGrid(shifts);
        setGrid(g);
        setOriginal(cloneGrid(g));
        setUsers(allUsers);
      })
      .finally(() => setLoading(false));
  }, [startWeek, weeksToShow]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCycleType = (dateKey: string, userId: string) => {
    setGrid((prev) => {
      const entries = (prev[dateKey] ?? []).map((e) =>
        e.userId === userId
          ? {
              ...e,
              type: e.type === ShiftType.FULL ? ShiftType.HALF : ShiftType.FULL,
            }
          : e,
      );
      return { ...prev, [dateKey]: entries };
    });
  };

  const handleRemove = (dateKey: string, userId: string) => {
    setGrid((prev) => {
      const entries = (prev[dateKey] ?? []).filter((e) => e.userId !== userId);
      const next = { ...prev };
      if (entries.length === 0) {
        delete next[dateKey];
      } else {
        next[dateKey] = entries;
      }
      return next;
    });
  };

  const handleAddEmployee = (dateKey: string, user: BasicUser) => {
    setGrid((prev) => ({
      ...prev,
      [dateKey]: [
        ...(prev[dateKey] ?? []),
        {
          userId: user.id,
          userName: user.name ?? user.email,
          userEmail: user.email,
          type: ShiftType.FULL as ShiftTypeValue,
        },
      ],
    }));
    setPendingCells((prev) => {
      const next = new Set(prev);
      next.delete(dateKey);
      return next;
    });
  };

  const handleOpenCombobox = (dateKey: string) => {
    setPendingCells((prev) => new Set(prev).add(dateKey));
  };

  const handleCancelCombobox = (dateKey: string) => {
    setPendingCells((prev) => {
      const next = new Set(prev);
      next.delete(dateKey);
      return next;
    });
  };

  const handleSave = () => {
    setSaving(true);
    computeAndSave(grid, original)
      .then(() => setOriginal(cloneGrid(grid)))
      .finally(() => {
        setSaving(false);
        setDialogOpen(false);
      });
  };

  // Day headers (Mon-Sun)
  const dayHeaders = getWeekDates(startWeek).map(formatDayHeader);

  return (
    <section className="mx-auto max-w-7xl p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">All Shifts</h1>
        <div className="flex items-center gap-2">
          <WeekNav
            weekStart={startWeek}
            onPrev={() => setStartWeek((w) => navigateWeek(w, "prev"))}
            onNext={() => setStartWeek((w) => navigateWeek(w, "next"))}
          />
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading shifts...</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed border-collapse text-sm">
              <thead>
                <tr>
                  <th className="w-6 sm:w-14 px-0.5 sm:px-2 py-1 text-left text-2xs sm:text-xs font-medium text-muted-foreground">
                    <span className="sm:hidden">#</span>
                    <span className="hidden sm:inline">Week</span>
                  </th>
                  {dayHeaders.map((day) => (
                    <th
                      key={day}
                      className="px-0.5 sm:px-2 py-1 text-center text-2xs sm:text-xs font-medium text-muted-foreground"
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weeks.map((weekStart) => {
                  const dates = getWeekDates(weekStart);

                  // Compute max employees in any cell this row
                  const maxPerDay = Math.max(
                    0,
                    ...dates.map((d) => (grid[formatDateKey(d)] ?? []).length),
                  );
                  const minSubRows = Math.max(2, maxPerDay + 1);

                  return (
                    <tr key={formatDateKey(weekStart)} className="border-t">
                      <td className="px-0.5 py-2 sm:px-2 text-2xs sm:text-xs font-medium text-muted-foreground align-top">
                        <span className="sm:hidden">
                          {getWeekNumber(weekStart)}
                        </span>
                        <span className="hidden sm:inline">
                          W{getWeekNumber(weekStart)}
                        </span>
                      </td>
                      {dates.map((date) => {
                        const key = formatDateKey(date);
                        const dayEntries = grid[key] ?? [];
                        const isPending = pendingCells.has(key);
                        const existingUserIds = new Set(
                          dayEntries.map((e) => e.userId),
                        );

                        return (
                          <td
                            key={key}
                            className="px-0.5 py-2 align-top overflow-hidden"
                          >
                            <div
                              className="group relative flex min-w-0 flex-col justify-start gap-0.5 sm:gap-1 px-px"
                              style={{
                                minHeight: `${minSubRows * 2}rem`,
                              }}
                            >
                              {dayEntries.map((entry) => (
                                <ShiftTag
                                  key={entry.userId}
                                  name={entry.userName}
                                  type={entry.type}
                                  className="text-2xs sm:text-xs"
                                  onCycleType={() =>
                                    handleCycleType(key, entry.userId)
                                  }
                                  onRemove={() =>
                                    handleRemove(key, entry.userId)
                                  }
                                />
                              ))}

                              {isPending ? (
                                <AddEmployeeCombobox
                                  users={users}
                                  existingUserIds={existingUserIds}
                                  onSelect={(user) =>
                                    handleAddEmployee(key, user)
                                  }
                                  onCancel={() => handleCancelCombobox(key)}
                                />
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleOpenCombobox(key)}
                                  className="flex w-full h-6 sm:h-8 cursor-pointer items-center justify-center rounded-md py-0.5 text-2xs sm:text-xs text-muted-foreground opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
                                >
                                  <Plus className="size-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {hasChanges && (
            <div className="sticky bottom-4 mt-4 flex justify-end">
              <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <AlertDialogTrigger
                  render={
                    <Button disabled={saving}>
                      {saving ? "Saving..." : "Save changes"}
                    </Button>
                  }
                />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Save changes?</AlertDialogTitle>
                    <AlertDialogDescription>
                      All shift changes across the visible weeks will be saved.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSave}>
                      Confirm
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </>
      )}
    </section>
  );
}

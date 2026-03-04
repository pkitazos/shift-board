import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
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
import { fetchAllShifts } from "@/lib/shifts";
import { fetchAllUsers } from "@/lib/users";
import type { BasicUser } from "@/lib/users";
import { SHIFT_TYPES } from "@/types";
import type { ShiftType } from "@/types";
import {
  shiftsToGrid,
  cloneGrid,
  saveGridChanges,
  hasGridChanges,
  cycleGridEntryType,
  removeGridEntry,
} from "@/lib/admin-grid";
import type { GridState } from "@/lib/admin-grid";
import { useWeeksToShow } from "@/hooks/useWeeksToShow";
import { WeekNav } from "@/components/WeekNav";
import { ShiftTag } from "@/components/ShiftTag";
import { AddEmployeeCombobox } from "@/components/AddEmployeeCombobox";
import { Button } from "@/components/ui/button";
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

function AdminPage() {
  const weeksToShow = useWeeksToShow();
  const [startWeek, setStartWeek] = useState(() => getWeekStart(new Date()));
  const [grid, setGrid] = useState<GridState>({});
  const [original, setOriginal] = useState<GridState>({});
  const [users, setUsers] = useState<BasicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
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
    setGrid((prev) => cycleGridEntryType(prev, dateKey, userId));
  };

  const handleRemove = (dateKey: string, userId: string) => {
    setGrid((prev) => removeGridEntry(prev, dateKey, userId));
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
          type: SHIFT_TYPES.FULL as ShiftType,
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

  const handleSave = async () => {
    setSaving(true);
    await saveGridChanges(grid, original)
      .then(() => setOriginal(cloneGrid(grid)))
      .finally(() => {
        setSaving(false);
        setDialogOpen(false);
      });
  };

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

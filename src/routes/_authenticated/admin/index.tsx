import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { addWeeks } from "date-fns";
import { toast } from "sonner";
import {
  getWeekStart,
  getWeekDates,
  formatDateKey,
  navigateWeek,
} from "@/lib/dates";
import { fetchAllShifts } from "@/lib/shifts";
import { fetchAllUsers, displayName } from "@/lib/users";
import type { BasicUser } from "@/lib/users";
import { SHIFT_TYPES } from "@/types";
import {
  shiftsToGrid,
  cloneGrid,
  saveGridChanges,
  hasGridChanges,
  cycleGridEntryType,
  removeGridEntry,
} from "@/lib/admin-grid";
import type { GridState } from "@/lib/admin-grid";
import { ChangesSummary, buildAdminChanges } from "@/components/ChangesSummary";
import {
  ActionBar,
  actionBarSaveClass,
  actionBarDiscardClass,
  countAdminChanges,
} from "@/components/ActionBar";
import { useWeeksToShow } from "@/hooks/useWeeksToShow";
import { WeekNav } from "@/components/WeekNav";
import { DesktopGrid } from "@/components/DesktopGrid";
import { MobileGrid } from "@/components/MobileGrid";
import { DeleteModeBar } from "@/components/DeleteModeBar";
import { AddEmployeeDrawer } from "@/components/AddEmployeeDrawer";
import { ToastError } from "@/components/ToastError";
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
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);

  // Desktop: inline combobox state
  const [pendingCells, setPendingCells] = useState<Set<string>>(new Set());

  // Mobile: drawer + delete mode state
  const [deleteMode, setDeleteMode] = useState(false);
  const [drawerDateKey, setDrawerDateKey] = useState<string | null>(null);

  const weeks = Array.from({ length: weeksToShow }, (_, i) =>
    addWeeks(startWeek, i),
  );
  const days = getWeekDates(startWeek);
  const hasChanges = hasGridChanges(grid, original);

  const loadData = useCallback(() => {
    const startDate = formatDateKey(startWeek);
    const endDate = formatDateKey(addWeeks(startWeek, weeksToShow));

    setLoading(true);
    setPendingCells(new Set());
    setDeleteMode(false);
    setDrawerDateKey(null);

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

  // -- Shared handlers --

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
          userName: displayName(user),
          userEmail: user.email,
          type: SHIFT_TYPES.FULL,
        },
      ],
    }));
    // Desktop: close combobox
    setPendingCells((prev) => {
      const next = new Set(prev);
      next.delete(dateKey);
      return next;
    });
  };

  const handleSave = () => {
    setSaving(true);

    toast.promise(saveGridChanges(grid, original), {
      loading: "Saving changes...",
      success: () => {
        setOriginal(cloneGrid(grid));
        return "Changes saved";
      },
      error: (err) => <ToastError error={err} copy="Please try again." />,
      finally: () => {
        setSaving(false);
        setDialogOpen(false);
      },
    });
  };

  const handleDiscard = () => {
    setGrid(cloneGrid(original));
    setPendingCells(new Set());
    setDeleteMode(false);
    setDrawerDateKey(null);
    setDiscardDialogOpen(false);
  };

  // -- Desktop-only handlers --

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

  // -- Mobile-only handlers --

  const handleMobileAddPress = (dateKey: string) => {
    setDrawerDateKey(dateKey);
  };

  const handleDrawerSelect = (user: BasicUser) => {
    if (drawerDateKey) handleAddEmployee(drawerDateKey, user);
  };

  const drawerExistingUserIds = new Set(
    drawerDateKey ? (grid[drawerDateKey] ?? []).map((e) => e.userId) : [],
  );

  return (
    <section className="mx-auto max-w-7xl p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">All Shifts</h1>
        <WeekNav
          weekStart={startWeek}
          onPrev={() => setStartWeek((w) => navigateWeek(w, "prev"))}
          onNext={() => setStartWeek((w) => navigateWeek(w, "next"))}
        />
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading shifts...</p>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden sm:block">
            <DesktopGrid
              days={days}
              weeks={weeks}
              grid={grid}
              users={users}
              pendingCells={pendingCells}
              onCycleType={handleCycleType}
              onRemove={handleRemove}
              onOpenCombobox={handleOpenCombobox}
              onCancelCombobox={handleCancelCombobox}
              onAddEmployee={handleAddEmployee}
            />
          </div>

          {/* Mobile */}
          <div className="sm:hidden">
            <MobileGrid
              weeks={weeks}
              grid={grid}
              deleteMode={deleteMode}
              onCycleType={handleCycleType}
              onRemove={handleRemove}
              onAddPress={handleMobileAddPress}
              onEnterDeleteMode={() => setDeleteMode(true)}
            />

            {deleteMode && (
              <DeleteModeBar onDone={() => setDeleteMode(false)} />
            )}

            <AddEmployeeDrawer
              open={drawerDateKey !== null}
              onOpenChange={(open) => {
                if (!open) setDrawerDateKey(null);
              }}
              users={users}
              existingUserIds={drawerExistingUserIds}
              onSelect={handleDrawerSelect}
            />
          </div>

          {/* Save + Discard bar -- shared */}
          {hasChanges && !deleteMode && (
            <ActionBar {...countAdminChanges(buildAdminChanges(grid, original))}>
              <AlertDialog
                open={discardDialogOpen}
                onOpenChange={setDiscardDialogOpen}
              >
                <AlertDialogTrigger
                  render={<button className={actionBarDiscardClass}>Discard</button>}
                />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Discard changes?</AlertDialogTitle>
                    <AlertDialogDescription>
                      All unsaved changes will be lost.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={handleDiscard}
                    >
                      Discard
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <AlertDialogTrigger
                  render={
                    <button disabled={saving} className={actionBarSaveClass}>
                      {saving ? "Saving..." : "Save changes"}
                    </button>
                  }
                />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Save changes?</AlertDialogTitle>
                    <AlertDialogDescription render={<div />}>
                      <p className="text-sm text-muted-foreground mb-2">
                        The following shift changes will be saved.
                      </p>
                      <ChangesSummary
                        variant="admin"
                        groups={buildAdminChanges(grid, original)}
                      />
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
            </ActionBar>
          )}
        </>
      )}
    </section>
  );
}

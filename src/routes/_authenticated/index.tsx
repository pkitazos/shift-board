import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { getWeekStart, navigateWeek, isEditable } from "@/lib/dates";
import { fetchShifts, saveShifts, shiftsToMap, diffShifts } from "@/lib/shifts";
import { WeekNav } from "@/components/WeekNav";
import { WeekCalendar, cycleShift } from "@/components/WeekCalendar";
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
import type { ShiftType } from "@/types";

export const Route = createFileRoute("/_authenticated/")({
  component: IndexPage,
});

function IndexPage() {
  const { user, isAdmin } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [shifts, setShifts] = useState<Record<string, ShiftType | null>>({});
  const [original, setOriginal] = useState<Record<string, ShiftType | null>>(
    {},
  );
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const editable = isEditable(weekStart, isAdmin);
  const hasChanges = Object.keys(diffShifts(shifts, original)).length > 0;

  const loadShifts = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    await fetchShifts(user.id, weekStart)
      .then((data) => shiftsToMap(data))
      .then((map) => {
        setShifts(map);
        setOriginal(map);
      })
      .finally(() => setLoading(false));
  }, [user, weekStart]);

  useEffect(() => {
    loadShifts();
  }, [loadShifts]);

  const handleToggle = (dateKey: string) => {
    if (!editable) return;
    setShifts((prev) => ({
      ...prev,
      [dateKey]: cycleShift(prev[dateKey] ?? null),
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    await saveShifts(user.id, diffShifts(shifts, original))
      .then(() => setOriginal({ ...shifts }))
      .finally(() => {
        setSaving(false);
        setDialogOpen(false);
      });
  };

  return (
    <section className="mx-auto max-w-2xl p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">My Shifts</h1>
        <WeekNav
          weekStart={weekStart}
          onPrev={() => setWeekStart((w) => navigateWeek(w, "prev"))}
          onNext={() => setWeekStart((w) => navigateWeek(w, "next"))}
        />
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading shifts...</p>
      ) : (
        <>
          <WeekCalendar
            weekStart={weekStart}
            shifts={shifts}
            editable={editable}
            onToggle={handleToggle}
          />

          {editable && (
            <div className="mt-4 flex justify-end">
              <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <AlertDialogTrigger
                  render={
                    <Button disabled={!hasChanges || saving}>
                      {saving ? "Saving..." : "Save"}
                    </Button>
                  }
                />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Save changes?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Your shift availability for this week will be updated.
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

          {!editable && (
            <p className="mt-4 text-sm text-muted-foreground">
              You can only edit next week and beyond.
            </p>
          )}
        </>
      )}
    </section>
  );
}

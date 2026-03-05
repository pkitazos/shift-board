import {
  getWeekDates,
  getWeekNumber,
  formatDateKey,
  formatDayHeaderCompact,
} from "@/lib/dates";
import type { GridState } from "@/lib/admin-grid";
import { MobileShiftTag } from "@/components/MobileShiftTag";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileGridProps {
  weeks: Date[];
  grid: GridState;
  deleteMode: boolean;
  onCycleType: (dateKey: string, userId: string) => void;
  onRemove: (dateKey: string, userId: string) => void;
  onAddPress: (dateKey: string) => void;
  onEnterDeleteMode: () => void;
}

export function MobileGrid({
  weeks,
  grid,
  deleteMode,
  onCycleType,
  onRemove,
  onAddPress,
  onEnterDeleteMode,
}: MobileGridProps) {
  const days = getWeekDates(weeks[0]);

  return (
    <div>
      {/* Header row */}
      <div className="grid grid-cols-[1.5rem_repeat(7,1fr)] gap-x-0.5 text-sm">
        <div className="px-0.5 py-1 text-left text-2xs font-medium text-muted-foreground">
          #
        </div>
        {days.map((day) => (
          <div
            key={formatDateKey(day)}
            className="px-0.5 py-1 text-center text-2xs font-medium text-muted-foreground"
          >
            {formatDayHeaderCompact(day)}
          </div>
        ))}
      </div>

      {/* Data rows */}
      {weeks.map((weekStart) => {
        const dates = getWeekDates(weekStart);

        return (
          <div
            key={formatDateKey(weekStart)}
            className="grid min-h-8 grid-cols-[1.5rem_repeat(7,1fr)] gap-x-0.5 border-t text-sm"
          >
            <div className="px-0.5 py-1.5 text-2xs font-medium text-muted-foreground">
              {getWeekNumber(weekStart)}
            </div>
            {dates.map((date) => {
              const key = formatDateKey(date);
              const dayEntries = grid[key] ?? [];

              return (
                <div key={key} className="min-w-0 px-0.5 py-1.5 col-span-1">
                  <div className="min-w-0 flex flex-col gap-1">
                    {dayEntries.map((entry, i) => (
                      <MobileShiftTag
                        key={entry.userId}
                        index={i + 1}
                        name={entry.userName}
                        type={entry.type}
                        deleteMode={deleteMode}
                        onCycleType={() => onCycleType(key, entry.userId)}
                        onRemove={() => onRemove(key, entry.userId)}
                        onLongPress={onEnterDeleteMode}
                      />
                    ))}

                    <button
                      type="button"
                      onClick={() => onAddPress(key)}
                      className={cn(
                        "flex h-8 w-full items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground active:bg-muted",
                        deleteMode && "invisible",
                      )}
                      disabled={deleteMode}
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

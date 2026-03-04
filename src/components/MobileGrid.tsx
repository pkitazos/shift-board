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
    <div className="overflow-x-auto">
      <table className="w-full table-fixed border-collapse text-sm">
        <thead>
          <tr>
            <th className="w-6 px-0.5 py-1 text-left text-2xs font-medium text-muted-foreground">
              #
            </th>
            {days.map((day) => (
              <th
                key={formatDateKey(day)}
                className="px-0.5 py-1 text-center text-2xs font-medium text-muted-foreground"
              >
                {formatDayHeaderCompact(day)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((weekStart) => {
            const dates = getWeekDates(weekStart);

            return (
              <tr key={formatDateKey(weekStart)} className="border-t">
                <td className="px-0.5 py-1.5 text-2xs font-medium text-muted-foreground align-top">
                  {getWeekNumber(weekStart)}
                </td>
                {dates.map((date) => {
                  const key = formatDateKey(date);
                  const dayEntries = grid[key] ?? [];

                  return (
                    <td key={key} className="px-0.5 py-1.5 align-top">
                      <div className="flex flex-col gap-1">
                        {dayEntries.map((entry) => (
                          <MobileShiftTag
                            key={entry.userId}
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
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

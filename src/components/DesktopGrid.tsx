import {
  getWeekDates,
  getWeekNumber,
  formatDateKey,
  formatDayHeader,
} from "@/lib/dates";
import type { GridState } from "@/lib/admin-grid";
import type { BasicUser } from "@/lib/users";
import { ShiftTag } from "@/components/ShiftTag";
import { AddEmployeeCombobox } from "@/components/AddEmployeeCombobox";
import { Plus } from "lucide-react";

interface DesktopGridProps {
  days: Date[];
  weeks: Date[];
  grid: GridState;
  users: BasicUser[];
  pendingCells: Set<string>;
  onCycleType: (dateKey: string, userId: string) => void;
  onRemove: (dateKey: string, userId: string) => void;
  onOpenCombobox: (dateKey: string) => void;
  onCancelCombobox: (dateKey: string) => void;
  onAddEmployee: (dateKey: string, user: BasicUser) => void;
}

export function DesktopGrid({
  days,
  weeks,
  grid,
  users,
  pendingCells,
  onCycleType,
  onRemove,
  onOpenCombobox,
  onCancelCombobox,
  onAddEmployee,
}: DesktopGridProps) {
  return (
    <div>
      {/* Header row */}
      <div className="grid grid-cols-[3.5rem_repeat(7,1fr)] gap-x-1 text-sm">
        <div className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">
          Week
        </div>
        {days.map((day) => (
          <div
            key={formatDateKey(day)}
            className="px-2 py-1 text-center text-xs font-medium text-muted-foreground"
          >
            {formatDayHeader(day)}
          </div>
        ))}
      </div>

      {/* Data rows */}
      {weeks.map((weekStart) => {
        const dates = getWeekDates(weekStart);

        const maxPerDay = Math.max(
          0,
          ...dates.map((d) => (grid[formatDateKey(d)] ?? []).length),
        );
        const minSubRows = Math.max(2, maxPerDay + 1);

        return (
          <div
            key={formatDateKey(weekStart)}
            className="grid grid-cols-[3.5rem_repeat(7,1fr)] gap-x-1 border-t text-sm"
          >
            <div className="px-2 py-2 text-xs font-medium text-muted-foreground">
              W{getWeekNumber(weekStart)}
            </div>
            {dates.map((date) => {
              const key = formatDateKey(date);
              const dayEntries = grid[key] ?? [];
              const isPending = pendingCells.has(key);
              const existingUserIds = new Set(dayEntries.map((e) => e.userId));

              return (
                <div
                  key={key}
                  className="px-0.5 py-2"
                  style={{ minHeight: `${minSubRows * 2}rem` }}
                >
                  <div className="group flex flex-col justify-start gap-2">
                    {dayEntries.map((entry) => (
                      <ShiftTag
                        key={entry.userId}
                        name={entry.userName}
                        type={entry.type}
                        className="text-xs"
                        onCycleType={() => onCycleType(key, entry.userId)}
                        onRemove={() => onRemove(key, entry.userId)}
                      />
                    ))}

                    {isPending ? (
                      <AddEmployeeCombobox
                        users={users}
                        existingUserIds={existingUserIds}
                        onSelect={(user) => onAddEmployee(key, user)}
                        onCancel={() => onCancelCombobox(key)}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => onOpenCombobox(key)}
                        className="flex w-full h-8 cursor-pointer items-center justify-center rounded-md py-0.5 text-xs text-muted-foreground opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    )}
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

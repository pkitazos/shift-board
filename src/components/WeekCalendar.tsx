import { getWeekDates, formatDateKey, formatDayHeader } from "@/lib/dates";
import { ShiftCell, cycleShift } from "@/components/ShiftCell";
import type { ShiftType } from "@/types";

interface WeekCalendarProps {
  weekStart: Date;
  shifts: Record<string, ShiftType | null>;
  editable: boolean;
  onToggle: (dateKey: string) => void;
}

export function WeekCalendar({
  weekStart,
  shifts,
  editable,
  onToggle,
}: WeekCalendarProps) {
  const days = getWeekDates(weekStart);

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((day) => {
        const key = formatDateKey(day);
        return (
          <div key={key} className="flex flex-col justify-between gap-1">
            <span className="text-center text-xs font-medium text-muted-foreground">
              {formatDayHeader(day)}
            </span>
            <ShiftCell
              value={shifts[key] ?? null}
              disabled={!editable}
              onClick={() => onToggle(key)}
            />
          </div>
        );
      })}
    </div>
  );
}

export { cycleShift };

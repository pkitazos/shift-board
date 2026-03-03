import { cn } from "@/lib/utils";
import { ShiftType } from "@/types";
import type { ShiftType as ShiftTypeValue } from "@/types";

interface ShiftCellProps {
  value: ShiftTypeValue | null;
  disabled: boolean;
  onClick: () => void;
}

export function ShiftCell({ value, disabled, onClick }: ShiftCellProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-20 w-full items-end rounded-lg border transition-colors",
        disabled && "cursor-not-allowed opacity-40",
        !disabled && "hover:border-primary/50",
        value === ShiftType.FULL &&
          "border-pink-300 bg-pink-100 dark:border-pink-700 dark:bg-pink-900/30",
        value === ShiftType.HALF &&
          "border-amber-300 bg-amber-100 dark:border-amber-700 dark:bg-amber-900/30",
        !value && "border-border bg-muted/30",
      )}
    >
      <span
        className={cn(
          "w-full rounded-b-lg px-2 py-1 text-xs font-medium",
          value === ShiftType.FULL &&
            "h-full flex items-end rounded-lg bg-pink-200/50 text-pink-700 dark:bg-pink-800/30 dark:text-pink-300",
          value === ShiftType.HALF &&
            "h-1/2 flex items-end bg-amber-200/50 text-amber-700 dark:bg-amber-800/30 dark:text-amber-300",
        )}
      >
        {value === ShiftType.FULL && "Full"}
        {value === ShiftType.HALF && "Half"}
      </span>
    </button>
  );
}

/** Cycle through: null → full → half → null */
export function cycleShift(
  current: ShiftTypeValue | null,
): ShiftTypeValue | null {
  if (!current) return ShiftType.FULL;
  if (current === ShiftType.FULL) return ShiftType.HALF;
  return null;
}

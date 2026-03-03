import { cn } from "@/lib/utils";
import { ShiftType } from "@/types";
import type { ShiftType as ShiftTypeValue } from "@/types";
import { X } from "lucide-react";

interface ShiftTagProps {
  name: string;
  type: ShiftTypeValue;
  className?: string;
  onCycleType?: () => void;
  onRemove?: () => void;
}

export function ShiftTag({
  name,
  type,
  className,
  onCycleType,
  onRemove,
}: ShiftTagProps) {
  const interactive = !!onCycleType || !!onRemove;

  return (
    <span
      className={cn(
        "group/tag h-8 inline-flex items-center gap-0.5 truncate rounded-md px-1.5 py-0.5 text-xs font-medium justify-between cursor-pointer transition-colors duration-100",
        className,
        type === ShiftType.FULL &&
          "bg-pink-100 hover:bg-pink-200 text-pink-700 dark:bg-pink-900/30 hover:dark:bg-pink-900/40 dark:text-pink-300",
        type === ShiftType.HALF &&
          "bg-amber-100 hover:bg-amber-200 text-amber-700 dark:bg-amber-900/30 hover:dark:bg-amber-900/40 dark:text-amber-300",
      )}
      onClick={onCycleType}
    >
      <span className="w-full">{name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className={cn(
            "ml-0.5 inline-flex shrink-0 items-center justify-center rounded-sm p-0.5 opacity-0 transition-opacity group-hover/tag:opacity-100",
            type === ShiftType.FULL &&
              "hover:bg-pink-400/30 hover:dark:bg-pink-900/50",
            type === ShiftType.HALF &&
              "hover:bg-amber-400/40 hover:dark:bg-amber-900/50",
            interactive && "cursor-pointer",
          )}
        >
          <X className="size-3" />
        </button>
      )}
    </span>
  );
}

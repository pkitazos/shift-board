import * as motion from "motion/react-client";
import { cn } from "@/lib/utils";
import { SHIFT_TYPES } from "@/types";
import type { ShiftType } from "@/types";
import { X } from "lucide-react";
import { useLongPress } from "@/hooks/useLongPress";
import { shiftCellVariant } from "./ShiftCell";

interface MobileShiftTagProps {
  name: string;
  type: ShiftType;
  deleteMode: boolean;
  onCycleType: () => void;
  onRemove: () => void;
  onLongPress: () => void;
}

export function MobileShiftTag({
  name,
  type,
  deleteMode,
  onCycleType,
  onRemove,
  onLongPress,
}: MobileShiftTagProps) {
  const longPressHandlers = useLongPress(onLongPress);

  const handleClick = () => {
    if (!deleteMode) onCycleType();
  };

  return (
    <motion.button
      type="button"
      className={cn(
        "relative min-w-0 select-none rounded-lg px-2 py-2 text-left text-xs font-medium transition-colors",
        "touch-manipulation",
        shiftCellVariant({ variant: type }),
        type === SHIFT_TYPES.FULL &&
          "bg-pink-100 text-pink-700 active:bg-pink-200 dark:bg-pink-900/30 dark:text-pink-300",
        type === SHIFT_TYPES.HALF &&
          "bg-amber-100 text-amber-700 active:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300",
      )}
      onClick={handleClick}
      whileTap={deleteMode ? undefined : { scale: 1.05 }}
      {...longPressHandlers}
    >
      <span className="block truncate">{name}</span>
      <span className="block text-[10px] opacity-60">
        {type === SHIFT_TYPES.FULL ? "Full" : "Half"}
      </span>

      {deleteMode && (
        <div
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.stopPropagation();
              onRemove();
            }
          }}
          className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white shadow-sm"
        >
          <X className="size-3" />
        </div>
      )}
    </motion.button>
  );
}

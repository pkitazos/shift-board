import * as motion from "motion/react-client";
import { cn } from "@/lib/utils";
import { SHIFT_TYPES } from "@/types";
import type { ShiftType } from "@/types";
import { cva } from "class-variance-authority";

interface ShiftCellProps {
  value: ShiftType | null;
  disabled: boolean;
  onClick: () => void;
}

export const shiftCellVariant = cva(
  "rounded-lg border border-border bg-muted/30 hover:bg-muted/90 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40",
  {
    variants: {
      variant: {
        [SHIFT_TYPES.FULL]:
          "text-pink-700 bg-pink-200/50 border-pink-300 hover:bg-pink-200/75 dark:text-pink-300 dark:dark:bg-pink-800/30 dark:border-pink-700 hover:dark:bg-pink-800/40",
        [SHIFT_TYPES.HALF]:
          "text-amber-700 bg-amber-200/50 border-amber-300 hover:bg-amber-200/75 dark:text-amber-700 dark:bg-amber-900/30 dark:border-amber-700 hover:dark:bg-amber-900/40",
      },
    },
  },
);

export function ShiftCell({ value, disabled, onClick }: ShiftCellProps) {
  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "group flex h-20 w-full items-end rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        shiftCellVariant({ variant: value }),
      )}
      whileTap={{ scale: 1.05 }}
    >
      <span
        className={cn(
          "w-full rounded-b-md px-2 py-1 text-xs font-medium h-full flex items-end",
          value === SHIFT_TYPES.HALF &&
            "h-1/2 bg-amber-200/50 group-hover:bg-amber-300/50",
        )}
      >
        {value === SHIFT_TYPES.FULL && "Full"}
        {value === SHIFT_TYPES.HALF && "Half"}
      </span>
    </motion.button>
  );
}

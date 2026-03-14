import * as motion from "motion/react-client";
import { cn } from "@/lib/utils";
import { shiftLabel, shiftMeta, buildShiftVariants } from "@/lib/shift-config";
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
      variant: buildShiftVariants(),
    },
  },
);

export function ShiftCell({ value, disabled, onClick }: ShiftCellProps) {
  const meta = value ? shiftMeta(value) : null;

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
          meta?.innerColor,
        )}
      >
        {value ? shiftLabel(value) : null}
      </span>
    </motion.button>
  );
}

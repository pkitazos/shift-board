import { X } from "lucide-react";
import * as motion from "motion/react-client";
import { cn } from "@/lib/utils";
import { shiftMeta } from "@/lib/shift-config";
import type { ShiftType } from "@/types";
import { shiftCellVariant } from "./ShiftCell";

interface ShiftTagProps {
  name: string;
  type: ShiftType;
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
  return (
    <motion.button
      type="button"
      className={cn(
        "group/tag h-8 inline-flex items-center gap-0.5 truncate rounded-md border px-1.5 py-0.5 text-left text-xs font-medium justify-between cursor-pointer transition-colors duration-100",
        shiftCellVariant({ variant: type }),
        className,
      )}
      onClick={onCycleType}
      whileTap={{ scale: 1.05 }}
    >
      <span className="w-full">{name}</span>
      {onRemove && (
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
          className={cn(
            "ml-0.5 inline-flex shrink-0 items-center justify-center rounded-sm p-0.5 opacity-0 transition-opacity group-hover/tag:opacity-100",
            shiftMeta(type).hoverColor,
          )}
        >
          <X className="size-3" />
        </div>
      )}
    </motion.button>
  );
}

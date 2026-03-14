import * as motion from "motion/react-client";
import { cn } from "@/lib/utils";
import { shiftLabel, shiftMeta } from "@/lib/shift-config";
import type { ShiftType } from "@/types";
import { X } from "lucide-react";
import { useLongPress } from "@/hooks/useLongPress";
import { shiftCellVariant } from "./ShiftCell";

interface MobileShiftTagProps {
  index: number;
  name: string;
  type: ShiftType;
  deleteMode: boolean;
  onCycleType: () => void;
  onRemove: () => void;
  onLongPress: () => void;
}

export function MobileShiftTag({
  index,
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
      className={cn(
        "relative min-w-0 select-none rounded-lg px-2 py-2 text-left text-xs font-medium transition-colors",
        "touch-manipulation",
        shiftCellVariant({ variant: type }),
        shiftMeta(type).mobileColor,
      )}
      whileTap={deleteMode ? { scale: 1 } : { scale: 1.05 }}
      animate={
        deleteMode
          ? {
              scale: [1, 1.001, 1, 0.999, 1],
              rotate: [-2, 2, -2],
            }
          : { rotate: 0 }
      }
      transition={
        deleteMode
          ? {
              repeat: Infinity,
              repeatType: "loop",
              duration: 0.2 + index * 0.03,
              ease: "easeInOut",
              delay: index * 0.05,
            }
          : {}
      }
      onClick={handleClick}
      {...longPressHandlers}
    >
      <span className="block truncate">{name}</span>
      <span className="block text-[10px] opacity-60">
        {shiftLabel(type)}
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
          className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-muted-foreground text-white shadow-sm"
        >
          <X className="size-3" />
        </div>
      )}
    </motion.button>
  );
}

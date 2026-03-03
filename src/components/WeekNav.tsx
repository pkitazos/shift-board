import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getWeekNumber } from "@/lib/dates";
import { format } from "date-fns";

interface WeekNavProps {
  weekStart: Date;
  onPrev: () => void;
  onNext: () => void;
}

export function WeekNav({ weekStart, onPrev, onNext }: WeekNavProps) {
  const weekNum = getWeekNumber(weekStart);
  const year = format(weekStart, "yyyy");

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon-sm" onClick={onPrev}>
        <ChevronLeft />
      </Button>
      <span className="min-w-32 text-center text-sm font-medium">
        Week {weekNum}, {year}
      </span>
      <Button variant="outline" size="icon-sm" onClick={onNext}>
        <ChevronRight />
      </Button>
    </div>
  );
}

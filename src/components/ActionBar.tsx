import type { ReactNode } from "react";
import type { ShiftChange } from "@/components/ChangesSummary";
import type { UserChanges } from "@/components/ChangesSummary";

interface ChangeCounts {
  additions: number;
  removals: number;
  modifications: number;
}

interface ActionBarProps extends ChangeCounts {
  children: ReactNode;
}

export function countChanges(changes: ShiftChange[]): ChangeCounts {
  return changes.reduce(
    (acc, c) => {
      if (c.from === null && c.to !== null) acc.additions++;
      else if (c.to === null && c.from !== null) acc.removals++;
      else if (c.from !== null && c.to !== null) acc.modifications++;
      return acc;
    },
    { additions: 0, removals: 0, modifications: 0 },
  );
}

export function countAdminChanges(groups: UserChanges[]): ChangeCounts {
  return countChanges(groups.flatMap((g) => g.changes));
}

function ChangeLabel({ additions, removals, modifications }: ChangeCounts) {
  const parts: ReactNode[] = [];

  if (additions > 0)
    parts.push(
      <span key="add" className="text-emerald-400">
        +{additions}
      </span>,
    );
  if (removals > 0)
    parts.push(
      <span key="rem" className="text-red-400">
        −{removals}
      </span>,
    );
  if (modifications > 0)
    parts.push(
      <span key="mod" className="text-zinc-100/70 dark:text-zinc-900/70">
        ~{modifications}
      </span>,
    );

  return <span className="flex items-center gap-1.5 text-xs">{parts}</span>;
}

export function ActionBar({
  additions,
  removals,
  modifications,
  children,
}: ActionBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-[max(1.5rem,calc(env(safe-area-inset-bottom)+0.5rem))] z-50 flex justify-center">
      <div className="flex items-center gap-3 rounded-full bg-zinc-900/85 backdrop-blur-md dark:bg-zinc-100/85 py-1.5 pr-1.5 pl-4 shadow-lg">
        <ChangeLabel
          additions={additions}
          removals={removals}
          modifications={modifications}
        />
        {children}
      </div>
    </div>
  );
}

export const actionBarSaveClass =
  "rounded-full bg-white px-4 py-1.5 text-sm font-medium text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100 disabled:opacity-50 cursor-pointer";

export const actionBarDiscardClass =
  "rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-zinc-100 dark:text-zinc-900 dark:bg-zinc-900/20 cursor-pointer";

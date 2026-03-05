import type { ReactNode } from "react";
import { parseISO } from "date-fns";
import { ArrowRightIcon } from "lucide-react";
import { formatDayHeader } from "@/lib/dates";
import { SHIFT_TYPES, type ShiftType } from "@/types";
import type { GridState } from "@/lib/admin-grid";
import { shiftCellVariant } from "@/components/ShiftCell";
import { cn } from "@/lib/utils";
import { groupBy } from "@/lib/utils/group-by";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface ShiftChange {
  date: string;
  from: ShiftType | null;
  to: ShiftType | null;
}

export interface UserChanges {
  userDisplayName: string;
  changes: ShiftChange[];
}

export function buildEmployeeChanges(
  current: Record<string, ShiftType | null>,
  original: Record<string, ShiftType | null>,
): ShiftChange[] {
  const allKeys = new Set([...Object.keys(current), ...Object.keys(original)]);
  return [...allKeys]
    .filter((key) => (current[key] ?? null) !== (original[key] ?? null))
    .map((key) => ({
      date: key,
      from: original[key] ?? null,
      to: current[key] ?? null,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function buildAdminChanges(
  current: GridState,
  original: GridState,
): UserChanges[] {
  const allDates = new Set([...Object.keys(current), ...Object.keys(original)]);

  const userMap = new Map<
    string,
    { displayName: string; changes: ShiftChange[] }
  >();

  [...allDates].forEach((date) => {
    const cur = current[date] ?? [];
    const orig = original[date] ?? [];
    const origMap = new Map(orig.map((e) => [e.userId, e]));
    const curMap = new Map(cur.map((e) => [e.userId, e]));

    // Additions and type changes
    cur.forEach((entry) => {
      const origEntry = origMap.get(entry.userId);
      const fromType = origEntry?.type ?? null;
      if (fromType !== entry.type) {
        const record = userMap.get(entry.userId) ?? {
          displayName: entry.userName,
          changes: [],
        };
        record.changes.push({ date, from: fromType, to: entry.type });
        userMap.set(entry.userId, record);
      }
    });

    // Removals
    orig.forEach((entry) => {
      if (!curMap.has(entry.userId)) {
        const record = userMap.get(entry.userId) ?? {
          displayName: entry.userName,
          changes: [],
        };
        record.changes.push({ date, from: entry.type, to: null });
        userMap.set(entry.userId, record);
      }
    });
  });

  return [...userMap.values()]
    .map((u) => ({
      userDisplayName: u.displayName,
      changes: u.changes.sort((a, b) => a.date.localeCompare(b.date)),
    }))
    .sort((a, b) => a.userDisplayName.localeCompare(b.userDisplayName));
}

const badgeBase =
  "inline-flex w-10 justify-center items-center px-1.5 py-0.5 text-xs font-medium";

function ShiftBadge({ type }: { type: ShiftType | null }) {
  if (type === null) {
    return (
      <span
        className={cn(
          badgeBase,
          "text-muted-foreground bg-muted border border-muted-foreground/30 rounded-sm cursor-default",
        )}
      >
        Off
      </span>
    );
  }
  return (
    <span
      className={cn(
        badgeBase,
        shiftCellVariant({ variant: type }),
        "rounded-sm cursor-default",
      )}
    >
      {type === SHIFT_TYPES.FULL ? "Full" : "Half"}
    </span>
  );
}

function ChangeRow({ change }: { change: ShiftChange }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="w-12 text-xs font-medium min-w-16">
        {formatDayHeader(parseISO(change.date))}
      </span>
      <ShiftBadge type={change.from} />
      <ArrowRightIcon className="size-3 text-muted-foreground shrink-0" />
      <ShiftBadge type={change.to} />
    </div>
  );
}

function ScrollList({ children }: { children: ReactNode }) {
  return (
    <div className="changes-scroll max-h-60 overflow-y-auto">{children}</div>
  );
}

function GroupedSections<K extends string>({
  groups,
  sortKey,
  renderHeader,
  renderItem,
}: {
  groups: Record<K, { userDisplayName: string; change: ShiftChange }[]>;
  sortKey: (a: K, b: K) => number;
  renderHeader: (key: K) => ReactNode;
  renderItem: (
    value: { userDisplayName: string; change: ShiftChange },
    key: K,
  ) => ReactNode;
}) {
  const sortedKeys = (Object.keys(groups) as K[]).sort(sortKey);
  return (
    <ScrollList>
      {sortedKeys.map((key) => (
        <div key={key} className="mt-2 first:mt-0">
          {renderHeader(key)}
          {groups[key].map((v) => renderItem(v, key))}
        </div>
      ))}
    </ScrollList>
  );
}

function EmployeeChanges({ changes }: { changes: ShiftChange[] }) {
  return (
    <ScrollList>
      {changes.map((c) => (
        <ChangeRow key={c.date} change={c} />
      ))}
    </ScrollList>
  );
}

function AdminChanges({ groups }: { groups: UserChanges[] }) {
  const flatChanges = groups.flatMap((g) =>
    g.changes.map((c) => ({ userDisplayName: g.userDisplayName, change: c })),
  );

  const byDay = groupBy(flatChanges, (item) => item.change.date);
  const byEmployee = groupBy(flatChanges, (item) => item.userDisplayName);

  return (
    <Tabs defaultValue="by-day">
      <TabsList>
        <TabsTrigger value="by-day">By day</TabsTrigger>
        <TabsTrigger value="by-employee">By employee</TabsTrigger>
      </TabsList>
      <TabsContent value="by-day">
        <GroupedSections
          groups={byDay}
          sortKey={(a, b) => a.localeCompare(b)}
          renderHeader={(date) => (
            <p className="text-xs font-semibold text-muted-foreground">
              {formatDayHeader(parseISO(date))}
            </p>
          )}
          renderItem={(row) => (
            <div
              key={row.change.date + row.userDisplayName}
              className="flex items-center gap-2 py-1 pl-2"
            >
              <span className="text-xs min-w-16 truncate">
                {row.userDisplayName}
              </span>
              <ShiftBadge type={row.change.from} />
              <ArrowRightIcon className="size-3 text-muted-foreground shrink-0" />
              <ShiftBadge type={row.change.to} />
            </div>
          )}
        />
      </TabsContent>
      <TabsContent value="by-employee">
        <GroupedSections
          groups={byEmployee}
          sortKey={(a, b) => a.localeCompare(b)}
          renderHeader={(name) => (
            <p className="text-xs font-semibold text-muted-foreground">
              {name}
            </p>
          )}
          renderItem={(row) => (
            <div key={row.change.date} className="pl-2">
              <ChangeRow change={row.change} />
            </div>
          )}
        />
      </TabsContent>
    </Tabs>
  );
}

type ChangesSummaryProps =
  | { variant: "employee"; changes: ShiftChange[] }
  | { variant: "admin"; groups: UserChanges[] };

export function ChangesSummary(props: ChangesSummaryProps) {
  const isEmpty =
    props.variant === "employee"
      ? props.changes.length === 0
      : props.groups.length === 0;

  if (isEmpty) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        No changes to save
      </p>
    );
  }

  return props.variant === "employee" ? (
    <EmployeeChanges changes={props.changes} />
  ) : (
    <AdminChanges groups={props.groups} />
  );
}

import type { ShiftType } from "@/types";

interface ShiftTypeMeta {
  label: string;
  /** Tailwind classes for general UI (ShiftCell, ShiftTag, badges) */
  color: string;
  /** Tailwind classes for the hover X-button on ShiftTag */
  hoverColor: string;
  /** Tailwind classes for mobile tag overrides */
  mobileColor: string;
  /** Tailwind classes for the inner "half-height" span in ShiftCell */
  innerColor: string;
  /** Tailwind classes for the email template */
  emailColor: string;
  /** Sort/cycle order — lower numbers come first */
  order: number;
}

const SHIFT_TYPE_CONFIG: Record<ShiftType, ShiftTypeMeta> = {
  full: {
    label: "Full",
    color:
      "text-pink-700 bg-pink-200/50 border-pink-300 hover:bg-pink-200/75 dark:text-pink-300 dark:bg-pink-800/30 dark:border-pink-700 hover:dark:bg-pink-800/40",
    hoverColor: "hover:bg-pink-400/30 hover:dark:bg-pink-900/50",
    mobileColor:
      "bg-pink-100 text-pink-700 active:bg-pink-200 dark:bg-pink-900/30 dark:text-pink-300",
    innerColor: "",
    emailColor: "text-pink-700 bg-pink-100",
    order: 0,
  },
  half: {
    label: "Half",
    color:
      "text-amber-700 bg-amber-200/50 border-amber-300 hover:bg-amber-200/75 dark:text-amber-500 dark:bg-amber-900/30 dark:border-amber-700 hover:dark:bg-amber-900/40",
    hoverColor: "hover:bg-amber-400/40 hover:dark:bg-amber-900/50",
    mobileColor:
      "bg-amber-100 text-amber-700 active:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300",
    innerColor:
      "h-1/2 bg-amber-200/50 group-hover:bg-amber-300/50 dark:bg-amber-900/30 group-hover:dark:bg-amber-900/40",
    emailColor: "text-amber-700 bg-amber-100",
    order: 1,
  },
};

/** All shift types sorted by their configured order. */
const ORDERED_TYPES: ShiftType[] = (
  Object.entries(SHIFT_TYPE_CONFIG) as [ShiftType, ShiftTypeMeta][]
)
  .sort(([, a], [, b]) => a.order - b.order)
  .map(([type]) => type);

/** Display label for a shift type. */
export function shiftLabel(type: ShiftType): string {
  return SHIFT_TYPE_CONFIG[type].label;
}

/** Shift types in order. */
export function shiftOrder(): ShiftType[] {
  return ORDERED_TYPES;
}

/** Full config for a shift type. */
export function shiftMeta(type: ShiftType): ShiftTypeMeta {
  return SHIFT_TYPE_CONFIG[type];
}

/** The first shift type in order (used as default when adding employees). */
export function defaultShiftType(): ShiftType {
  return ORDERED_TYPES[0];
}

/** Employee cycling: null → first → second → ... → null */
export function cycleShift(current: ShiftType | null): ShiftType | null {
  if (!current) return ORDERED_TYPES[0];
  const idx = ORDERED_TYPES.indexOf(current);
  return idx < ORDERED_TYPES.length - 1 ? ORDERED_TYPES[idx + 1] : null;
}

/** Admin grid cycling: wraps around without null (first → second → ... → first) */
export function cycleGridShift(current: ShiftType): ShiftType {
  const idx = ORDERED_TYPES.indexOf(current);
  return ORDERED_TYPES[(idx + 1) % ORDERED_TYPES.length];
}

/** Build CVA variant entries from config. */
export function buildShiftVariants(): Record<ShiftType, string> {
  return Object.fromEntries(
    ORDERED_TYPES.map((type) => [type, SHIFT_TYPE_CONFIG[type].color]),
  ) as Record<ShiftType, string>;
}

/** Build email color mapping from config (includes "off"). */
export function buildEmailTypeClasses(): Record<ShiftType | "off", string> {
  const entries = ORDERED_TYPES.map(
    (type) => [type, SHIFT_TYPE_CONFIG[type].emailColor] as const,
  );
  return Object.fromEntries([
    ...entries,
    ["off", "text-gray-500 bg-gray-100"],
  ]) as Record<ShiftType | "off", string>;
}

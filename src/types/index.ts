import type { Tables, Enums } from "@/types/database";

export const SHIFT_TYPES = {
  FULL: "full",
  HALF: "half",
} as const;

export type ShiftType = Enums<"shift_type">;

export type User = Tables<"users">;
export type Shift = Tables<"shifts">;

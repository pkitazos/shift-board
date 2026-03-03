import type { Tables, Enums } from "@/types/database";

export const ShiftType = {
  FULL: "full",
  HALF: "half",
} as const;

export type ShiftType = Enums<"shift_type">;

export type User = Tables<"users">;
export type Shift = Tables<"shifts">;

export const ShiftType = {
  FULL: "full",
  HALF: "half",
} as const;

export type ShiftType = (typeof ShiftType)[keyof typeof ShiftType];

export interface User {
  id: string;
  email: string;
  name: string | null;
  is_admin: boolean;
  auth_id: string | null;
  created_at: string;
}

export interface Shift {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  type: ShiftType;
  created_at: string;
  updated_at: string;
}

import { db } from "@/lib/supabase";
import { AppError } from "@/lib/errors";
import type { User } from "@/types";

export type BasicUser = Pick<User, "id" | "name" | "email" | "nickname">;

/** Fetch all users (basic profile). */
export async function fetchAllUsers(): Promise<BasicUser[]> {
  return db
    .from("users")
    .select("id, name, email, nickname")
    .order("name")
    .then(({ data, error }) => {
      if (error) throw new AppError("Could not load users", error);
      return data;
    });
}

/** Fetch all users (full profile). */
export async function fetchAllUsersFull(): Promise<User[]> {
  return db
    .from("users")
    .select("*")
    .order("name")
    .overrideTypes<User[]>()
    .then(({ data, error }) => {
      if (error) throw new AppError("Could not load users", error);
      return data;
    });
}

/** Add a new user by email. */
export async function addUser(email: string): Promise<User> {
  return db
    .from("users")
    .insert({ email })
    .select("*")
    .single()
    .overrideTypes<User>()
    .then(({ data, error }) => {
      if (error) throw new AppError("Could not add user", error);
      return data;
    });
}

/** Remove a user by id. Shifts are deleted via ON DELETE CASCADE. */
export async function removeUser(userId: string): Promise<void> {
  return db
    .from("users")
    .delete()
    .eq("id", userId)
    .then(({ error }) => {
      if (error) throw new AppError("Could not remove user", error);
    });
}

/** Calendar/compact display: nickname ?? name ?? email */
export function displayName(user: {
  nickname?: string | null;
  name?: string | null;
  email: string;
}): string {
  return user.nickname ?? user.name ?? user.email;
}

/** Full context display: "nickname (name)" or name ?? email */
export function fullName(user: {
  nickname?: string | null;
  name?: string | null;
  email: string;
}): string {
  const dn = user.nickname ?? user.name ?? user.email;
  if (user.nickname && user.name) return `${user.nickname} (${user.name})`;
  return dn;
}

/** Update a user's nickname. */
export async function updateUserNickname(
  userId: string,
  nickname: string | null,
): Promise<void> {
  return db
    .from("users")
    .update({ nickname })
    .eq("id", userId)
    .then(({ error }) => {
      if (error) throw new AppError("Could not update nickname", error);
    });
}

/** Toggle a user's admin status. */
export async function updateUserAdmin(
  userId: string,
  isAdmin: boolean,
): Promise<void> {
  return db
    .from("users")
    .update({ is_admin: isAdmin })
    .eq("id", userId)
    .then(({ error }) => {
      if (error) throw new AppError("Could not update admin status", error);
    });
}

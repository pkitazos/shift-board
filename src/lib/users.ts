import { db } from "@/lib/supabase";
import type { User } from "@/types";

export type BasicUser = Pick<User, "id" | "name" | "email">;

/** Fetch all users (basic profile). */
export function fetchAllUsers(): Promise<BasicUser[]> {
  return Promise.resolve(
    db
      .from("users")
      .select("id, name, email")
      .order("name")
      .then(({ data, error }) => {
        if (error) throw error;
        return data;
      }),
  );
}

/** Fetch all users (full profile). */
export function fetchAllUsersFull(): Promise<User[]> {
  return Promise.resolve(
    db
      .from("users")
      .select("*")
      .order("name")
      .then(({ data, error }) => {
        if (error) throw error;
        return data;
      }),
  );
}

/** Add a new user by email. */
export function addUser(email: string): Promise<User> {
  return Promise.resolve(
    db
      .from("users")
      .insert({ email })
      .select("*")
      .single()
      .then(({ data, error }) => {
        if (error) throw error;
        return data;
      }),
  );
}

/** Remove a user by id. Shifts are deleted via ON DELETE CASCADE. */
export function removeUser(userId: string): Promise<void> {
  return Promise.resolve(
    db
      .from("users")
      .delete()
      .eq("id", userId)
      .then(({ error }) => {
        if (error) throw error;
      }),
  );
}

/** Toggle a user's admin status. */
export function updateUserAdmin(
  userId: string,
  isAdmin: boolean,
): Promise<void> {
  return Promise.resolve(
    db
      .from("users")
      .update({ is_admin: isAdmin })
      .eq("id", userId)
      .then(({ error }) => {
        if (error) throw error;
      }),
  );
}

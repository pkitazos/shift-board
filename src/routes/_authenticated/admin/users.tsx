import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import * as v from "valibot";
import { Trash2, ShieldCheck, ShieldOff, UserPlus } from "lucide-react";
import {
  fetchAllUsersFull,
  addUser,
  removeUser,
  updateUserAdmin,
} from "@/lib/users";
import { useAuth } from "@/lib/auth";
import type { User } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsersPage,
});

const EmailSchema = v.pipe(
  v.string(),
  v.trim(),
  v.toLowerCase(),
  v.email("Please enter a valid email address."),
);

function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(() => {
    setLoading(true);
    fetchAllUsersFull()
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleAdd = () => {
    const result = v.safeParse(EmailSchema, email);
    if (!result.success) {
      setError(result.issues[0].message);
      return;
    }

    const validated = result.output;

    if (users.some((u) => u.email === validated)) {
      setError("This email is already added.");
      return;
    }

    setAdding(true);
    setError(null);
    addUser(validated)
      .then((newUser) => {
        setUsers((prev) => [...prev, newUser]);
        setEmail("");
      })
      .catch(() =>
        setError("Failed to add user. Check the email and try again."),
      )
      .finally(() => setAdding(false));
  };

  const handleRemove = (userId: string) => {
    removeUser(userId).then(() =>
      setUsers((prev) => prev.filter((u) => u.id !== userId)),
    );
  };

  const handleToggleAdmin = (userId: string, currentlyAdmin: boolean) => {
    const newValue = !currentlyAdmin;
    updateUserAdmin(userId, newValue).then(() =>
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_admin: newValue } : u)),
      ),
    );
  };

  return (
    <section className="mx-auto max-w-2xl p-4">
      <h1 className="mb-6 text-xl font-bold">User Management</h1>

      <form
        className="mb-6 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          handleAdd();
        }}
      >
        <Input
          type="email"
          placeholder="employee@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(null);
          }}
          className="flex-1"
          required
        />
        <Button type="submit" disabled={adding || !email.trim()}>
          <UserPlus className="size-4" />
          {adding ? "Adding..." : "Add"}
        </Button>
      </form>

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      {loading ? (
        <p className="text-muted-foreground">Loading users...</p>
      ) : users.length === 0 ? (
        <p className="text-muted-foreground">No users yet.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border">
          {users.map((u) => {
            const isSelf = u.id === currentUser?.id;

            return (
              <li
                key={u.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">
                      {u.name ?? u.email}
                    </span>
                    {u.is_admin && (
                      <Badge variant="secondary" className="shrink-0">
                        Admin
                      </Badge>
                    )}
                    {!u.auth_id && (
                      <Badge variant="outline" className="shrink-0">
                        Pending
                      </Badge>
                    )}
                  </div>
                  {u.name && (
                    <p className="truncate text-xs text-muted-foreground">
                      {u.email}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isSelf}
                    title={
                      isSelf
                        ? "You can't change your own admin status"
                        : u.is_admin
                          ? "Remove admin"
                          : "Make admin"
                    }
                    onClick={() => handleToggleAdmin(u.id, u.is_admin)}
                  >
                    {u.is_admin ? (
                      <ShieldOff className="size-4" />
                    ) : (
                      <ShieldCheck className="size-4" />
                    )}
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isSelf}
                          title={
                            isSelf ? "You can't remove yourself" : "Remove user"
                          }
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      }
                    />
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove user?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove {u.name ?? u.email} and delete all
                          their shifts. This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-white hover:bg-destructive/90"
                          onClick={() => handleRemove(u.id)}
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

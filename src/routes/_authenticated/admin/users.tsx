import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import * as v from "valibot";
import { toast } from "sonner";
import { Trash2, ShieldCheck, ShieldOff, UserPlus } from "lucide-react";
import {
  fetchAllUsersFull,
  addUser,
  removeUser,
  updateUserAdmin,
  updateUserNickname,
  fullName,
} from "@/lib/users";
import { useAuth } from "@/providers/auth";
import { ToastError } from "@/components/ToastError";
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
  const [validationError, setValidationError] = useState<string | null>(null);

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
      setValidationError(result.issues[0].message);
      return;
    }

    const validated = result.output;

    if (users.some((u) => u.email === validated)) {
      setValidationError("This email is already added.");
      return;
    }

    setAdding(true);
    setValidationError(null);

    toast.promise(addUser(validated), {
      loading: "Adding user...",
      success: (newUser) => {
        setUsers((prev) => [...prev, newUser]);
        setEmail("");
        return `${newUser.email} added`;
      },
      error: (err) => (
        <ToastError error={err} copy="Check the email and try again." />
      ),
      finally: () => setAdding(false),
    });
  };

  const handleRemove = (user: User) => {
    toast.promise(removeUser(user.id), {
      loading: `Removing ${fullName(user)}...`,
      success: () => {
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
        return `${fullName(user)} removed`;
      },
      error: (err) => <ToastError error={err} copy="Please try again." />,
    });
  };

  const handleToggleAdmin = (user: User) => {
    const newValue = !user.is_admin;
    const label = newValue ? "Granting" : "Revoking";

    toast.promise(updateUserAdmin(user.id, newValue), {
      loading: `${label} admin for ${fullName(user)}...`,
      success: () => {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === user.id ? { ...u, is_admin: newValue } : u,
          ),
        );
        return newValue
          ? `${fullName(user)} is now an admin`
          : `Admin removed from ${fullName(user)}`;
      },
      error: (err) => <ToastError error={err} />,
    });
  };

  const handleNicknameChange = (user: User, nickname: string) => {
    const trimmed = nickname.trim() || null;
    if (trimmed === (user.nickname ?? null)) return;

    toast.promise(updateUserNickname(user.id, trimmed), {
      loading: "Updating nickname...",
      success: () => {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, nickname: trimmed } : u)),
        );
        return "Nickname updated";
      },
      error: (err) => <ToastError error={err} />,
    });
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
            setValidationError(null);
          }}
          className="flex-1"
          required
        />
        <Button type="submit" disabled={adding || !email.trim()}>
          <UserPlus className="size-4" />
          {adding ? "Adding..." : "Add"}
        </Button>
      </form>

      {validationError && (
        <p className="mb-4 text-sm text-destructive">{validationError}</p>
      )}

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
                <div className="min-w-0 flex-1 grid grid-cols-2 w-full gap-2">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">
                        {u.name || u.email}
                      </span>
                      {u.is_admin && (
                        <Badge className="shrink-0 bg-primary/15 text-primary">
                          Admin
                        </Badge>
                      )}
                      {!u.auth_id && (
                        <Badge className="shrink-0 bg-sky-200/30 text-sky-700">
                          Pending
                        </Badge>
                      )}
                    </div>
                    {(u.name || u.nickname) && (
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {u.email}
                      </p>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <Input
                      placeholder="nickname"
                      defaultValue={u.nickname ?? ""}
                      className="h-7 text-xs"
                      onBlur={(e) => handleNicknameChange(u, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                      }}
                    />
                    <p className="mt-0.5 w-full text-[10px] text-muted-foreground">
                      3–8 chars works best
                    </p>
                  </div>
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
                    onClick={() => handleToggleAdmin(u)}
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
                          This will remove {fullName(u)} and delete all their
                          shifts. This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-white hover:bg-destructive/90"
                          onClick={() => handleRemove(u)}
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

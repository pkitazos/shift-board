import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsersPage,
});

function AdminUsersPage() {
  return (
    <section className="p-4">
      <h1 className="text-xl font-bold">User Management</h1>
    </section>
  );
}

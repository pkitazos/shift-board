import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsersPage,
});

function AdminUsersPage() {
  return (
    <section>
      <h1>AdminUsers</h1>
    </section>
  );
}

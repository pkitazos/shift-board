import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/")({
  component: AdminPage,
});

function AdminPage() {
  return (
    <section>
      <h1>Admin</h1>
    </section>
  );
}

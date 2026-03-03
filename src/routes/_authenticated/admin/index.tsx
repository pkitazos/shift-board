import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminPage,
});

function AdminPage() {
  return (
    <section className="p-4">
      <h1 className="text-xl font-bold">Admin Calendar</h1>
    </section>
  );
}

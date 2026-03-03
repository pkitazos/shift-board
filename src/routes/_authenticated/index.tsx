import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/")({
  component: IndexPage,
});

function IndexPage() {
  const { user } = useAuth();

  return (
    <section className="p-4">
      <h1 className="text-xl font-bold">Employee View</h1>
      <p className="text-muted-foreground">
        Welcome, {user!.name ?? user!.email}
      </p>
    </section>
  );
}

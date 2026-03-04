import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { AuthProvider } from "@/providers/auth";
import { ThemeProvider } from "@/providers/theme";
import { Toaster } from "@/components/ui/sonner";

export const Route = createRootRoute({
  component: () => (
    <ThemeProvider>
      <AuthProvider>
        <Outlet />
        <Toaster position="bottom-center" richColors closeButton />
        <TanStackRouterDevtools />
      </AuthProvider>
    </ThemeProvider>
  ),
  notFoundComponent: () => <div>404 Not Found</div>,
});

import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";

export const Route = createRootRoute({
  component: () => (
    <ThemeProvider>
      <AuthProvider>
        <Outlet />
        <TanStackRouterDevtools />
      </AuthProvider>
    </ThemeProvider>
  ),
  notFoundComponent: () => <div>404 Not Found</div>,
});

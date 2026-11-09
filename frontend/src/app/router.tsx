import { createBrowserRouter, type RouteObject } from "react-router";

import { NAV_ITEMS } from "./navigation";
import { RootLayout } from "./layouts/RootLayout";
import { ComingSoonPage } from "./pages/ComingSoonPage";
import { DesignSystemPage } from "./pages/DesignSystemPage";
import { HomePage } from "./pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { RouteErrorPage } from "./pages/RouteErrorPage";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { PrivacyPolicyPage } from "@/features/auth/pages/PrivacyPolicyPage";
import { RegisterPage } from "@/features/auth/pages/RegisterPage";
import { AuthLayout } from "./layouts/AuthLayout";
import { PublicLayout } from "./layouts/PublicLayout";

// Every navigation entry except the dashboard gets a placeholder page for now.
const placeholderRoutes = NAV_ITEMS.filter((item) => item.to !== "/").map(
  (item) => ({
    path: item.to.slice(1),
    element: <ComingSoonPage title={item.label} />,
  }),
);

export const routes: RouteObject[] = [
  {
    ErrorBoundary: RouteErrorPage,
    children: [
      {
        Component: AuthLayout,
        children: [
          { path: "inscription", Component: RegisterPage },
          { path: "connexion", Component: LoginPage },
        ],
      },
      {
        Component: PublicLayout,
        children: [{ path: "confidentialite", Component: PrivacyPolicyPage }],
      },
      {
        path: "/",
        Component: RootLayout,
        children: [
          { index: true, Component: HomePage },
          ...placeholderRoutes,
          ...(import.meta.env.DEV
            ? [{ path: "design", Component: DesignSystemPage }]
            : []),
          { path: "*", Component: NotFoundPage },
        ],
      },
    ],
  },
];

export const router = createBrowserRouter(routes);

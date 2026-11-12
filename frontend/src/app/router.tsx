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
import { CheckEmailPage } from "@/features/auth/pages/CheckEmailPage";
import { VerifyEmailPage } from "@/features/auth/pages/VerifyEmailPage";
import { RedirectIfAuthenticated } from "@/features/auth/components/RedirectIfAuthenticated";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { OnboardingPage } from "@/features/auth/pages/OnboardingPage";
import { ForgotPasswordPage } from "@/features/auth/pages/ForgotPasswordPage";

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
      // Only for visitors.
      {
        Component: RedirectIfAuthenticated,
        children: [
          {
            Component: AuthLayout,
            children: [
              { path: "inscription", Component: RegisterPage },
              { path: "connexion", Component: LoginPage },
              { path: "mot-de-passe-oublie", Component: ForgotPasswordPage },
            ],
          },
        ],
      },
      // Open to everyone.
      {
        Component: AuthLayout,
        children: [
          { path: "inscription/verification", Component: CheckEmailPage },
          { path: "verifier-email", Component: VerifyEmailPage },
        ],
      },
      {
        Component: PublicLayout,
        children: [{ path: "confidentialite", Component: PrivacyPolicyPage }],
      },
      // Logged-in users only.
      {
        Component: RequireAuth,
        children: [
          {
            Component: AuthLayout,
            children: [{ path: "bienvenue", Component: OnboardingPage }],
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
    ],
  },
];

export const router = createBrowserRouter(routes);

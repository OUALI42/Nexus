import { createBrowserRouter } from "react-router";

import { RootLayout } from "./layouts/RootLayout";
import { HomePage } from "./pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { RouteErrorPage } from "./pages/RouteErrorPage";
import { DesignSystemPage } from "./pages/DesignSystemPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    ErrorBoundary: RouteErrorPage,
    children: [
      { index: true, Component: HomePage },
      ...(import.meta.env.DEV
        ? [{ path: "design", Component: DesignSystemPage }]
        : []),
      { path: "*", Component: NotFoundPage },
    ],
  },
]);

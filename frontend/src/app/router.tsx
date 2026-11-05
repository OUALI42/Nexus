import { createBrowserRouter } from "react-router";

import { NAV_ITEMS } from "./navigation";
import { RootLayout } from "./layouts/RootLayout";
import { ComingSoonPage } from "./pages/ComingSoonPage";
import { DesignSystemPage } from "./pages/DesignSystemPage";
import { HomePage } from "./pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { RouteErrorPage } from "./pages/RouteErrorPage";

// Every navigation entry except the dashboard gets a placeholder page for now.
const placeholderRoutes = NAV_ITEMS.filter((item) => item.to !== "/").map(
  (item) => ({
    path: item.to.slice(1),
    element: <ComingSoonPage title={item.label} />,
  }),
);

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    ErrorBoundary: RouteErrorPage,
    children: [
      { index: true, Component: HomePage },
      ...placeholderRoutes,
      ...(import.meta.env.DEV
        ? [{ path: "design", Component: DesignSystemPage }]
        : []),
      { path: "*", Component: NotFoundPage },
    ],
  },
]);

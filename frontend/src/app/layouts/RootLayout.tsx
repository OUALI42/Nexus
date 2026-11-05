import { useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router";

import { BottomNav } from "./BottomNav";
import { Sidebar } from "./Sidebar";

export function RootLayout() {
  const { pathname } = useLocation();
  const previousPathname = useRef(pathname);

  // Client-side navigation is silent for screen readers:
  // move the focus to the new page title.
  useEffect(() => {
    if (previousPathname.current === pathname) {
      return;
    }
    previousPathname.current = pathname;
    document.querySelector<HTMLElement>("#contenu h1")?.focus();
  }, [pathname]);

  return (
    <div className="min-h-dvh md:flex">
      <a
        href="#contenu"
        className="sr-only z-60 rounded-control bg-surface px-4 py-3 font-bold text-primary shadow-card focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Aller au contenu principal
      </a>

      <Sidebar />

      <main
        id="contenu"
        tabIndex={-1}
        className="min-w-0 flex-1 px-4 pt-6 pb-[calc(var(--nx-bottom-bar)+1.5rem)] focus:outline-none md:px-10 md:py-8"
      >
        <div className="mx-auto w-full max-w-6xl">
          <Outlet />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

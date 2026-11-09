import { Link, Outlet } from "react-router";

import { Logo } from "@/shared/ui/Logo";

import { SkipLink } from "./SkipLink";
import { useFocusTitleOnNavigate } from "./useFocusTitleOnNavigate";

export function PublicLayout() {
  useFocusTitleOnNavigate();

  return (
    <div className="min-h-dvh">
      <SkipLink />

      <header className="bg-nav-from px-6 py-4 text-on-brand">
        <Link
          to="/"
          aria-label="Nexus, accueil"
          className="inline-flex min-h-tap items-center text-on-brand no-underline focus-visible:outline-nav-focus"
        >
          <Logo className="text-2xl" />
        </Link>
      </header>

      <main
        id="contenu"
        tabIndex={-1}
        className="mx-auto max-w-3xl px-4 py-10 focus:outline-none"
      >
        <Outlet />
      </main>
    </div>
  );
}

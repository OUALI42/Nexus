import { Outlet } from "react-router";

import { Logo } from "@/shared/ui/Logo";

import { SkipLink } from "./SkipLink";
import { useFocusTitleOnNavigate } from "./useFocusTitleOnNavigate";

export function AuthLayout() {
  useFocusTitleOnNavigate();

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,35rem)_1fr]">
      <SkipLink />

      <header className="flex flex-col justify-between gap-6 bg-nav-from px-6 py-5 text-on-brand lg:p-14">
        <Logo className="text-2xl lg:text-3xl" />
        <p className="hidden text-3xl leading-tight font-extrabold lg:block">
          Tout ton travail de révision, au même endroit.
        </p>
      </header>

      <main
        id="contenu"
        tabIndex={-1}
        className="flex justify-center px-4 py-10 focus:outline-none lg:items-center"
      >
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

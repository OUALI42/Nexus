import { Ellipsis } from "lucide-react";
import { useState } from "react";
import { NavLink, useLocation } from "react-router";

import { NAV_ITEMS } from "@/app/navigation";
import { cx } from "@/shared/lib/cx";
import { ThemeSwitcher } from "@/shared/theme/ThemeSwitcher";
import { Modal } from "@/shared/ui/Modal";
import { LogoutButton } from "@/features/auth/components/LogoutButton";

const TAB =
  "relative flex min-h-tap w-full flex-col items-center justify-center gap-1 text-xs font-semibold text-fg-muted no-underline";
const TAB_ACTIVE = "font-extrabold text-primary";

function ActiveBar() {
  return (
    <span
      aria-hidden="true"
      className="absolute inset-x-4 bottom-1 h-[3px] rounded-full bg-primary"
    />
  );
}

export function BottomNav() {
  const [isMoreOpen, setMoreOpen] = useState(false);
  const { pathname } = useLocation();

  const barItems = NAV_ITEMS.filter((item) => item.inBottomBar);
  const moreItems = NAV_ITEMS.filter((item) => !item.inBottomBar);
  const isMoreActive = moreItems.some((item) => pathname.startsWith(item.to));

  function closeMore() {
    setMoreOpen(false);
  }

  return (
    <>
      <nav
        aria-label="Navigation principale"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="flex h-[var(--nx-bottom-bar)] px-1">
          {barItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to} className="flex flex-1">
                <NavLink
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) => cx(TAB, isActive && TAB_ACTIVE)}
                >
                  {({ isActive }) => (
                    <>
                      <Icon aria-hidden="true" className="size-6" />
                      {item.shortLabel}
                      {isActive && <ActiveBar />}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
          <li className="flex flex-1">
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={() => {
                setMoreOpen(true);
              }}
              className={cx(TAB, isMoreActive && TAB_ACTIVE)}
            >
              <Ellipsis aria-hidden="true" className="size-6" />
              Plus
              {isMoreActive && (
                <>
                  {" "}
                  <span className="sr-only">(contient la page actuelle)</span>
                  <ActiveBar />
                </>
              )}
            </button>
          </li>
        </ul>
      </nav>

      <Modal open={isMoreOpen} onClose={closeMore} title="Plus">
        <div className="flex flex-col gap-5">
          <ul className="flex flex-col gap-1">
            {moreItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={closeMore}
                    className={({ isActive }) =>
                      cx(
                        "relative flex min-h-tap items-center gap-3 rounded-control px-3.5 font-semibold text-fg no-underline hover:bg-surface-muted",
                        isActive &&
                          "bg-surface-muted font-extrabold text-primary",
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span
                            aria-hidden="true"
                            className="absolute inset-y-2 left-0 w-1 rounded-full bg-primary"
                          />
                        )}
                        <Icon aria-hidden="true" className="size-5 shrink-0" />
                        {item.label}
                      </>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
          <ThemeSwitcher />
          <LogoutButton className="text-fg hover:bg-surface-muted" />
        </div>
      </Modal>
    </>
  );
}

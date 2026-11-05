import { NavLink } from "react-router";

import { NAV_ITEMS, SETTINGS_PATH, type NavItem } from "@/app/navigation";
import { cx } from "@/shared/lib/cx";
import { ThemeSwitcher } from "@/shared/theme/ThemeSwitcher";

export function Sidebar() {
  const mainItems = NAV_ITEMS.filter((item) => item.to !== SETTINGS_PATH);
  const settings = NAV_ITEMS.find((item) => item.to === SETTINGS_PATH);

  return (
    <aside className="sticky top-4 m-4 hidden h-[calc(100dvh-2rem)] w-sidebar shrink-0 flex-col gap-4 overflow-y-auto rounded-nav bg-linear-to-b from-nav-from via-nav-via to-nav-to p-4 text-nav-text md:flex">
      <p className="flex items-center gap-2.5 px-3.5 pt-2 pb-4 text-2xl font-extrabold text-on-brand">
        <svg
          aria-hidden="true"
          width="28"
          height="28"
          viewBox="0 0 28 28"
          fill="none"
          className="stroke-nav-accent"
          strokeWidth={2}
        >
          <circle cx="14" cy="14" r="4" />
          <circle cx="5" cy="6" r="2.5" />
          <circle cx="23" cy="8" r="2.5" />
          <circle cx="19" cy="23" r="2.5" />
          <path d="M11 12 7 8M18 12l3-3M15.5 18l2.5 3" />
        </svg>
        Nexus
      </p>

      <nav aria-label="Navigation principale" className="flex flex-1 flex-col">
        <ul className="flex flex-col gap-1.5">
          {mainItems.map((item) => (
            <li key={item.to}>
              <SidebarLink item={item} />
            </li>
          ))}
        </ul>
        {settings && (
          <ul className="mt-auto pt-4">
            <li>
              <SidebarLink item={settings} />
            </li>
          </ul>
        )}
      </nav>

      <ThemeSwitcher />
    </aside>
  );
}

function SidebarLink({ item }: { item: NavItem }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      className={({ isActive }) =>
        cx(
          "relative flex min-h-tap items-center gap-3 rounded-control px-3.5 font-semibold text-nav-text no-underline hover:bg-nav-active focus-visible:outline-nav-focus",
          isActive && "bg-nav-active font-extrabold text-on-brand",
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span
              aria-hidden="true"
              className="absolute inset-y-2 left-0 w-1 rounded-full bg-on-brand"
            />
          )}
          <Icon aria-hidden="true" className="size-5 shrink-0" />
          <span>{item.label}</span>
          {item.isAi && (
            <span
              aria-hidden="true"
              className="ml-auto rounded-md bg-nav-focus px-1.5 py-0.5 text-xs font-extrabold text-nav-from"
            >
              IA
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

import { NavLink } from "react-router";
import { LogoutButton } from "@/features/auth/components/LogoutButton";
import { useSession } from "@/features/auth/hooks";
import { NAV_ITEMS, SETTINGS_PATH, type NavItem } from "@/app/navigation";
import { cx } from "@/shared/lib/cx";
import { ThemeSwitcher } from "@/shared/theme/ThemeSwitcher";
import { Logo } from "@/shared/ui/Logo";

export function Sidebar() {
  const mainItems = NAV_ITEMS.filter((item) => item.to !== SETTINGS_PATH);
  const settings = NAV_ITEMS.find((item) => item.to === SETTINGS_PATH);
  const { data: session } = useSession();
  const displayName = session?.user?.username ?? session?.user?.email;

  return (
    <aside className="sticky top-4 m-4 hidden h-[calc(100dvh-2rem)] w-sidebar shrink-0 flex-col gap-4 overflow-y-auto rounded-nav bg-linear-to-b from-nav-from via-nav-via to-nav-to p-4 text-nav-text md:flex">
      <Logo className="px-3.5 pt-2 pb-4 text-2xl text-on-brand" />
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

      <div className="flex flex-col gap-2 border-t border-nav-text/20 pt-4">
        {displayName && (
          <p className="px-3.5 text-sm">
            Connecté en tant que <strong>{displayName}</strong>
          </p>
        )}
        <LogoutButton className="text-nav-text hover:bg-nav-active focus-visible:outline-nav-focus" />
        <ThemeSwitcher />
      </div>
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

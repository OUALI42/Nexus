import { NavLink, Outlet } from "react-router";

export function RootLayout() {
  return (
    <div className="app-shell">
      <header>
        <nav>
          <NavLink to="/" end>
            Nexus
          </NavLink>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

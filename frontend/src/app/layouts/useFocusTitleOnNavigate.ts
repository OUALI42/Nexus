import { useEffect, useRef } from "react";
import { useLocation } from "react-router";

/**
 * Client-side navigation is silent for screen readers:
 * moves the focus to the new page title.
 */
export function useFocusTitleOnNavigate() {
  const { pathname } = useLocation();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (previousPathname.current === pathname) {
      return;
    }
    previousPathname.current = pathname;
    document.querySelector<HTMLElement>("#contenu h1")?.focus();
  }, [pathname]);
}

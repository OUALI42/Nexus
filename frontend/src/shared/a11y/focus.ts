/** Moves the focus to the main page title, which screen readers announce. */
export function focusPageTitle(): void {
  document.querySelector<HTMLElement>("#contenu h1")?.focus();
}

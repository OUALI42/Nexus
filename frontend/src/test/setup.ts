import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { configure } from "@testing-library/react";

// findBy… and waitFor wait 1 s by default: too short on a loaded machine.
configure({ asyncUtilTimeout: 4000 });

afterEach(() => {
  cleanup();
});

// jsdom does not implement the modal methods of <dialog>.
// Skipped in tests running in the Node environment (no DOM).
if (typeof HTMLDialogElement !== "undefined") {
  const FOCUSABLE = "button, [href], input, select, textarea, [tabindex]";

  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
    const target =
      this.querySelector<HTMLElement>("[autofocus]") ??
      this.querySelector<HTMLElement>(FOCUSABLE);
    target?.focus();
  };

  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    if (!this.hasAttribute("open")) {
      return;
    }
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
}

// jsdom has no canvas: axe-core falls back gracefully when getContext returns null.
if (typeof HTMLCanvasElement !== "undefined") {
  HTMLCanvasElement.prototype.getContext = () => null;
}

// ProseMirror (TipTap) measures the layout, which jsdom does not compute.
// Skipped in the Node environment (e.g. tokens.test.ts), which has no DOM.
if ("Range" in globalThis) {
  const emptyRect = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    toJSON: () => ({}),
  } as DOMRect;
  Range.prototype.getBoundingClientRect = () => emptyRect;
  Range.prototype.getClientRects = () => [] as unknown as DOMRectList;
  document.elementFromPoint = () => null;
}

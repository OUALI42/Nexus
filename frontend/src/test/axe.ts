import axe from "axe-core";
import { expect } from "vitest";

/** Runs axe-core on a DOM subtree and fails with a readable list of violations. */
export async function expectNoAxeViolations(container: Element) {
  const results = await axe.run(container, {
    runOnly: {
      type: "tag",
      values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
    },
    rules: {
      // jsdom computes no layout: contrast is covered by tokens.test.ts.
      "color-contrast": { enabled: false },
    },
  });

  const violations = results.violations.map(
    (violation) =>
      `${violation.id}: ${violation.help} (${violation.nodes.length} élément(s))`,
  );
  expect(violations).toEqual([]);
}

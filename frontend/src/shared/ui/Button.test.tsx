import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "./Button";

describe("Button", () => {
  it("is a non-submitting button by default", () => {
    render(<Button>Annuler</Button>);

    expect(screen.getByRole("button", { name: "Annuler" })).toHaveAttribute(
      "type",
      "button",
    );
  });

  it("can be activated with the keyboard", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Valider</Button>);

    await user.tab();
    expect(screen.getByRole("button", { name: "Valider" })).toHaveFocus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");

    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("is disabled and busy while loading", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button isLoading onClick={onClick}>
        Génération
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Génération" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");

    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});

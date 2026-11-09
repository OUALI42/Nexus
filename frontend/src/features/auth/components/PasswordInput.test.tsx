import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { PasswordInput } from "./PasswordInput";

function ControlledPassword() {
  const [value, setValue] = useState("");
  return (
    <PasswordInput
      label="Mot de passe"
      showStrength
      value={value}
      onChange={(event) => {
        setValue(event.target.value);
      }}
    />
  );
}

describe("PasswordInput", () => {
  it("is masked by default", () => {
    render(<ControlledPassword />);

    expect(screen.getByLabelText("Mot de passe")).toHaveAttribute(
      "type",
      "password",
    );
    expect(
      screen.getByRole("button", { name: "Afficher le mot de passe" }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("can be shown and hidden again", async () => {
    const user = userEvent.setup();
    render(<ControlledPassword />);
    const toggle = screen.getByRole("button", {
      name: "Afficher le mot de passe",
    });

    await user.click(toggle);
    expect(screen.getByLabelText("Mot de passe")).toHaveAttribute(
      "type",
      "text",
    );
    expect(toggle).toHaveAttribute("aria-pressed", "true");

    await user.click(toggle);
    expect(screen.getByLabelText("Mot de passe")).toHaveAttribute(
      "type",
      "password",
    );
  });

  it("never sends a visible password to a spell checker", () => {
    render(<ControlledPassword />);

    expect(screen.getByLabelText("Mot de passe")).toHaveAttribute(
      "spellcheck",
      "false",
    );
  });

  it("describes the strength in words, linked to the field", async () => {
    const user = userEvent.setup();
    render(<ControlledPassword />);
    const input = screen.getByLabelText("Mot de passe");

    await user.type(input, "Correct-horse-42");

    expect(screen.getByText("Force : Excellent")).toHaveAttribute(
      "aria-live",
      "polite",
    );
    expect(input).toHaveAccessibleDescription("Force : Excellent");
  });
});

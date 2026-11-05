import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Input } from "./Input";

describe("Input", () => {
  it("is labelled by its label", () => {
    render(<Input label="Adresse e-mail" type="email" />);

    expect(screen.getByLabelText("Adresse e-mail")).toHaveAttribute(
      "type",
      "email",
    );
  });

  it("states that the field is required in words", () => {
    render(<Input label="Adresse e-mail" required />);

    expect(
      screen.getByRole("textbox", { name: "Adresse e-mail (obligatoire)" }),
    ).toBeRequired();
  });

  it("is described by its hint", () => {
    render(<Input label="Mot de passe" hint="10 caractères minimum." />);

    expect(screen.getByLabelText("Mot de passe")).toHaveAccessibleDescription(
      "10 caractères minimum.",
    );
  });

  it("exposes its error to assistive technologies", () => {
    render(<Input label="Nom" error="Le nom est trop court." />);

    const input = screen.getByRole("textbox", { name: "Nom" });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Le nom est trop court.");
  });

  it("is not marked invalid without an error", () => {
    render(<Input label="Nom" />);

    expect(screen.getByRole("textbox", { name: "Nom" })).not.toHaveAttribute(
      "aria-invalid",
    );
  });
});

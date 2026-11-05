import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { Button } from "./Button";
import { Modal } from "./Modal";

function DeleteLockerExample() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        onClick={() => {
          setOpen(true);
        }}
      >
        Supprimer le casier
      </Button>
      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        title="Supprimer le casier ?"
        description="Les documents qu'il contient seront conservés."
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false);
              }}
            >
              Annuler
            </Button>
            <Button variant="danger">Confirmer</Button>
          </>
        }
      />
    </>
  );
}

async function openModal() {
  const user = userEvent.setup();
  render(<DeleteLockerExample />);
  const trigger = screen.getByRole("button", { name: "Supprimer le casier" });
  await user.click(trigger);
  return { user, trigger };
}

describe("Modal", () => {
  it("opens as a named and described dialog", async () => {
    await openModal();

    const dialog = screen.getByRole("dialog", {
      name: "Supprimer le casier ?",
    });
    expect(dialog).toHaveAttribute("open");
    expect(dialog).toHaveAccessibleDescription(
      "Les documents qu'il contient seront conservés.",
    );
  });

  it("moves focus inside when it opens", async () => {
    await openModal();

    expect(screen.getByRole("button", { name: "Fermer" })).toHaveFocus();
  });

  it("traps the focus inside", async () => {
    const { user } = await openModal();
    const close = screen.getByRole("button", { name: "Fermer" });
    const confirm = screen.getByRole("button", { name: "Confirmer" });

    await user.tab(); // Annuler
    await user.tab(); // Confirmer
    expect(confirm).toHaveFocus();

    await user.tab(); // loops back
    expect(close).toHaveFocus();

    await user.tab({ shift: true }); // loops backwards
    expect(confirm).toHaveFocus();
  });

  it("closes with Escape and gives the focus back", async () => {
    const { user, trigger } = await openModal();
    const dialog = screen.getByRole("dialog", {
      name: "Supprimer le casier ?",
    });

    await user.keyboard("{Escape}");

    expect(dialog).not.toHaveAttribute("open");
    expect(trigger).toHaveFocus();
  });

  it("closes with the close button and gives the focus back", async () => {
    const { user, trigger } = await openModal();

    await user.click(screen.getByRole("button", { name: "Fermer" }));

    expect(trigger).toHaveFocus();
  });

  it("closes on a backdrop click", async () => {
    const { user, trigger } = await openModal();

    await user.click(screen.getByRole("dialog"));

    expect(trigger).toHaveFocus();
  });
});

import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button } from "@/shared/ui/Button";
import { ToastProvider } from "./ToastProvider";
import { useToast } from "./useToast";


function ToastTriggers() {
  const toast = useToast();
  return (
    <>
      <Button
        onClick={() => {
          toast.success("Fiche générée.");
        }}
      >
        Succès
      </Button>
      <Button
        onClick={() => {
          toast.error("La génération a échoué.");
        }}
      >
        Erreur
      </Button>
    </>
  );
}

function renderWithToasts() {
  return render(
    <ToastProvider>
      <ToastTriggers />
    </ToastProvider>,
  );
}

afterEach(() => {
  vi.useRealTimers();
});

describe("Toasts", () => {
  it("announces a success politely, with its type in words", async () => {
    const user = userEvent.setup();
    renderWithToasts();

    await user.click(screen.getByRole("button", { name: "Succès" }));

    expect(screen.getByRole("status")).toHaveTextContent(
      "Succès : Fiche générée.",
    );
  });

  it("announces an error immediately", async () => {
    const user = userEvent.setup();
    renderWithToasts();

    await user.click(screen.getByRole("button", { name: "Erreur" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Erreur : La génération a échoué.",
    );
  });

  it("does not steal the focus", async () => {
    const user = userEvent.setup();
    renderWithToasts();
    const trigger = screen.getByRole("button", { name: "Succès" });

    await user.click(trigger);

    expect(trigger).toHaveFocus();
  });

    it("dismisses a success after 5 seconds", () => {
    vi.useFakeTimers();
    renderWithToasts();

    fireEvent.click(screen.getByRole("button", { name: "Succès" }));
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.queryByText("Fiche générée.")).not.toBeInTheDocument();
  });

  it("pauses the countdown while hovered", () => {
    vi.useFakeTimers();
    renderWithToasts();

    fireEvent.click(screen.getByRole("button", { name: "Succès" }));
    fireEvent.mouseEnter(screen.getByText("Fiche générée."));
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.getByText("Fiche générée.")).toBeInTheDocument();

    fireEvent.mouseLeave(screen.getByText("Fiche générée."));
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.queryByText("Fiche générée.")).not.toBeInTheDocument();
  });

  it("keeps an error until it is dismissed", () => {
    vi.useFakeTimers();
    renderWithToasts();

    fireEvent.click(screen.getByRole("button", { name: "Erreur" }));
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByText("La génération a échoué.")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Fermer la notification" }),
    );
    expect(
      screen.queryByText("La génération a échoué."),
    ).not.toBeInTheDocument();
  });
});

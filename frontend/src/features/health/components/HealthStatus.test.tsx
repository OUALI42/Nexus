import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/shared/api";
import { renderWithQueryClient } from "@/test/utils";

import { fetchHealth } from "../api";
import { HealthStatus } from "./HealthStatus";

vi.mock("../api", () => ({ fetchHealth: vi.fn() }));

describe("HealthStatus", () => {
  beforeEach(() => {
    vi.mocked(fetchHealth).mockReset();
  });

  it("shows the API status once loaded", async () => {
    vi.mocked(fetchHealth).mockResolvedValue({ status: "ok" });

    renderWithQueryClient(<HealthStatus />);

    expect(screen.getByText("Connexion à l'API…")).toBeInTheDocument();
    expect(await screen.findByText("API : ok")).toBeInTheDocument();
  });

  it("shows the error message when the API is unreachable", async () => {
    vi.mocked(fetchHealth).mockRejectedValue(
      new ApiError(0, "network_error", "Impossible de joindre le serveur."),
    );

    renderWithQueryClient(<HealthStatus />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Impossible de joindre le serveur.",
    );
  });
});

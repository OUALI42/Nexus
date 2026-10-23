import { HealthStatus } from "@/features/health/components/HealthStatus";
import { api } from "@/shared/api";
import z from "zod";

export function HomePage() {
  return (
    <section>
      <h1>Nexus</h1>
      <p>Ton espace de révision.</p>
      <button
            type="button"
            onClick={() => {api.post("/health/", {}, z.unknown()).catch((error) => console.log(error));}}>
            Test CSRF
        </button>
      <HealthStatus />
    </section>
  );
}

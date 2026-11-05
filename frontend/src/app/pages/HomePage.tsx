import { HealthStatus } from "@/features/health/components/HealthStatus";
import { ThemeSwitcher } from "@/shared/theme/ThemeSwitcher";

export function HomePage() {
  return (
    <section className="flex max-w-md flex-col gap-4 p-8">
      <h1 className="text-3xl font-extrabold">Nexus</h1>
      <p className="text-fg-muted">Ton espace de révision.</p>
      <HealthStatus />
      <ThemeSwitcher />
    </section>
  );
}

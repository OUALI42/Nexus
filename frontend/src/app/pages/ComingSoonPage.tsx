import { PageHeader } from "@/shared/ui/PageHeader";

type ComingSoonPageProps = {
  title: string;
};

export function ComingSoonPage({ title }: ComingSoonPageProps) {
  return (
    <>
      <PageHeader title={title} />
      <p className="text-fg-muted">
        Cette page arrivera dans une prochaine story.
      </p>
    </>
  );
}

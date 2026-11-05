type PageHeaderProps = {
  title: string;
  description?: string;
};

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-1">
      <title>{`${title} · Nexus`}</title>
      <h1
        tabIndex={-1}
        className="text-2xl font-extrabold focus:outline-none md:text-3xl"
      >
        {title}
      </h1>
      {description && <p className="text-fg-muted">{description}</p>}
    </header>
  );
}

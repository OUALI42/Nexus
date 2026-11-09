import { cx } from "@/shared/lib/cx";

type LogoProps = {
  className?: string;
};

export function Logo({ className }: LogoProps) {
  return (
    <span className={cx("flex items-center gap-2.5 font-extrabold", className)}>
      <svg
        aria-hidden="true"
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        className="shrink-0 stroke-nav-accent"
        strokeWidth={2}
      >
        <circle cx="14" cy="14" r="4" />
        <circle cx="5" cy="6" r="2.5" />
        <circle cx="23" cy="8" r="2.5" />
        <circle cx="19" cy="23" r="2.5" />
        <path d="M11 12 7 8M18 12l3-3M15.5 18l2.5 3" />
      </svg>
      Nexus
    </span>
  );
}

import { cx } from "@/shared/lib/cx";

import { LockerIcon } from "../icons";

type LockerBadgeProps = {
  color: string;
  icon: string;
  size?: "md" | "lg";
};

export function LockerBadge({ color, icon, size = "md" }: LockerBadgeProps) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-control text-white",
        size === "lg" ? "size-14" : "size-11",
      )}
      style={{ backgroundColor: color }}
    >
    <LockerIcon name={icon} className={size === "lg" ? "size-7" : "size-6"} />
    </span>
  );
}

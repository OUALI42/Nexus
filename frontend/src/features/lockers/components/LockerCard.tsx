import { Link } from "react-router";

import type { Locker } from "../api";
import { courseCountLabel } from "../format";
import { LockerBadge } from "./LockerBadge";

export function LockerCard({ locker }: { locker: Locker }) {
  return (
    <Link
      to={`/casiers/${locker.id}`}
      className="flex min-h-tap items-center gap-4 rounded-card border border-line bg-surface p-4 no-underline"
      style={{ borderLeftColor: locker.color, borderLeftWidth: "6px" }}
    >
      <LockerBadge color={locker.color} icon={locker.icon} />
      <span className="flex flex-col">
        <span className="font-bold">{locker.name}</span>{" "}
        <span>{courseCountLabel(locker.courseCount)}</span>
      </span>
    </Link>
  );
}

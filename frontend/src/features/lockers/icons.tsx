import {
  Atom,
  BookOpen,
  Calculator,
  Code,
  FlaskConical,
  Folder,
  Globe,
  Landmark,
  Languages,
  Leaf,
  Music,
  Palette,
  PenLine,
  Scale,
  Sigma,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

// Keys mirror the back-end LockerIcon choices (apps/subjects/icons.py).
const LOCKER_ICONS: Record<string, LucideIcon> = {
  folder: Folder,
  "book-open": BookOpen,
  calculator: Calculator,
  sigma: Sigma,
  atom: Atom,
  "flask-conical": FlaskConical,
  leaf: Leaf,
  globe: Globe,
  landmark: Landmark,
  languages: Languages,
  "pen-line": PenLine,
  "trending-up": TrendingUp,
  scale: Scale,
  code: Code,
  palette: Palette,
  music: Music,
};

type LockerIconProps = {
  name: string;
  className?: string;
};

export function LockerIcon({ name, className }: LockerIconProps) {
  // Unknown name (newer back-end): fall back instead of crashing.
  const Icon = LOCKER_ICONS[name] ?? Folder;
  return <Icon aria-hidden="true" className={className} />;
}

import {
  CalendarDays,
  FileText,
  FolderOpen,
  House,
  ListChecks,
  Settings,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  to: string;
  label: string; // sidebar (desktop)
  shortLabel: string; // bottom bar (mobile)
  icon: LucideIcon;
  inBottomBar: boolean; // false: in the "Plus" menu on mobile
  isAi?: boolean;
};

/** Order of the desktop sidebar, as in the mockup. */
export const NAV_ITEMS: NavItem[] = [
  {
    to: "/",
    label: "Tableau de bord",
    shortLabel: "Accueil",
    icon: House,
    inBottomBar: true,
  },
  {
    to: "/casiers",
    label: "Mes casiers",
    shortLabel: "Casiers",
    icon: FolderOpen,
    inBottomBar: true,
  },
  {
    to: "/assistant",
    label: "Assistant IA",
    shortLabel: "IA",
    icon: Sparkles,
    inBottomBar: true,
    isAi: true,
  },
  {
    to: "/fiches",
    label: "Fiches de révision",
    shortLabel: "Fiches",
    icon: FileText,
    inBottomBar: false,
  },
  {
    to: "/qcm",
    label: "QCM",
    shortLabel: "QCM",
    icon: ListChecks,
    inBottomBar: false,
  },
  {
    to: "/calendrier",
    label: "Calendrier",
    shortLabel: "Agenda",
    icon: CalendarDays,
    inBottomBar: true,
  },
  {
    to: "/progression",
    label: "Progression",
    shortLabel: "Progression",
    icon: TrendingUp,
    inBottomBar: false,
  },
  {
    to: "/parametres",
    label: "Paramètres",
    shortLabel: "Paramètres",
    icon: Settings,
    inBottomBar: false,
  },
];

export const SETTINGS_PATH = "/parametres";

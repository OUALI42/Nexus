// API payloads (snake_case), as sent by the back-end.

export const MATHS_LOCKER = {
  id: 1,
  name: "Mathématiques",
  color: "#4338ca",
  icon: "sigma",
  position: 0,
  course_count: 3,
};

export const HISTORY_LOCKER = {
  id: 2,
  name: "Histoire-géographie",
  color: "#475569",
  icon: "globe",
  position: 1,
  course_count: 0,
};

export const LOCKER_CHOICES = {
  colors: [
    { value: "#4338ca", label: "Indigo" },
    { value: "#0e7490", label: "Cyan" },
    { value: "#6d28d9", label: "Violet" },
  ],
  icons: [
    { value: "folder", label: "Dossier" },
    { value: "sigma", label: "Sigma" },
    { value: "atom", label: "Atome" },
  ],
};

export const SUITES_COURSE = {
  id: 7,
  title: "Suites numériques",
  size_bytes: 1_258_291,
  analysis_status: "pending",
  created_at: "2026-11-17T10:00:00Z",
  file_url: "/api/v1/courses/7/file/",
};

export const SUITES_SHEET = {
  id: 12,
  title: "Suites numériques : l'essentiel",
  created_at: "2026-11-18T09:00:00Z",
  updated_at: "2026-11-20T09:00:00Z",
};

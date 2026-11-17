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

const decimal = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });
const longDate = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" });
const MEGABYTE = 1024 * 1024;

export function courseCountLabel(count: number): string {
  // "cours" is the same in the singular and the plural.
  return count === 0 ? "Aucun cours" : `${count} cours`;
}

export function fileSizeLabel(bytes: number): string {
  if (bytes < MEGABYTE) {
    return `${decimal.format(Math.max(1, Math.round(bytes / 1024)))} Ko`;
  }
  return `${decimal.format(bytes / MEGABYTE)} Mo`;
}

export function dateLabel(isoDate: string): string {
  return longDate.format(new Date(isoDate));
}

const ANALYSIS_STATUS_LABELS: Record<string, string> = {
  pending: "En attente d'analyse",
  processing: "Analyse en cours",
  ready: "Analysé",
  failed: "Échec de l'analyse",
};

export function analysisStatusLabel(status: string): string {
  return ANALYSIS_STATUS_LABELS[status] ?? "État inconnu";
}

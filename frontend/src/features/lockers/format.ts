export function courseCountLabel(count: number): string {
  // "cours" is the same in the singular and the plural.
  return count === 0 ? "Aucun cours" : `${count} cours`;
}

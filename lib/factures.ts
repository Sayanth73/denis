/**
 * Helpers pour la génération de factures TraceKebab.
 * Format numéro : F-AAAA-NNNN (e.g. F-2026-0001)
 */

export function generateFactureNumber(date: string, sequence: number): string {
  const year = date.slice(0, 4);
  const seq = String(sequence).padStart(4, "0");
  return `F-${year}-${seq}`;
}

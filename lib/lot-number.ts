/**
 * Génération de numéros de lot internes au format `TK-AAAA-MMJJ-NNN` (PRD §6).
 *
 * UTC-only pour rester stable entre fuseaux Suisse romande / UTC.
 */

export function generateLotNumber(date: Date, sequence: number): string {
  if (!Number.isInteger(sequence) || sequence < 1 || sequence > 999) {
    throw new RangeError(
      `generateLotNumber: sequence must be an integer in [1, 999], got ${sequence}`,
    );
  }
  const yyyy = date.getUTCFullYear().toString();
  const mm = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const dd = date.getUTCDate().toString().padStart(2, "0");
  const nnn = sequence.toString().padStart(3, "0");
  return `TK-${yyyy}-${mm}${dd}-${nnn}`;
}

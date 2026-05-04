import type { RawMaterial } from "./types";

export type StatutValue = "actif" | "epuise" | "dlc_depassee";

export const TYPE_LABELS: Record<RawMaterial["type"], string> = {
  boeuf: "Bœuf",
  agneau: "Agneau",
  poulet: "Poulet",
  epices: "Épices",
  marinade: "Marinade",
  autre: "Autre",
};

export const STATUT_LABELS: Record<StatutValue, string> = {
  actif: "Actif",
  epuise: "Épuisé",
  dlc_depassee: "DLC dépassée",
};

export const STATUT_CLASSES: Record<StatutValue, string> = {
  actif: "bg-emerald-100 text-emerald-800 border-emerald-200",
  epuise: "bg-zinc-100 text-zinc-600 border-zinc-200",
  dlc_depassee: "bg-red-100 text-red-800 border-red-200",
};

/**
 * Derive le statut d'un lot à partir de sa quantité restante et de sa DLC.
 * Précédence (UI-SPEC §Statut) : dlc_depassee > epuise > actif.
 *
 * Comparaison de dates en UTC midnight, identique à lib/dlc.ts.
 */
export function deriveStatut(rm: RawMaterial, today: Date): StatutValue {
  const dlcDay = new Date(`${rm.dlc.slice(0, 10)}T00:00:00.000Z`);
  const todayDay = new Date(`${today.toISOString().slice(0, 10)}T00:00:00.000Z`);
  if (dlcDay.getTime() < todayDay.getTime()) return "dlc_depassee";
  if (rm.quantiteRestante <= 0) return "epuise";
  return "actif";
}

/**
 * Liste dédupliquée et triée alphabétiquement des fournisseurs présents
 * dans le store, pour alimenter le combobox de réception.
 */
export function getSupplierOptions(rms: RawMaterial[]): string[] {
  const set = new Set<string>();
  for (const rm of rms) {
    const trimmed = rm.fournisseur.trim();
    if (trimmed) set.add(trimmed);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "fr"));
}

/**
 * Format ISO YYYY-MM-DD → JJ.MM.AAAA pour l'affichage Suisse-romand.
 * (Phase 1 inherited rule.)
 */
export function formatDate(iso: string): string {
  return `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;
}

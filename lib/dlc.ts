/**
 * Helpers DLC (Date Limite de Consommation) selon PRD §6.
 *
 * Toutes les comparaisons sont effectuées en UTC sur des dates uniquement
 * (sans heure) pour éviter les artefacts de fuseau horaire.
 */

export type DlcColor = "green" | "orange" | "red" | "grey";

/**
 * Calcule la DLC d'une broche : date de production + 5 jours.
 * Renvoie une chaîne ISO au format `YYYY-MM-DD`.
 */
export function computeBrocheDlc(dateProduction: string): string {
  const base = new Date(`${dateProduction.slice(0, 10)}T00:00:00.000Z`);
  if (Number.isNaN(base.getTime())) {
    throw new RangeError(`Invalid dateProduction: ${dateProduction}`);
  }
  base.setUTCDate(base.getUTCDate() + 5);
  return base.toISOString().slice(0, 10);
}

/**
 * Détermine la couleur de pastille DLC selon les seuils PRD §6 :
 * - `> 5 jours` restants → "green"
 * - `2 à 5 jours` restants → "orange"
 * - `0 à 1 jours` restants → "red"
 * - négatif (expiré) → "grey"
 *
 * Comparaison en jours entiers UTC : on reconstruit minuit UTC des deux côtés
 * pour que `today` à 16h00 face à une DLC du même jour donne 0 jour (red),
 * et non -0,7 jour (grey).
 */
export function dlcColor(dlc: string, today: Date): DlcColor {
  const dlcDay = new Date(`${dlc.slice(0, 10)}T00:00:00.000Z`);
  if (Number.isNaN(dlcDay.getTime())) {
    throw new RangeError(`Invalid dlc: ${dlc}`);
  }
  const todayDay = new Date(`${today.toISOString().slice(0, 10)}T00:00:00.000Z`);
  const days = Math.floor((dlcDay.getTime() - todayDay.getTime()) / 86_400_000);
  if (days < 0) return "grey";
  if (days < 2) return "red";
  if (days <= 5) return "orange";
  return "green";
}

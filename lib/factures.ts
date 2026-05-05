/**
 * Helpers pour la génération de factures TraceKebab.
 * Format numéro : F-AAAA-NNNN (e.g. F-2026-0001)
 */
import type { Facture, AppSettings } from "./types";

export function generateFactureNumber(date: string, sequence: number): string {
  const year = date.slice(0, 4);
  const seq = String(sequence).padStart(4, "0");
  return `F-${year}-${seq}`;
}

/**
 * Construit le payload texte pour un QR-bill suisse (SIX standard v2.0).
 * Retourne une chaîne vide si l'IBAN n'est pas configuré.
 */
export function buildQrBillPayload(
  iban: string,
  nomCreancier: string,
  adresseLigne1: string,
  adresseLigne2: string,
  amount: number,
): string {
  const cleanIban = iban.replace(/\s/g, "").toUpperCase();
  if (!cleanIban) return "";
  return [
    "SPC",
    "0200",
    "1",
    cleanIban,
    "K",
    nomCreancier,
    adresseLigne1,
    adresseLigne2,
    "",
    "",
    "CH",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    amount.toFixed(2),
    "CHF",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "NON",
    "",
    "",
    "EPD",
  ].join("\n");
}

// ─── Statuts paiement — labels et classes badge ───────────────────────────────

export const STATUT_PAIEMENT_LABELS: Record<
  "en_attente" | "payee_livraison" | "payee_virement",
  string
> = {
  en_attente:      "En attente",
  payee_livraison: "Payée livraison",
  payee_virement:  "Virement reçu",
};

export const STATUT_PAIEMENT_CLASSES: Record<
  "en_attente" | "payee_livraison" | "payee_virement",
  string
> = {
  en_attente:      "bg-zinc-50 border-zinc-200 text-zinc-700",
  payee_livraison: "bg-emerald-50 border-emerald-200 text-emerald-800",
  payee_virement:  "bg-emerald-50 border-emerald-200 text-emerald-800",
};

/** Classe Tailwind pour le badge "En retard" (overlay sur en_attente). */
export const CLASSE_EN_RETARD = "bg-orange-50 border-orange-200 text-orange-800";

/**
 * Retourne true si la facture est en_attente ET que le nombre de jours écoulés
 * depuis dateFacture dépasse settings.delaiPaiementJours.
 */
export function isFactureEnRetard(
  facture: Facture,
  settings: AppSettings,
  today: Date,
): boolean {
  if (facture.paiement.statut !== "en_attente") return false;
  const factureMs = new Date(
    `${facture.dateFacture.slice(0, 10)}T00:00:00.000Z`,
  ).getTime();
  const todayMs = new Date(
    `${today.toISOString().slice(0, 10)}T00:00:00.000Z`,
  ).getTime();
  const daysSince = Math.floor((todayMs - factureMs) / 86_400_000);
  return daysSince > settings.delaiPaiementJours;
}

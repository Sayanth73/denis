/**
 * Pure helpers for the Livraisons screen (Phase 5).
 * No React, no side effects. All functions operate on domain types.
 */

import type { Delivery, FinishedProduct, Customer } from "./types";
import { formatDate } from "./raw-materials";

// ---------------------------------------------------------------------------
// Status display maps — mirrors STATUT_CLASSES / STATUT_LABELS in lib/raw-materials.ts
// ---------------------------------------------------------------------------

export const STATUT_LIVRAISON_LABELS: Record<Delivery["statut"], string> = {
  preparee: "Préparée",
  livree:   "Livrée",
};

/**
 * Tailwind badge classes for each Delivery statut.
 * Badge shape: inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium
 * (per 05-UI-SPEC.md §Statut Badge — locked classes)
 */
export const STATUT_LIVRAISON_CLASSES: Record<Delivery["statut"], string> = {
  preparee: "bg-amber-50 border-amber-200 text-amber-800",
  livree:   "bg-emerald-50 border-emerald-200 text-emerald-800",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns FinishedProducts with statut === "en_stock", sorted by dlc ascending.
 * Used to populate the broches checkbox list in the New Delivery dialog.
 */
export function getInStockBroches(fps: FinishedProduct[]): FinishedProduct[] {
  return fps
    .filter((fp) => fp.statut === "en_stock")
    .slice()
    .sort((a, b) => a.dlc.localeCompare(b.dlc));
}

/**
 * Returns the total poids (kg) for a delivery by summing each broche's poids.
 * Returns 0 for any broche ID not found in fps (safe, no crash).
 */
export function getDeliveryWeight(
  delivery: Delivery,
  fps: FinishedProduct[],
): number {
  return delivery.brochesLivrees.reduce((sum, id) => {
    const fp = fps.find((f) => f.id === id);
    return sum + (fp?.poids ?? 0);
  }, 0);
}

/**
 * Looks up a Customer by id. Returns undefined if not found.
 */
export function getCustomerById(
  customerId: string,
  customers: Customer[],
): Customer | undefined {
  return customers.find((c) => c.id === customerId);
}

/**
 * Returns a display-ready row object for the deliveries table.
 * Avoids inline computation in JSX render.
 */
export function formatDeliveryRow(
  delivery: Delivery,
  fps: FinishedProduct[],
  customers: Customer[],
): {
  id: string;
  dateFormatted: string;
  clientName: string;
  nombreBroches: number;
  poidsTotal: number;
  statut: Delivery["statut"];
  notes?: string;
} {
  const customer = getCustomerById(delivery.customerId, customers);
  return {
    id: delivery.id,
    dateFormatted: formatDate(delivery.date),
    clientName: customer?.nom ?? delivery.customerId,
    nombreBroches: delivery.brochesLivrees.length,
    poidsTotal: getDeliveryWeight(delivery, fps),
    statut: delivery.statut,
    notes: delivery.notes,
  };
}

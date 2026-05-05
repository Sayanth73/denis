/**
 * Pure helpers for the Clients screen (Phase 6).
 * No React, no Zustand. All functions operate on domain types.
 */

import type { Delivery, FinishedProduct, ProductionOrder, RawMaterial } from "./types";

/**
 * Returns all deliveries for a given customer, most-recent-first.
 * Used by the client detail page to list delivery history.
 */
export function getDeliveriesForCustomer(
  customerId: string,
  deliveries: Delivery[],
): Delivery[] {
  return [...deliveries]
    .filter((d) => d.customerId === customerId)
    .reverse();
}

/**
 * Returns the FinishedProducts (broches) included in a delivery.
 * Looks up each id in delivery.brochesLivrees from the finishedProducts array.
 * Safe: skips IDs that are not found in finishedProducts.
 */
export function getBrochesForDelivery(
  delivery: Delivery,
  finishedProducts: FinishedProduct[],
): FinishedProduct[] {
  return delivery.brochesLivrees
    .map((id) => finishedProducts.find((fp) => fp.id === id))
    .filter((fp): fp is FinishedProduct => fp !== undefined);
}

/**
 * Returns the upstream raw materials that contributed to a broche,
 * with the quantity used from each lot.
 *
 * Trace path:
 *   broche.productionOrderId
 *   → productionOrder.matieresPremieresUtilisees[{ rawMaterialId, quantiteUtilisee }]
 *   → rawMaterials.find(rm => rm.id === rawMaterialId)
 *
 * Returns [] if the production order is not found or matieresPremieresUtilisees is empty.
 * Silently skips any rawMaterialId that is not found in rawMaterials (safe fallback).
 */
export function getRawMaterialsForBroche(
  broche: FinishedProduct,
  productionOrders: ProductionOrder[],
  rawMaterials: RawMaterial[],
): { rm: RawMaterial; quantiteUtilisee: number }[] {
  const order = productionOrders.find((o) => o.id === broche.productionOrderId);
  if (!order) return [];

  return order.matieresPremieresUtilisees
    .map(({ rawMaterialId, quantiteUtilisee }) => {
      const rm = rawMaterials.find((r) => r.id === rawMaterialId);
      if (!rm) return null;
      return { rm, quantiteUtilisee };
    })
    .filter(
      (entry): entry is { rm: RawMaterial; quantiteUtilisee: number } =>
        entry !== null,
    );
}

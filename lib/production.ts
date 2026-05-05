/**
 * Helpers de production TraceKebab — Phase 4.
 *
 * Fonctions pures : pas d'import React, pas d'accès au store.
 * Consommées par <AllocationStep /> (step 2) et le handler de confirmation.
 */

import type { RawMaterial, Recipe } from "./types";

/**
 * Quantité totale requise pour un ingrédient de la recette, en kg.
 * = recipe.poidsTotal × (pourcentage / 100) × nombreBroches
 */
export function computeRequiredQty(
  ingredient: { typeMatiere: RawMaterial["type"]; pourcentage: number },
  recipe: Recipe,
  nombreBroches: number,
): number {
  return (recipe.poidsTotal * ingredient.pourcentage) / 100 * nombreBroches;
}

/**
 * Lots éligibles pour un type d'ingrédient, triés par DLC croissante (FIFO).
 * Exclut les lots épuisés (quantiteRestante <= 0) et DLC dépassées (dlc < today).
 * todayIso : ISO YYYY-MM-DD (UTC) à comparer avec les DLC des lots.
 */
export function getEligibleLots(
  rawMaterials: RawMaterial[],
  typeMatiere: RawMaterial["type"],
  todayIso: string,
): RawMaterial[] {
  return rawMaterials
    .filter(
      (rm) =>
        rm.type === typeMatiere &&
        rm.quantiteRestante > 0 &&
        rm.dlc >= todayIso,
    )
    .sort((a, b) => a.dlc.localeCompare(b.dlc));
}

/**
 * Pré-remplissage FIFO greedy : remplit depuis le lot le plus proche de la DLC
 * en premier jusqu'à satisfaction de la quantité requise (ou épuisement des lots).
 *
 * Renvoie un objet { [rawMaterialId]: quantitéAllouée }.
 * Les lots non utilisés ont une allocation de 0.
 *
 * @param eligibleLots - Lots triés par DLC croissante (sortie de getEligibleLots).
 * @param requiredQty  - Quantité totale à allouer en kg.
 */
export function buildFifoDefaults(
  eligibleLots: RawMaterial[],
  requiredQty: number,
): Record<string, number> {
  const result: Record<string, number> = {};
  let remaining = requiredQty;

  for (const lot of eligibleLots) {
    if (remaining <= 0) {
      result[lot.id] = 0;
    } else {
      const allocated = Math.min(lot.quantiteRestante, remaining);
      result[lot.id] = Math.round(allocated * 100) / 100; // arrondi à 2 décimales
      remaining = Math.round((remaining - allocated) * 100) / 100;
    }
  }

  return result;
}

/**
 * Calcule le manque (shortfall) en kg pour un ingrédient.
 * Retourne un nombre positif si insuffisant, 0 si exact, négatif si sur-alloué.
 * L'appelant vérifie > 0 pour indiquer une pénurie.
 */
export function computeShortfall(
  allocations: Record<string, number>,
  requiredQty: number,
): number {
  const total = Object.values(allocations).reduce((sum, v) => sum + v, 0);
  return Math.round((requiredQty - total) * 100) / 100;
}

/**
 * Aujourd'hui au format ISO YYYY-MM-DD (UTC).
 * Utilisé par le wizard pour filtrer les lots et calculer les DLC broches.
 */
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

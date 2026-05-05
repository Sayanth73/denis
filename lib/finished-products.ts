/**
 * Pure helpers for FinishedProduct domain logic. No React. No Zustand.
 */

import type { FinishedProduct, ProductionOrder, Recipe } from "./types";

export function getRecipeForBroche(
  broche: FinishedProduct,
  productionOrders: ProductionOrder[],
  recipes: Recipe[]
): Recipe | null {
  const order = productionOrders.find((o) => o.id === broche.productionOrderId);
  if (!order) return null;
  return recipes.find((r) => r.id === order.recipeId) ?? null;
}

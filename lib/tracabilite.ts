/**
 * Pure helpers for the Traçabilité screen (Phase 7).
 * No React. No Zustand. All functions operate on domain types.
 *
 * Lot detection regex (locked — 07-CONTEXT.md):
 *   Internal broche: /^TK-\d{4}-\d{4}-\d{3}$/
 *   Supplier lot: anything else
 */

import type {
  RawMaterial,
  FinishedProduct,
  ProductionOrder,
  Customer,
  Delivery,
  Recipe,
} from "./types";

/** Regex for internal broche lot numbers (locked format: TK-YYYY-MMDD-NNN). */
const BROCHE_LOT_REGEX = /^TK-\d{4}-\d{4}-\d{3}$/;

/**
 * Detects whether an input string is a broche lot number, a supplier lot
 * reference, or empty.
 *
 * @returns "broche" if the string matches TK-YYYY-MMDD-NNN format,
 *          "supplier" if it is non-empty and does not match, or null if empty.
 */
export function detectLotType(input: string): "broche" | "supplier" | null {
  const trimmed = input.trim();
  if (trimmed === "") return null;
  if (BROCHE_LOT_REGEX.test(trimmed)) return "broche";
  return "supplier";
}

/**
 * Finds the RawMaterial whose `numeroLotFournisseur` matches the input.
 *
 * @param input - The supplier lot number to search for (will be trimmed).
 * @param rawMaterials - The full array of raw materials to search within.
 * @returns The matching RawMaterial, or null if not found.
 */
export function findSupplierLot(
  input: string,
  rawMaterials: RawMaterial[]
): RawMaterial | null {
  return rawMaterials.find((rm) => rm.numeroLotFournisseur === input.trim()) ?? null;
}

/**
 * Finds the FinishedProduct whose `numeroLotInterne` matches the input.
 *
 * @param input - The internal broche lot number to search for (will be trimmed).
 * @param finishedProducts - The full array of finished products to search within.
 * @returns The matching FinishedProduct, or null if not found.
 */
export function findBroche(
  input: string,
  finishedProducts: FinishedProduct[]
): FinishedProduct | null {
  return finishedProducts.find((fp) => fp.numeroLotInterne === input.trim()) ?? null;
}

/**
 * Returns all production orders that consumed a specific raw material,
 * together with the quantity used.
 *
 * @param rmId - The id of the raw material to search for.
 * @param productionOrders - The full array of production orders.
 * @returns Array of { order, quantiteUtilisee } sorted by order.date descending.
 */
export function getProductionOrdersForRm(
  rmId: string,
  productionOrders: ProductionOrder[]
): { order: ProductionOrder; quantiteUtilisee: number }[] {
  const results: { order: ProductionOrder; quantiteUtilisee: number }[] = [];

  for (const order of productionOrders) {
    const entry = order.matieresPremieresUtilisees.find(
      (m) => m.rawMaterialId === rmId
    );
    if (entry) {
      results.push({ order, quantiteUtilisee: entry.quantiteUtilisee });
    }
  }

  return results.sort((a, b) => b.order.date.localeCompare(a.order.date));
}

/**
 * Traces the downstream impact of a raw material: RM → production orders →
 * broches produced → deliveries → customers.
 *
 * Only broches with `statut === "livree"` and a `livraisonId` set are included.
 * Results are grouped by unique delivery and sorted by delivery date descending.
 *
 * @param rmId - The id of the raw material to trace.
 * @param productionOrders - All production orders.
 * @param finishedProducts - All finished products.
 * @param deliveries - All deliveries.
 * @param customers - All customers.
 * @returns Array of { customer, delivery, broches } sorted by delivery.date descending.
 */
export function getClientsImpactes(
  rmId: string,
  productionOrders: ProductionOrder[],
  finishedProducts: FinishedProduct[],
  deliveries: Delivery[],
  customers: Customer[]
): { customer: Customer; delivery: Delivery; broches: FinishedProduct[] }[] {
  // Step 1: find all orders that used this RM
  const relevantOrders = productionOrders.filter((order) =>
    order.matieresPremieresUtilisees.some((m) => m.rawMaterialId === rmId)
  );

  // Step 2: collect all broche IDs from those orders
  const brocheIds = new Set<string>();
  for (const order of relevantOrders) {
    for (const broche of order.brochesProduites) {
      brocheIds.add(broche.id);
    }
  }

  // Step 3: resolve broches — keep only delivered ones with a livraisonId
  const deliveredBroches = finishedProducts.filter(
    (fp) => brocheIds.has(fp.id) && fp.statut === "livree" && fp.livraisonId != null
  );

  // Step 4: group by livraisonId
  const byDelivery = new Map<string, FinishedProduct[]>();
  for (const broche of deliveredBroches) {
    const deliveryId = broche.livraisonId as string;
    const existing = byDelivery.get(deliveryId);
    if (existing) {
      existing.push(broche);
    } else {
      byDelivery.set(deliveryId, [broche]);
    }
  }

  // Step 5: resolve delivery + customer for each group
  const results: { customer: Customer; delivery: Delivery; broches: FinishedProduct[] }[] = [];

  for (const [deliveryId, broches] of Array.from(byDelivery)) {
    const delivery = deliveries.find((d) => d.id === deliveryId);
    if (!delivery) continue;
    const customer = customers.find((c) => c.id === delivery.customerId);
    if (!customer) continue;
    results.push({ customer, delivery, broches });
  }

  // Step 6: sort by delivery date descending
  return results.sort((a, b) => b.delivery.date.localeCompare(a.delivery.date));
}

/**
 * Returns the production order and recipe associated with a given broche.
 *
 * @param broche - The finished product to look up.
 * @param productionOrders - All production orders.
 * @param recipes - All recipes.
 * @returns { order, recipe } if both are found, or null otherwise.
 */
export function getRecipeForOrder(
  broche: FinishedProduct,
  productionOrders: ProductionOrder[],
  recipes: Recipe[]
): { order: ProductionOrder; recipe: Recipe } | null {
  const order = productionOrders.find((o) => o.id === broche.productionOrderId);
  if (!order) return null;

  const recipe = recipes.find((r) => r.id === order.recipeId);
  if (!recipe) return null;

  return { order, recipe };
}

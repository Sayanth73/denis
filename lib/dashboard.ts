/**
 * Pure helpers for the Dashboard screen (Phase 8).
 * No React. No Zustand. All functions operate on domain types.
 *
 * "This week" = ISO week (Monday start), via date-fns with { weekStartsOn: 1 }.
 * Low stock threshold  : quantiteRestante < 5 kg (locked).
 * Stale broche threshold: statut === "en_stock" && dateProduction < today - 3 days (locked).
 * DLC alert threshold  : DLC within 3 calendar days of today (locked).
 */
import {
  startOfWeek,
  endOfWeek,
  isWithinInterval,
  formatDistanceToNow,
} from "date-fns";
import { fr } from "date-fns/locale";
import type {
  RawMaterial,
  FinishedProduct,
  Delivery,
  ProductionOrder,
  Customer,
  Recipe,
} from "./types";

// ─── KPI helpers ─────────────────────────────────────────────────────────────

/** Count of RawMaterials with quantiteRestante > 0 (active lots). */
export function countActiveRMs(rms: RawMaterial[]): number {
  return rms.filter((rm) => rm.quantiteRestante > 0).length;
}

/**
 * Count of active RawMaterials whose DLC falls within `daysWindow` calendar
 * days of today (inclusive). Only lots with quantiteRestante > 0 are counted.
 * Default window = 3 days (locked decision).
 */
export function countAlertingDLCs(
  rms: RawMaterial[],
  today: Date,
  daysWindow = 3,
): number {
  const todayMs = new Date(
    `${today.toISOString().slice(0, 10)}T00:00:00.000Z`,
  ).getTime();
  const windowMs = todayMs + daysWindow * 86_400_000;
  return rms.filter((rm) => {
    if (rm.quantiteRestante <= 0) return false;
    const dlcMs = new Date(`${rm.dlc.slice(0, 10)}T00:00:00.000Z`).getTime();
    return dlcMs >= todayMs && dlcMs < windowMs;
  }).length;
}

/** Count of FinishedProducts with statut === "en_stock". */
export function countBrochesEnStock(fps: FinishedProduct[]): number {
  return fps.filter((fp) => fp.statut === "en_stock").length;
}

/** Sum of poids (kg) for FinishedProducts with statut === "en_stock". */
export function sumBrochesWeight(fps: FinishedProduct[]): number {
  return fps
    .filter((fp) => fp.statut === "en_stock")
    .reduce((sum, fp) => sum + fp.poids, 0);
}

/**
 * Count of FinishedProducts whose dateProduction falls within the ISO week
 * containing `today` (Monday start, date-fns).
 */
export function countProducedThisWeek(fps: FinishedProduct[], today: Date): number {
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  return fps.filter((fp) => {
    const d = new Date(`${fp.dateProduction.slice(0, 10)}T00:00:00.000Z`);
    return isWithinInterval(d, { start: weekStart, end: weekEnd });
  }).length;
}

/**
 * Count of Deliveries whose date falls within the ISO week containing `today`
 * (Monday start).
 */
export function countDeliveriesThisWeek(deliveries: Delivery[], today: Date): number {
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  return deliveries.filter((d) => {
    const date = new Date(`${d.date.slice(0, 10)}T00:00:00.000Z`);
    return isWithinInterval(date, { start: weekStart, end: weekEnd });
  }).length;
}

/**
 * Total brochesLivrees count across Deliveries in the current ISO week.
 * Used for KPI 4 sub-label "{N} broches livrées".
 */
export function countBrochesLivreesThisWeek(
  deliveries: Delivery[],
  today: Date,
): number {
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  return deliveries
    .filter((d) => {
      const date = new Date(`${d.date.slice(0, 10)}T00:00:00.000Z`);
      return isWithinInterval(date, { start: weekStart, end: weekEnd });
    })
    .reduce((sum, d) => sum + d.brochesLivrees.length, 0);
}

// ─── Alertes ─────────────────────────────────────────────────────────────────

export type AlerteItem = {
  id: string;
  severity: "critical" | "warning";
  message: string;
  href?: string;
};

/**
 * Produces the merged, sorted list of operational alerts:
 * 1. RM DLC near (within 3 days): critical if < 2 days, warning if 2-3 days
 * 2. Low stock (quantiteRestante < 5 kg): warning — skipped if already in DLC alert
 * 3. Stale broches (en_stock AND dateProduction > 3 days ago): warning
 *
 * Sorted: critical first, then warning; within severity, lexicographic by message.
 */
export function getAlertes(
  state: {
    rawMaterials: RawMaterial[];
    finishedProducts: FinishedProduct[];
  },
  today: Date,
): AlerteItem[] {
  const todayMs = new Date(
    `${today.toISOString().slice(0, 10)}T00:00:00.000Z`,
  ).getTime();
  const alerts: AlerteItem[] = [];
  const alertedRmIds = new Set<string>();

  // DLC-near alerts
  for (const rm of state.rawMaterials) {
    if (rm.quantiteRestante <= 0) continue;
    const dlcMs = new Date(`${rm.dlc.slice(0, 10)}T00:00:00.000Z`).getTime();
    const daysRemaining = Math.floor((dlcMs - todayMs) / 86_400_000);
    if (daysRemaining < 3) {
      alertedRmIds.add(rm.id);
      alerts.push({
        id: `dlc-${rm.id}`,
        severity: daysRemaining < 2 ? "critical" : "warning",
        message: `Lot ${rm.numeroLotFournisseur} (${rm.nom}) — DLC dans ${daysRemaining}j`,
        href: "/matieres-premieres",
      });
    }
  }

  // Low-stock alerts (skip if lot already in DLC alert)
  for (const rm of state.rawMaterials) {
    if (rm.quantiteRestante <= 0 || rm.quantiteRestante >= 5) continue;
    if (alertedRmIds.has(rm.id)) continue;
    alerts.push({
      id: `stock-${rm.id}`,
      severity: "warning",
      message: `Lot ${rm.numeroLotFournisseur} (${rm.nom}) — ${rm.quantiteRestante} kg restants`,
      href: "/matieres-premieres",
    });
  }

  // Stale-broche alerts (en_stock > 3 days old)
  for (const fp of state.finishedProducts) {
    if (fp.statut !== "en_stock") continue;
    const prodMs = new Date(
      `${fp.dateProduction.slice(0, 10)}T00:00:00.000Z`,
    ).getTime();
    const daysStale = Math.floor((todayMs - prodMs) / 86_400_000);
    if (daysStale > 3) {
      alerts.push({
        id: `stale-${fp.id}`,
        severity: "warning",
        message: `Broche ${fp.numeroLotInterne} en stock depuis ${daysStale}j`,
        href: "/production",
      });
    }
  }

  // Sort: critical first, then warning; within group lexicographic by message
  return alerts.sort((a, b) => {
    if (a.severity !== b.severity) {
      return a.severity === "critical" ? -1 : 1;
    }
    return a.message.localeCompare(b.message, "fr");
  });
}

// ─── Recent Activity ──────────────────────────────────────────────────────────

export type ActivityItem = {
  id: string;
  iconName: "Package" | "Factory" | "Truck";
  title: string;
  date: string; // ISO date YYYY-MM-DD
  href: string;
};

/**
 * Merges reception, production, and livraison event streams into a unified
 * activity timeline sorted by date descending, capped to n items (default 5).
 */
export function getRecentActivity(
  state: {
    rawMaterials: RawMaterial[];
    productionOrders: ProductionOrder[];
    deliveries: Delivery[];
    customers: Customer[];
    recipes: Recipe[];
  },
  n = 5,
): ActivityItem[] {
  const items: ActivityItem[] = [];

  for (const rm of state.rawMaterials) {
    items.push({
      id: `reception-${rm.id}`,
      iconName: "Package",
      title: `Réception — ${rm.nom} (${rm.fournisseur})`,
      date: rm.dateReception,
      href: "/matieres-premieres",
    });
  }

  for (const order of state.productionOrders) {
    const recipe = state.recipes.find((r) => r.id === order.recipeId);
    const recipeName = recipe?.nom ?? "";
    const title = recipeName
      ? `Production — ${order.nombreBroches} broche(s) (${recipeName})`
      : `Production — ${order.nombreBroches} broche(s)`;
    items.push({
      id: `production-${order.id}`,
      iconName: "Factory",
      title,
      date: order.date,
      href: "/production",
    });
  }

  for (const delivery of state.deliveries) {
    const customer = state.customers.find((c) => c.id === delivery.customerId);
    const customerName = customer?.nom ?? "";
    const title = customerName
      ? `Livraison — ${delivery.brochesLivrees.length} broche(s) → ${customerName}`
      : `Livraison — ${delivery.brochesLivrees.length} broche(s)`;
    items.push({
      id: `livraison-${delivery.id}`,
      iconName: "Truck",
      title,
      date: delivery.date,
      href: "/livraisons",
    });
  }

  return items
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, n);
}

// ─── Date helper ─────────────────────────────────────────────────────────────

/**
 * Human-readable relative date using date-fns formatDistanceToNow (French locale).
 * Example output: "il y a 3 jours", "il y a environ 2 heures".
 */
export function formatRelativeDate(iso: string): string {
  const date = new Date(`${iso.slice(0, 10)}T00:00:00.000Z`);
  return formatDistanceToNow(date, { addSuffix: true, locale: fr });
}

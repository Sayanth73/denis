"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { AlertesColumn } from "@/components/dashboard/alertes-column";
import { RecentActivityColumn } from "@/components/dashboard/recent-activity-column";
import { useTraceabilityStore } from "@/lib/store";
import {
  countActiveRMs,
  countAlertingDLCs,
  countBrochesEnStock,
  sumBrochesWeight,
  countProducedThisWeek,
  countDeliveriesThisWeek,
  countBrochesLivreesThisWeek,
  getAlertes,
  getRecentActivity,
} from "@/lib/dashboard";

export default function DashboardPage() {
  const rawMaterials     = useTraceabilityStore((s) => s.rawMaterials);
  const finishedProducts = useTraceabilityStore((s) => s.finishedProducts);
  const productionOrders = useTraceabilityStore((s) => s.productionOrders);
  const customers        = useTraceabilityStore((s) => s.customers);
  const deliveries       = useTraceabilityStore((s) => s.deliveries);
  const recipes          = useTraceabilityStore((s) => s.recipes);
  const hasHydrated      = useTraceabilityStore((s) => s.hasHydrated);

  // Hydration guard — matches Phase 3/4/5/6 pattern exactly.
  // Renders muted skeleton placeholders until localStorage has rehydrated.
  if (!hasHydrated) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} className="p-5 animate-pulse">
            <div className="h-3 bg-muted rounded w-3/4 mb-3" />
            <div className="h-8 bg-muted rounded w-1/2 mb-2" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </Card>
        ))}
      </div>
    );
  }

  const today = new Date();

  // ─── KPI values ────────────────────────────────────────────────────────────
  const activeRMCount          = countActiveRMs(rawMaterials);
  const alertingDLCCount       = countAlertingDLCs(rawMaterials, today);
  const brochesEnStockCount    = countBrochesEnStock(finishedProducts);
  const brochesWeight          = sumBrochesWeight(finishedProducts);
  const producedThisWeek       = countProducedThisWeek(finishedProducts, today);
  const deliveriesThisWeek     = countDeliveriesThisWeek(deliveries, today);
  const brochesLivreesThisWeek = countBrochesLivreesThisWeek(deliveries, today);

  // ─── Lower column data ─────────────────────────────────────────────────────
  const alertes  = getAlertes({ rawMaterials, finishedProducts }, today);
  const activity = getRecentActivity(
    { rawMaterials, productionOrders, deliveries, customers, recipes },
    5,
  );

  return (
    <div>
      {/* KPI row — 1 col → 2 col → 4 col */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Matières premières en stock"
          value={activeRMCount}
          subLabel={`${activeRMCount} lots actifs`}
          alert={alertingDLCCount > 0 ? `${alertingDLCCount} DLC <3j` : undefined}
        />
        <KpiCard
          label="Broches en stock"
          value={brochesEnStockCount}
          subLabel={`${brochesWeight} kg total`}
        />
        <KpiCard
          label="Production cette semaine"
          value={producedThisWeek}
          subLabel={`${producedThisWeek} broches produites`}
        />
        <KpiCard
          label="Livraisons cette semaine"
          value={deliveriesThisWeek}
          subLabel={`${brochesLivreesThisWeek} broches livrées`}
        />
      </div>

      {/* Lower grid — Alertes (left) + Activité récente (right) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AlertesColumn items={alertes} />
        <RecentActivityColumn items={activity} />
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import { Plus, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { DeliveriesTable } from "@/components/livraisons/deliveries-table";
import { NewDeliveryDialog } from "@/components/livraisons/new-delivery-dialog";
import { useTraceabilityStore } from "@/lib/store";

export default function LivraisonsPage() {
  const deliveries = useTraceabilityStore((s) => s.deliveries);
  const finishedProducts = useTraceabilityStore((s) => s.finishedProducts);
  const customers = useTraceabilityStore((s) => s.customers);
  const hasHydrated = useTraceabilityStore((s) => s.hasHydrated);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  // Hydration guard: prevents empty-state flicker before persist middleware
  // rehydrates localStorage. Matches Phase 3 + Phase 4 pattern exactly.
  if (!hasHydrated) {
    return (
      <div className="flex items-center justify-between mb-6 h-9">
        <div />
        <Button disabled className="gap-2">
          <Plus size={16} aria-hidden="true" />
          <span>+ Nouvelle livraison</span>
        </Button>
      </div>
    );
  }

  const isEmpty = deliveries.length === 0;

  return (
    <>
      <div className="flex items-center justify-between mb-6 h-9">
        <div />
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus size={16} aria-hidden="true" />
          <span>+ Nouvelle livraison</span>
        </Button>
      </div>

      {isEmpty ? (
        <EmptyState
          icon={Truck}
          heading="Aucune livraison enregistrée"
          body="Préparez votre première livraison depuis cette page."
          cta={{
            label: "+ Nouvelle livraison",
            onClick: () => setDialogOpen(true),
            icon: Plus,
          }}
        />
      ) : (
        <DeliveriesTable
          deliveries={deliveries}
          finishedProducts={finishedProducts}
          customers={customers}
        />
      )}

      <NewDeliveryDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}

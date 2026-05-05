"use client";

import * as React from "react";
import { Plus, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { RawMaterialsTable } from "@/components/matieres/raw-materials-table";
import { ReceptionDialog } from "@/components/matieres/reception-dialog";
import { useTraceabilityStore } from "@/lib/store";

export default function MatieresPremieresPage() {
  const rawMaterials = useTraceabilityStore((s) => s.rawMaterials);
  const hasHydrated = useTraceabilityStore((s) => s.hasHydrated);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  // Avoid hydration flicker: until persist middleware has rehydrated, render a
  // disabled skeleton header. Without this guard we'd briefly show the empty state
  // before the seeded 5 lots appear.
  if (!hasHydrated) {
    return (
      <div className="flex items-center justify-between mb-6 h-9">
        <div />
        <Button onClick={() => setDialogOpen(true)} className="gap-2" disabled>
          <Plus size={16} aria-hidden="true" />
          <span>+ Réceptionner un lot</span>
        </Button>
      </div>
    );
  }

  const isEmpty = rawMaterials.length === 0;

  return (
    <>
      <div className="flex items-center justify-between mb-6 h-9">
        <div />
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus size={16} aria-hidden="true" />
          <span>+ Réceptionner un lot</span>
        </Button>
      </div>

      {isEmpty ? (
        <EmptyState
          icon={Package}
          heading="Aucune matière première en stock"
          body="Réceptionnez votre premier lot pour commencer le suivi."
          cta={{
            label: "+ Réceptionner un lot",
            onClick: () => setDialogOpen(true),
            icon: Plus,
          }}
        />
      ) : (
        <RawMaterialsTable rows={rawMaterials} />
      )}

      <ReceptionDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}

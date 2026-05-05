"use client";

import * as React from "react";
import { Plus, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/empty-state";
import { RawMaterialsTable } from "@/components/matieres/raw-materials-table";
import { ReceptionDialog } from "@/components/matieres/reception-dialog";
import { useTraceabilityStore } from "@/lib/store";

export default function MatieresPremieresPage() {
  const rawMaterials = useTraceabilityStore((s) => s.rawMaterials);
  const productionOrders = useTraceabilityStore((s) => s.productionOrders);
  const hasHydrated = useTraceabilityStore((s) => s.hasHydrated);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = query.toLowerCase();
    return rawMaterials.filter(
      (rm) => rm.nom.toLowerCase().includes(q) || rm.fournisseur.toLowerCase().includes(q)
    );
  }, [rawMaterials, query]);

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

      <div className="mb-4">
        <Input
          placeholder="Rechercher..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-64"
        />
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
      ) : filtered.length > 0 ? (
        <RawMaterialsTable rows={filtered} productionOrders={productionOrders} />
      ) : (
        <p className="text-sm text-muted-foreground py-8 text-center">
          Aucun résultat pour « {query} ».
        </p>
      )}

      <ReceptionDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}

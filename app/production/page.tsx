"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecettesTab } from "@/components/production/recettes-tab";
import { OrdreFabricationTable } from "@/components/production/ordre-fabrication-table";
import { useTraceabilityStore } from "@/lib/store";

export default function ProductionPage() {
  const recipes = useTraceabilityStore((s) => s.recipes);
  const productionOrders = useTraceabilityStore((s) => s.productionOrders);
  const rawMaterials = useTraceabilityStore((s) => s.rawMaterials);
  const hasHydrated = useTraceabilityStore((s) => s.hasHydrated);
  const [wizardOpen, setWizardOpen] = React.useState(false);

  // Hydration guard: matches Phase 3 pattern (hasHydrated prevents empty-state flicker).
  if (!hasHydrated) {
    return (
      <div className="flex items-center justify-between mb-6 h-9">
        <div />
        <Button className="gap-2" disabled>
          <Plus size={16} aria-hidden="true" />
          <span>+ Nouvel ordre de fabrication</span>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6 h-9">
        <div />
        <Button onClick={() => setWizardOpen(true)} className="gap-2">
          <Plus size={16} aria-hidden="true" />
          <span>+ Nouvel ordre de fabrication</span>
        </Button>
      </div>

      <Tabs defaultValue="recettes">
        <TabsList className="mb-4">
          <TabsTrigger value="recettes">Recettes</TabsTrigger>
          <TabsTrigger value="ordres">Ordres de fabrication</TabsTrigger>
        </TabsList>

        <TabsContent value="recettes">
          <RecettesTab recipes={recipes} />
        </TabsContent>

        <TabsContent value="ordres">
          <OrdreFabricationTable
            orders={productionOrders}
            recipes={recipes}
            rawMaterials={rawMaterials}
            onOpenWizard={() => setWizardOpen(true)}
          />
        </TabsContent>
      </Tabs>

      {/* Wave 3 (04-03-PLAN.md) drops <ProductionWizard> here, consuming wizardOpen + setWizardOpen */}
      {/* Temporary: ensure wizardOpen is consumed to avoid TS unused-variable warning */}
      {wizardOpen && null}
    </>
  );
}

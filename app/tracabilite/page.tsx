"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/empty-state";
import { TracabiliteUpstream } from "@/components/tracabilite/tracabilite-upstream";
import { TracabiliteDownstream } from "@/components/tracabilite/tracabilite-downstream";
import { useTraceabilityStore } from "@/lib/store";
import { detectLotType, findSupplierLot, findBroche } from "@/lib/tracabilite";
import type { RawMaterial, FinishedProduct } from "@/lib/types";

type SearchState =
  | { kind: "idle" }
  | { kind: "not-found" }
  | { kind: "upstream"; rm: RawMaterial }
  | { kind: "downstream"; broche: FinishedProduct };

function TracabilitePageInner() {
  const rawMaterials = useTraceabilityStore((s) => s.rawMaterials);
  const finishedProducts = useTraceabilityStore((s) => s.finishedProducts);
  const productionOrders = useTraceabilityStore((s) => s.productionOrders);
  const customers = useTraceabilityStore((s) => s.customers);
  const deliveries = useTraceabilityStore((s) => s.deliveries);
  const recipes = useTraceabilityStore((s) => s.recipes);
  const hasHydrated = useTraceabilityStore((s) => s.hasHydrated);

  const [query, setQuery] = React.useState("");
  const [searchState, setSearchState] = React.useState<SearchState>({ kind: "idle" });
  const searchParams = useSearchParams();
  const router = useRouter();

  const exampleSupplierLot = rawMaterials[0]?.numeroLotFournisseur ?? "";
  const exampleInternalLot = finishedProducts[0]?.numeroLotInterne ?? "";

  function triggerSearch(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;

    const lotType = detectLotType(trimmed);

    if (lotType === "broche") {
      const broche = findBroche(trimmed, finishedProducts);
      if (broche) {
        setSearchState({ kind: "downstream", broche });
      } else {
        const rm = findSupplierLot(trimmed, rawMaterials);
        setSearchState(rm ? { kind: "upstream", rm } : { kind: "not-found" });
      }
    } else if (lotType === "supplier") {
      const rm = findSupplierLot(trimmed, rawMaterials);
      setSearchState(rm ? { kind: "upstream", rm } : { kind: "not-found" });
    } else {
      setSearchState({ kind: "idle" });
    }
  }

  function handleSearch() {
    const trimmed = query.trim();
    if (!trimmed) return;
    router.replace(`/tracabilite?lot=${encodeURIComponent(trimmed)}`);
    triggerSearch(trimmed);
  }

  React.useEffect(() => {
    if (!hasHydrated) return;
    const lotParam = searchParams.get("lot");
    if (lotParam) {
      setQuery(lotParam);
      triggerSearch(lotParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated]);

  function applyChip(value: string) {
    setQuery(value);
    router.replace(`/tracabilite?lot=${encodeURIComponent(value)}`);
    triggerSearch(value);
  }

  return (
    <div className="flex flex-col gap-0">
      {/* Search card */}
      <div className="rounded-md border bg-background p-5 mb-8">
        {/* Shortcut chips */}
        <div className="flex gap-2 mb-3">
          <Button
            variant="outline"
            size="sm"
            disabled={!hasHydrated || !exampleSupplierLot}
            onClick={() => applyChip(exampleSupplierLot)}
          >
            Exemple — N° fournisseur
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasHydrated || !exampleInternalLot}
            onClick={() => applyChip(exampleInternalLot)}
          >
            Exemple — N° broche interne
          </Button>
        </div>

        {/* Search input row */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              aria-hidden="true"
            />
            <Input
              className="pl-9"
              placeholder="Rechercher un numéro de lot (matière première ou broche finie)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={!query.trim() || !hasHydrated}
          >
            Lancer la recherche
          </Button>
        </div>
      </div>

      {/* Result region */}
      {searchState.kind === "idle" && (
        <EmptyState
          icon={Search}
          heading="Lancez une recherche"
          body="Saisissez un numéro de lot ou utilisez un des exemples."
        />
      )}

      {searchState.kind === "not-found" && (
        <EmptyState
          icon={SearchX}
          heading="Aucun lot trouvé pour ce numéro"
          body="Vérifiez le format ou essayez un des exemples ci-dessus."
        />
      )}

      {searchState.kind === "upstream" && (
        <TracabiliteUpstream
          rm={searchState.rm}
          productionOrders={productionOrders}
          finishedProducts={finishedProducts}
          deliveries={deliveries}
          customers={customers}
          recipes={recipes}
        />
      )}

      {searchState.kind === "downstream" && (
        <TracabiliteDownstream
          broche={searchState.broche}
          productionOrders={productionOrders}
          rawMaterials={rawMaterials}
          customers={customers}
          deliveries={deliveries}
          recipes={recipes}
        />
      )}
    </div>
  );
}

export default function TracabilitePage() {
  return (
    <React.Suspense fallback={null}>
      <TracabilitePageInner />
    </React.Suspense>
  );
}

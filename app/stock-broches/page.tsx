"use client";

import * as React from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { StockBrochesTable } from "@/components/stock-broches/stock-broches-table";
import { useTraceabilityStore } from "@/lib/store";
import type { FinishedProduct } from "@/lib/types";
import type { SortKey, SortDir } from "@/components/stock-broches/stock-broches-table";

type FilterValue = "tous" | "en_stock" | "livree";

const FILTER_OPTIONS: { value: FilterValue; label: string }[] = [
  { value: "tous", label: "Tous" },
  { value: "en_stock", label: "En stock" },
  { value: "livree", label: "Livrés" },
];

function StockBrochesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const finishedProducts = useTraceabilityStore((s) => s.finishedProducts);
  const productionOrders = useTraceabilityStore((s) => s.productionOrders);
  const recipes = useTraceabilityStore((s) => s.recipes);
  const customers = useTraceabilityStore((s) => s.customers);
  const deliveries = useTraceabilityStore((s) => s.deliveries);
  const hasHydrated = useTraceabilityStore((s) => s.hasHydrated);

  const [sortKey, setSortKey] = React.useState<SortKey>("dlc");
  const [sortDir, setSortDir] = React.useState<SortDir>("asc");

  const rawStatut = searchParams.get("statut");
  const activeFilter: FilterValue =
    rawStatut === "tous" || rawStatut === "livree" ? rawStatut : "en_stock";

  function setFilter(value: FilterValue) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("statut", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const filtered = React.useMemo(() => {
    let rows: FinishedProduct[] =
      activeFilter === "tous"
        ? finishedProducts
        : finishedProducts.filter((b) => b.statut === activeFilter);

    rows = [...rows].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;
      switch (sortKey) {
        case "numeroLotInterne":
          aVal = a.numeroLotInterne;
          bVal = b.numeroLotInterne;
          break;
        case "poids":
          aVal = a.poids;
          bVal = b.poids;
          break;
        case "dlc":
          aVal = a.dlc;
          bVal = b.dlc;
          break;
        case "statut":
          aVal = a.statut;
          bVal = b.statut;
          break;
        default:
          // "recette" — sort by lot as proxy (recipe name requires lookup)
          aVal = a.numeroLotInterne;
          bVal = b.numeroLotInterne;
      }
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return rows;
  }, [finishedProducts, activeFilter, sortKey, sortDir]);

  if (!hasHydrated) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2 h-9">
          {FILTER_OPTIONS.map((opt) => (
            <div key={opt.value} className="h-9 w-20 bg-muted animate-pulse rounded-md" />
          ))}
        </div>
        <div className="h-48 bg-muted animate-pulse rounded-md" />
      </div>
    );
  }

  const isEmpty = filtered.length === 0;

  return (
    <div className="space-y-4">
      {/* Filter chips */}
      <div className="flex gap-2">
        {FILTER_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant={activeFilter === opt.value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {isEmpty ? (
        <EmptyState
          icon={Boxes}
          heading="Aucune broche en stock"
          body="Aucune broche en stock — lancez un ordre de fabrication"
        />
      ) : (
        <StockBrochesTable
          broches={filtered}
          productionOrders={productionOrders}
          recipes={recipes}
          customers={customers}
          deliveries={deliveries}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
        />
      )}
    </div>
  );
}

export default function StockBrochesPage() {
  return (
    <React.Suspense
      fallback={
        <div className="space-y-4">
          <div className="flex gap-2 h-9">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-9 w-20 bg-muted animate-pulse rounded-md" />
            ))}
          </div>
          <div className="h-48 bg-muted animate-pulse rounded-md" />
        </div>
      }
    >
      <StockBrochesContent />
    </React.Suspense>
  );
}

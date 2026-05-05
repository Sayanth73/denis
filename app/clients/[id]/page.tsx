"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ChevronDown, Truck } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { BrochesExpansion } from "@/components/clients/broches-expansion";
import { useTraceabilityStore } from "@/lib/store";
import { getDeliveriesForCustomer } from "@/lib/clients";
import {
  getDeliveryWeight,
  STATUT_LIVRAISON_CLASSES,
  STATUT_LIVRAISON_LABELS,
} from "@/lib/deliveries";
import { formatDate } from "@/lib/raw-materials";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

export default function ClientDetailPage() {
  const params = useParams();
  const id =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : "";

  const customers = useTraceabilityStore((s) => s.customers);
  const deliveries = useTraceabilityStore((s) => s.deliveries);
  const finishedProducts = useTraceabilityStore((s) => s.finishedProducts);
  const productionOrders = useTraceabilityStore((s) => s.productionOrders);
  const rawMaterials = useTraceabilityStore((s) => s.rawMaterials);
  const recipes = useTraceabilityStore((s) => s.recipes);
  const hasHydrated = useTraceabilityStore((s) => s.hasHydrated);

  // Derive customer before hooks so the useEffect can reference it safely
  const customer = customers.find((c) => c.id === id);

  const [expandedDeliveryId, setExpandedDeliveryId] = React.useState<string | null>(null);
  const [overrides, setOverrides] = React.useState<Record<string, string>>({});
  const [tarifsError, setTarifsError] = React.useState<string | null>(null);

  function toggleDelivery(deliveryId: string) {
    setExpandedDeliveryId((prev) => (prev === deliveryId ? null : deliveryId));
  }

  React.useEffect(() => {
    if (!hasHydrated || !customer) return;
    const init: Record<string, string> = {};
    for (const r of recipes) {
      const found = customer.tarifs.find((t) => t.recetteId === r.id);
      init[r.id] = found ? found.prixHT.toString() : "";
    }
    setOverrides(init);
  }, [hasHydrated]); // eslint-disable-line react-hooks/exhaustive-deps
  // Intentionally omits `customer` and `recipes` — re-initializing on every store
  // update would discard in-progress edits. One-time initialization after hydration.

  function handleSaveTarifs() {
    if (!customer) return;
    setTarifsError(null);
    for (const r of recipes) {
      const val = overrides[r.id] ?? "";
      if (val === "") continue; // empty = valid, means "use recipe default"
      if (isNaN(Number(val)) || Number(val) < 0) {
        setTarifsError(
          `Override invalide pour ${r.nom}. Saisissez un nombre ≥ 0 ou laissez vide.`,
        );
        return;
      }
    }
    const newTarifs: { recetteId: string; prixHT: number }[] = recipes
      .filter((r) => (overrides[r.id] ?? "") !== "")
      .map((r) => ({ recetteId: r.id, prixHT: Number(overrides[r.id]) }));
    const { updateCustomer } = useTraceabilityStore.getState();
    updateCustomer(customer.id, { tarifs: newTarifs });
    toast.success("Tarifs mis à jour");
  }

  if (!hasHydrated) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <ArrowLeft size={16} aria-hidden="true" />
        <span>Retour aux clients</span>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-sm text-muted-foreground">
        Client introuvable.
      </div>
    );
  }

  const customerDeliveries = getDeliveriesForCustomer(id, deliveries);

  return (
    <>
      {/* Back link */}
      <Link
        href="/clients"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft size={16} className="mr-1.5" aria-hidden="true" />
        Retour aux clients
      </Link>

      {/* Client info card */}
      <div className="rounded-md border bg-background p-5 mb-6">
        <h2 className="text-xl font-semibold mb-1">{customer.nom}</h2>
        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
          <span>{customer.adresse}</span>
          <span>·</span>
          <span>{customer.telephone}</span>
          {customer.email && (
            <>
              <span>·</span>
              <span>{customer.email}</span>
            </>
          )}
        </div>
      </div>

      {/* Tarifs spéciaux */}
      <div className="mb-6 space-y-4">
        <div>
          <h3 className="text-base font-semibold">Tarifs spéciaux</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Laissez vide pour utiliser le prix par défaut de la recette.
          </p>
        </div>

        <div className="rounded-md border bg-background overflow-hidden">
          <Table>
            <TableHeader className="bg-zinc-50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-sm font-medium text-muted-foreground py-3 px-3 border-b border-border text-left">
                  Recette
                </TableHead>
                <TableHead className="text-sm font-medium text-muted-foreground py-3 px-3 border-b border-border text-right">
                  Prix par défaut (CHF/kg)
                </TableHead>
                <TableHead className="text-sm font-medium text-muted-foreground py-3 px-3 border-b border-border text-right">
                  Override client (CHF/kg)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recipes.map((recipe) => (
                <TableRow key={recipe.id} className="border-b border-border hover:bg-transparent">
                  <TableCell className="py-2 px-3 text-sm">{recipe.nom}</TableCell>
                  <TableCell className="py-2 px-3 text-sm text-right tabular-nums text-muted-foreground">
                    {recipe.prixParDefautHT.toFixed(2)} CHF/kg
                  </TableCell>
                  <TableCell className="py-2 px-3 text-right">
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder={recipe.prixParDefautHT.toFixed(2)}
                      className="w-24 text-right tabular-nums"
                      value={overrides[recipe.id] ?? ""}
                      onChange={(e) =>
                        setOverrides((prev) => ({ ...prev, [recipe.id]: e.target.value }))
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {tarifsError && (
          <p className="text-sm text-destructive">{tarifsError}</p>
        )}

        <Button type="button" onClick={handleSaveTarifs}>
          Enregistrer
        </Button>
      </div>

      {/* Deliveries section */}
      <h3 className="text-base font-semibold mb-4">Historique des livraisons</h3>

      {customerDeliveries.length === 0 ? (
        <EmptyState
          icon={Truck}
          heading="Aucune livraison"
          body="Ce client n'a pas encore reçu de livraison."
        />
      ) : (
        <div className="space-y-2">
          {customerDeliveries.map((delivery) => {
            const isExpanded = expandedDeliveryId === delivery.id;
            const weight = getDeliveryWeight(delivery, finishedProducts);
            const nbBroches = delivery.brochesLivrees.length;

            return (
              <div key={delivery.id} className="rounded-md border bg-background">
                {/* Delivery header row — clickable */}
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-50 text-left"
                  onClick={() => toggleDelivery(delivery.id)}
                >
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-medium">{formatDate(delivery.date)}</span>
                    <span className="text-muted-foreground">
                      {nbBroches} broche(s)
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {weight} kg
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium",
                        STATUT_LIVRAISON_CLASSES[delivery.statut],
                      )}
                    >
                      {STATUT_LIVRAISON_LABELS[delivery.statut]}
                    </span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={cn(
                      "transition-transform text-muted-foreground",
                      isExpanded && "rotate-180",
                    )}
                    aria-hidden="true"
                  />
                </button>

                {/* Expanded: broches + nested RM expansion */}
                {isExpanded && (
                  <BrochesExpansion
                    delivery={delivery}
                    finishedProducts={finishedProducts}
                    productionOrders={productionOrders}
                    rawMaterials={rawMaterials}
                    recipes={recipes}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

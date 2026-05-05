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

  const [expandedDeliveryId, setExpandedDeliveryId] = React.useState<string | null>(null);

  function toggleDelivery(deliveryId: string) {
    setExpandedDeliveryId((prev) => (prev === deliveryId ? null : deliveryId));
  }

  if (!hasHydrated) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <ArrowLeft size={16} aria-hidden="true" />
        <span>Retour aux clients</span>
      </div>
    );
  }

  const customer = customers.find((c) => c.id === id);

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

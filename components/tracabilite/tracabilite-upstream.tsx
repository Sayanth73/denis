"use client";

import * as React from "react";
import { useReactToPrint } from "react-to-print";
import { ChevronDown, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DlcBadge } from "@/components/dlc-badge";
import { TracabiliteSection } from "@/components/ui/tracabilite-section";
import { TracabilitePrintable } from "@/components/tracabilite/tracabilite-printable";
import { getProductionOrdersForRm, getClientsImpactes } from "@/lib/tracabilite";
import { getRecipeForBroche } from "@/lib/finished-products";
import { TYPE_LABELS, formatDate } from "@/lib/raw-materials";
import type {
  RawMaterial,
  FinishedProduct,
  ProductionOrder,
  Customer,
  Delivery,
  Recipe,
} from "@/lib/types";

type TracabiliteUpstreamProps = {
  rm: RawMaterial;
  productionOrders: ProductionOrder[];
  finishedProducts: FinishedProduct[];
  deliveries: Delivery[];
  customers: Customer[];
  recipes: Recipe[];
};

export function TracabiliteUpstream({
  rm,
  productionOrders,
  finishedProducts,
  deliveries,
  customers,
  recipes,
}: TracabiliteUpstreamProps) {
  const printableRef = React.useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printableRef,
    documentTitle: "Tracabilite-" + rm.numeroLotFournisseur,
  });

  const orders = getProductionOrdersForRm(rm.id, productionOrders);
  const clients = getClientsImpactes(
    rm.id,
    productionOrders,
    finishedProducts,
    deliveries,
    customers,
  );

  return (
    <div>
      {/* Top row: heading + export button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">Dossier traçabilité — amont</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Lot fournisseur :{" "}
            <span className="font-mono">{rm.numeroLotFournisseur}</span>
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <FileText size={14} className="mr-1.5" aria-hidden="true" />
          Exporter dossier (PDF)
        </Button>
      </div>

      {/* Printable content */}
      <TracabilitePrintable ref={printableRef}>
        {/* Connector wrapper */}
        <div className="relative flex flex-col gap-0">
          {/* Left rail line */}
          <div
            className="absolute left-4 top-8 bottom-8 w-px bg-border"
            aria-hidden="true"
          />

          {/* Section 1 — Matière première */}
          <TracabiliteSection step={1} heading="Matière première">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground font-medium">Fournisseur</dt>
              <dd>{rm.fournisseur}</dd>
              <dt className="text-muted-foreground font-medium">N° lot</dt>
              <dd>
                <span className="font-mono text-xs">{rm.numeroLotFournisseur}</span>
              </dd>
              <dt className="text-muted-foreground font-medium">Type</dt>
              <dd>{TYPE_LABELS[rm.type]}</dd>
              <dt className="text-muted-foreground font-medium">Nom</dt>
              <dd>{rm.nom}</dd>
              <dt className="text-muted-foreground font-medium">Date réception</dt>
              <dd>{formatDate(rm.dateReception)}</dd>
              <dt className="text-muted-foreground font-medium">DLC</dt>
              <dd>
                <DlcBadge value={rm.dlc} />
              </dd>
              <dt className="text-muted-foreground font-medium">Quantité reçue</dt>
              <dd>
                <span className="tabular-nums">{rm.quantiteRecue} kg</span>
              </dd>
              <dt className="text-muted-foreground font-medium">Température</dt>
              <dd>
                <span className="tabular-nums">{rm.temperatureReception} °C</span>
              </dd>
              {rm.certificatSanitaire && (
                <>
                  <dt className="text-muted-foreground font-medium">
                    Certificat sanitaire
                  </dt>
                  <dd>{rm.certificatSanitaire}</dd>
                </>
              )}
            </dl>
          </TracabiliteSection>

          {/* Connector chevron */}
          <div
            className="flex items-center pl-4 py-2 text-muted-foreground"
            aria-hidden="true"
          >
            <ChevronDown size={16} />
          </div>

          {/* Section 2 — Ordres de fabrication concernés */}
          <TracabiliteSection step={2} heading="Ordres de fabrication concernés">
            {orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun ordre de fabrication lié.
              </p>
            ) : (
              <Table>
                <colgroup>
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "50%" }} />
                  <col style={{ width: "30%" }} />
                </colgroup>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-medium text-muted-foreground py-2 px-3">
                      Date
                    </TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground py-2 px-3">
                      Recette
                    </TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground py-2 px-3 text-right">
                      Qté consommée
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map(({ order, quantiteUtilisee }) => {
                    const recipe = recipes.find((r) => r.id === order.recipeId);
                    return (
                      <TableRow
                        key={order.id}
                        className="border-b border-border last:border-b-0"
                      >
                        <TableCell className="py-2 px-3 text-sm">
                          {formatDate(order.date)}
                        </TableCell>
                        <TableCell className="py-2 px-3 text-sm">
                          {recipe?.nom ?? "—"}
                        </TableCell>
                        <TableCell className="py-2 px-3 text-sm text-right tabular-nums">
                          {quantiteUtilisee} kg
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </TracabiliteSection>

          {/* Connector chevron */}
          <div
            className="flex items-center pl-4 py-2 text-muted-foreground"
            aria-hidden="true"
          >
            <ChevronDown size={16} />
          </div>

          {/* Section 3 — Clients impactés */}
          <TracabiliteSection step={3} heading="Clients impactés">
            {clients.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun client impacté.</p>
            ) : (
              <Table>
                <colgroup>
                  <col style={{ width: "35%" }} />
                  <col style={{ width: "25%" }} />
                  <col style={{ width: "40%" }} />
                </colgroup>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-medium text-muted-foreground py-2 px-3">
                      Client
                    </TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground py-2 px-3">
                      Date livraison
                    </TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground py-2 px-3">
                      Lots livrés
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map(({ customer, delivery, broches }) => (
                    <TableRow
                      key={delivery.id}
                      className="border-b border-border last:border-b-0"
                    >
                      <TableCell className="py-2 px-3 text-sm">
                        {customer.nom}
                      </TableCell>
                      <TableCell className="py-2 px-3 text-sm">
                        {formatDate(delivery.date)}
                      </TableCell>
                      <TableCell className="py-2 px-3 text-sm">
                        <div className="flex flex-col gap-0.5">
                          {broches.map((fp) => {
                            const recipe = getRecipeForBroche(fp, productionOrders, recipes);
                            return (
                              <span key={fp.id} className="flex items-baseline gap-1.5 text-xs">
                                <span className="font-mono">{fp.numeroLotInterne}</span>
                                {recipe && (
                                  <span className="text-muted-foreground">{recipe.nom}</span>
                                )}
                              </span>
                            );
                          })}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TracabiliteSection>
        </div>
      </TracabilitePrintable>
    </div>
  );
}

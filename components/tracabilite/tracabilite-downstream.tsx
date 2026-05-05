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
import { getRecipeForOrder } from "@/lib/tracabilite";
import { getRawMaterialsForBroche } from "@/lib/clients";
import { TYPE_LABELS, formatDate } from "@/lib/raw-materials";
import type {
  RawMaterial,
  FinishedProduct,
  ProductionOrder,
  Customer,
  Delivery,
  Recipe,
} from "@/lib/types";

type TracabiliteDownstreamProps = {
  broche: FinishedProduct;
  productionOrders: ProductionOrder[];
  rawMaterials: RawMaterial[];
  customers: Customer[];
  deliveries: Delivery[];
  recipes: Recipe[];
};

export function TracabiliteDownstream({
  broche,
  productionOrders,
  rawMaterials,
  customers,
  deliveries,
  recipes,
}: TracabiliteDownstreamProps) {
  const printableRef = React.useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printableRef,
    documentTitle: "Tracabilite-" + broche.numeroLotInterne,
  });

  const orderAndRecipe = getRecipeForOrder(broche, productionOrders, recipes);
  const rmsUsed = getRawMaterialsForBroche(broche, productionOrders, rawMaterials);
  const delivery = broche.livraisonId
    ? deliveries.find((d) => d.id === broche.livraisonId)
    : undefined;
  const customer = delivery
    ? customers.find((c) => c.id === delivery.customerId)
    : undefined;

  const statutClass =
    broche.statut === "livree"
      ? "inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium bg-emerald-50 text-emerald-800 border-emerald-200"
      : "inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium bg-zinc-100 text-zinc-700 border-zinc-200";
  const statutLabel = broche.statut === "livree" ? "Livrée" : "En stock";

  return (
    <div>
      {/* Top row: heading + export button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">Dossier traçabilité — aval</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Lot interne :{" "}
            <span className="font-mono">{broche.numeroLotInterne}</span>
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

          {/* Section 1 — Broche finie */}
          <TracabiliteSection step={1} heading="Broche finie">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground font-medium">N° lot interne</dt>
              <dd>
                <span className="font-mono text-xs">{broche.numeroLotInterne}</span>
              </dd>
              <dt className="text-muted-foreground font-medium">Date production</dt>
              <dd>{formatDate(broche.dateProduction)}</dd>
              <dt className="text-muted-foreground font-medium">Poids</dt>
              <dd>
                <span className="tabular-nums">{broche.poids} kg</span>
              </dd>
              <dt className="text-muted-foreground font-medium">DLC</dt>
              <dd>
                <DlcBadge value={broche.dlc} />
              </dd>
              <dt className="text-muted-foreground font-medium">Statut</dt>
              <dd>
                <span className={statutClass}>{statutLabel}</span>
              </dd>
              {broche.statut === "livree" && customer && delivery && (
                <>
                  <dt className="text-muted-foreground font-medium">Client livré</dt>
                  <dd>{customer.nom}</dd>
                  <dt className="text-muted-foreground font-medium">Date livraison</dt>
                  <dd>{formatDate(delivery.date)}</dd>
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

          {/* Section 2 — Ordre de fabrication */}
          <TracabiliteSection step={2} heading="Ordre de fabrication">
            {!orderAndRecipe ? (
              <p className="text-sm text-muted-foreground">
                Ordre de fabrication introuvable.
              </p>
            ) : (
              <>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm mb-4">
                  <dt className="text-muted-foreground font-medium">Date</dt>
                  <dd>{formatDate(orderAndRecipe.order.date)}</dd>
                  <dt className="text-muted-foreground font-medium">Recette</dt>
                  <dd>{orderAndRecipe.recipe.nom}</dd>
                  <dt className="text-muted-foreground font-medium">Nombre broches</dt>
                  <dd>
                    <span className="tabular-nums">
                      {orderAndRecipe.order.brochesProduites.length}
                    </span>
                  </dd>
                </dl>
                {orderAndRecipe.recipe.composition.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1.5">
                      Composition
                    </p>
                    <div>
                      {orderAndRecipe.recipe.composition.map((ing) => (
                        <span
                          key={ing.typeMatiere}
                          className="inline-flex items-center px-2 py-0.5 rounded-md border text-xs bg-zinc-100 text-zinc-700 border-zinc-200 mr-1 mb-1"
                        >
                          {ing.pourcentage}% {TYPE_LABELS[ing.typeMatiere]}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </TracabiliteSection>

          {/* Connector chevron */}
          <div
            className="flex items-center pl-4 py-2 text-muted-foreground"
            aria-hidden="true"
          >
            <ChevronDown size={16} />
          </div>

          {/* Section 3 — Matières premières utilisées */}
          <TracabiliteSection step={3} heading="Matières premières utilisées">
            {rmsUsed.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune matière première trouvée.
              </p>
            ) : (
              <Table>
                <colgroup>
                  <col style={{ width: "22%" }} />
                  <col style={{ width: "32%" }} />
                  <col style={{ width: "28%" }} />
                  <col style={{ width: "18%" }} />
                </colgroup>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-medium text-muted-foreground py-2 px-3">
                      Matière
                    </TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground py-2 px-3">
                      Fournisseur
                    </TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground py-2 px-3">
                      N° lot fournisseur
                    </TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground py-2 px-3 text-right">
                      Qté utilisée
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rmsUsed.map(({ rm, quantiteUtilisee }) => (
                    <TableRow
                      key={rm.id}
                      className="border-b border-border last:border-b-0"
                    >
                      <TableCell className="py-2 px-3 text-sm">
                        {TYPE_LABELS[rm.type]}
                      </TableCell>
                      <TableCell className="py-2 px-3 text-sm">
                        {rm.fournisseur}
                      </TableCell>
                      <TableCell className="py-2 px-3 text-sm">
                        <span className="font-mono text-xs">
                          {rm.numeroLotFournisseur}
                        </span>
                      </TableCell>
                      <TableCell className="py-2 px-3 text-sm text-right tabular-nums">
                        {quantiteUtilisee} kg
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

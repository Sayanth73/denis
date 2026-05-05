"use client";

import * as React from "react";
import Link from "next/link";
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
import { getBrochesForDelivery, getRawMaterialsForBroche } from "@/lib/clients";
import { TYPE_LABELS } from "@/lib/raw-materials";
import type {
  Delivery,
  FinishedProduct,
  ProductionOrder,
  RawMaterial,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// UpstreamRMList — private component, nested inside a broche row
// ---------------------------------------------------------------------------

type UpstreamRMListProps = {
  broche: FinishedProduct;
  productionOrders: ProductionOrder[];
  rawMaterials: RawMaterial[];
};

function UpstreamRMList({ broche, productionOrders, rawMaterials }: UpstreamRMListProps) {
  const entries = getRawMaterialsForBroche(broche, productionOrders, rawMaterials);

  return (
    <div className="border-t bg-white">
      <Table>
        <colgroup>
          <col style={{ width: "28%" }} />
          <col style={{ width: "30%" }} />
          <col style={{ width: "28%" }} />
          <col style={{ width: "14%" }} />
        </colgroup>
        <TableHeader>
          <TableRow className="bg-zinc-50">
            <TableHead className="text-xs font-medium text-muted-foreground py-2 px-4 border-b border-border">
              Matière
            </TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground py-2 px-4 border-b border-border">
              Fournisseur
            </TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground py-2 px-4 border-b border-border">
              N° lot fournisseur
            </TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground py-2 px-4 border-b border-border">
              Qté utilisée
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="py-4 px-4 text-sm text-muted-foreground text-center"
              >
                Aucune matière première trouvée.
              </TableCell>
            </TableRow>
          ) : (
            entries.map(({ rm, quantiteUtilisee }) => (
              <TableRow
                key={rm.id}
                className="border-b border-border last:border-b-0"
              >
                <TableCell className="py-2 px-4 text-sm">
                  {TYPE_LABELS[rm.type]}
                </TableCell>
                <TableCell className="py-2 px-4 text-sm">
                  {rm.fournisseur}
                </TableCell>
                <TableCell className="py-2 px-4 text-sm">
                  <span className="font-mono text-xs">{rm.numeroLotFournisseur}</span>
                </TableCell>
                <TableCell className="py-2 px-4 text-sm">
                  <span className="tabular-nums">{quantiteUtilisee} kg</span>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BrochesExpansion — exported component
// ---------------------------------------------------------------------------

type BrochesExpansionProps = {
  delivery: Delivery;
  finishedProducts: FinishedProduct[];
  productionOrders: ProductionOrder[];
  rawMaterials: RawMaterial[];
};

export function BrochesExpansion({
  delivery,
  finishedProducts,
  productionOrders,
  rawMaterials,
}: BrochesExpansionProps): JSX.Element {
  const [expandedBrocheId, setExpandedBrocheId] = React.useState<string | null>(null);

  function toggleBroche(id: string) {
    setExpandedBrocheId((prev) => (prev === id ? null : id));
  }

  const broches = getBrochesForDelivery(delivery, finishedProducts);

  return (
    <div className="border-t bg-zinc-50">
      <Table>
        <colgroup>
          <col style={{ width: "40%" }} />
          <col style={{ width: "18%" }} />
          <col style={{ width: "22%" }} />
          <col style={{ width: "20%" }} />
        </colgroup>
        <TableHeader>
          <TableRow className="bg-zinc-100">
            <TableHead className="text-xs font-medium text-muted-foreground py-2 px-4 border-b border-border">
              N° lot interne
            </TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground py-2 px-4 border-b border-border">
              Poids
            </TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground py-2 px-4 border-b border-border">
              DLC
            </TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground py-2 px-4 border-b border-border" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {broches.map((fp) => (
            <React.Fragment key={fp.id}>
              <TableRow className="border-b border-border last:border-b-0">
                <TableCell className="py-2 px-4 text-sm">
                  <Link
                    href={`/tracabilite?lot=${fp.numeroLotInterne}`}
                    className="font-mono hover:underline text-primary"
                    title="Voir la traçabilité de ce lot"
                  >
                    {fp.numeroLotInterne}
                  </Link>
                </TableCell>
                <TableCell className="py-2 px-4 text-sm">
                  <span className="tabular-nums">{fp.poids} kg</span>
                </TableCell>
                <TableCell className="py-2 px-4 text-sm">
                  <DlcBadge value={fp.dlc} />
                </TableCell>
                <TableCell className="py-2 px-4 text-sm text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => toggleBroche(fp.id)}
                    className="text-xs"
                  >
                    {expandedBrocheId === fp.id ? "Masquer" : "Voir matières premières"}
                  </Button>
                </TableCell>
              </TableRow>
              {expandedBrocheId === fp.id && (
                <TableRow>
                  <TableCell colSpan={4} className="p-0">
                    <UpstreamRMList
                      broche={fp}
                      productionOrders={productionOrders}
                      rawMaterials={rawMaterials}
                    />
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

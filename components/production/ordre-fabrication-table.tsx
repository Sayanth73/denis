"use client";

import { Factory, Plus } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { formatDate } from "@/lib/raw-materials";
import type { ProductionOrder, Recipe, RawMaterial } from "@/lib/types";

type OrdreFabricationTableProps = {
  orders: ProductionOrder[];
  recipes: Recipe[];
  rawMaterials: RawMaterial[];
  onOpenWizard: () => void;
};

export function OrdreFabricationTable({
  orders,
  recipes,
  rawMaterials,
  onOpenWizard,
}: OrdreFabricationTableProps) {
  if (orders.length === 0) {
    return (
      <EmptyState
        icon={Factory}
        heading="Aucun ordre de fabrication"
        body="Créez votre premier ordre pour commencer la production."
        cta={{
          label: "+ Nouvel ordre de fabrication",
          onClick: onOpenWizard,
          icon: Plus,
        }}
      />
    );
  }

  // Build lookup maps for display
  const recipeMap = new Map(recipes.map((r) => [r.id, r]));
  const rmMap = new Map(rawMaterials.map((rm) => [rm.id, rm]));

  return (
    <div className="rounded-md border bg-background overflow-x-auto overflow-hidden">
      <Table>
        <colgroup>
          <col style={{ width: "14%" }} />
          <col style={{ width: "26%" }} />
          <col style={{ width: "12%" }} />
          <col style={{ width: "16%" }} />
          <col style={{ width: "32%" }} />
        </colgroup>
        <TableHeader className="bg-zinc-50">
          <TableRow>
            <TableHead className="text-sm font-medium text-muted-foreground py-3 px-3 border-b border-border text-left">
              Date
            </TableHead>
            <TableHead className="text-sm font-medium text-muted-foreground py-3 px-3 border-b border-border text-left">
              Recette
            </TableHead>
            <TableHead className="text-sm font-medium text-muted-foreground py-3 px-3 border-b border-border text-right">
              Nb broches
            </TableHead>
            <TableHead className="text-sm font-medium text-muted-foreground py-3 px-3 border-b border-border text-right">
              Poids total
            </TableHead>
            <TableHead className="text-sm font-medium text-muted-foreground py-3 px-3 border-b border-border text-left">
              Lots consommés
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const recipe = recipeMap.get(order.recipeId);
            const recipeName = recipe?.nom ?? order.recipeId;
            const poidsTotal = recipe
              ? recipe.poidsTotal * order.nombreBroches
              : 0;
            const lotsLabel = order.matieresPremieresUtilisees
              .map(
                (mu) =>
                  rmMap.get(mu.rawMaterialId)?.numeroLotFournisseur ??
                  mu.rawMaterialId,
              )
              .join(", ");

            return (
              <TableRow
                key={order.id}
                className="border-b border-border hover:bg-zinc-50 min-h-9"
              >
                <TableCell className="py-2 px-3 text-sm whitespace-nowrap">
                  {formatDate(order.date)}
                </TableCell>
                <TableCell className="py-2 px-3 text-sm truncate">
                  {recipeName}
                </TableCell>
                <TableCell className="py-2 px-3 text-sm tabular-nums whitespace-nowrap text-right">
                  {order.nombreBroches}
                </TableCell>
                <TableCell className="py-2 px-3 text-sm tabular-nums whitespace-nowrap text-right">
                  {poidsTotal} kg
                </TableCell>
                <TableCell className="py-2 px-3 text-sm font-mono truncate">
                  {lotsLabel}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

"use client";

import * as React from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DlcBadge } from "@/components/dlc-badge";
import type { FinishedProduct, ProductionOrder, Recipe, Customer, Delivery } from "@/lib/types";
import { getRecipeForBroche } from "@/lib/finished-products";

export type SortKey = "numeroLotInterne" | "recette" | "poids" | "dlc" | "statut";
export type SortDir = "asc" | "desc";

type Props = {
  broches: FinishedProduct[];
  productionOrders: ProductionOrder[];
  recipes: Recipe[];
  customers: Customer[];
  deliveries: Delivery[];
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
};

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown size={14} className="ml-1 text-muted-foreground" />;
  return sortDir === "asc"
    ? <ChevronUp size={14} className="ml-1" />
    : <ChevronDown size={14} className="ml-1" />;
}

function resolveCustomer(
  broche: FinishedProduct,
  deliveries: Delivery[],
  customers: Customer[],
): string {
  if (!broche.livraisonId) return "—";
  const delivery = deliveries.find((d) => d.id === broche.livraisonId);
  if (!delivery) return "—";
  const customer = customers.find((c) => c.id === delivery.customerId);
  return customer?.nom ?? "—";
}

const STATUT_LABEL: Record<FinishedProduct["statut"], string> = {
  en_stock: "En stock",
  livree: "Livrée",
};

const STATUT_VARIANT: Record<FinishedProduct["statut"], "default" | "secondary"> = {
  en_stock: "default",
  livree: "secondary",
};

export function StockBrochesTable({
  broches,
  productionOrders,
  recipes,
  customers,
  deliveries,
  sortKey,
  sortDir,
  onSort,
}: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {(
            [
              ["numeroLotInterne", "N° lot interne"],
              ["recette", "Recette"],
              ["poids", "Poids (kg)"],
              ["dlc", "DLC"],
              ["statut", "Statut"],
            ] as [SortKey, string][]
          ).map(([key, label]) => (
            <TableHead
              key={key}
              className="cursor-pointer select-none"
              onClick={() => onSort(key)}
            >
              <span className="inline-flex items-center">
                {label}
                <SortIcon col={key} sortKey={sortKey} sortDir={sortDir} />
              </span>
            </TableHead>
          ))}
          <TableHead>Client livré</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {broches.map((broche) => {
          const recipe = getRecipeForBroche(broche, productionOrders, recipes);
          const customerName = resolveCustomer(broche, deliveries, customers);
          return (
            <TableRow key={broche.id}>
              <TableCell className="font-mono text-sm">{broche.numeroLotInterne}</TableCell>
              <TableCell>{recipe?.nom ?? "—"}</TableCell>
              <TableCell className="tabular-nums">{broche.poids.toFixed(1)}</TableCell>
              <TableCell>
                <DlcBadge value={broche.dlc} />
              </TableCell>
              <TableCell>
                <Badge variant={STATUT_VARIANT[broche.statut]}>
                  {STATUT_LABEL[broche.statut]}
                </Badge>
              </TableCell>
              <TableCell>{customerName}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

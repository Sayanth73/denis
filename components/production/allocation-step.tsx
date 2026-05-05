"use client";

import { DlcBadge } from "@/components/dlc-badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  computeRequiredQty,
  getEligibleLots,
  computeShortfall,
  todayIso,
} from "@/lib/production";
import { TYPE_LABELS } from "@/lib/raw-materials";
import { cn } from "@/lib/utils";
import type { RawMaterial, Recipe } from "@/lib/types";

// Reuse allocation map type locally (same shape as parent)
type AllocationsByIngredient = Record<string, Record<string, number>>;

type AllocationStepProps = {
  recipe: Recipe;
  nombreBroches: number;
  rawMaterials: RawMaterial[];
  allocations: AllocationsByIngredient;
  onChange: (next: AllocationsByIngredient) => void;
  errors: Record<string, string>;
};

export function AllocationStep({
  recipe,
  nombreBroches,
  rawMaterials,
  allocations,
  onChange,
  errors,
}: AllocationStepProps) {
  const today = todayIso();

  function handleAllocationChange(
    typeMatiere: string,
    rawMaterialId: string,
    rawValue: string,
  ) {
    const qty = parseFloat(rawValue);
    const safeQty = Number.isNaN(qty) ? 0 : Math.max(0, qty);
    const next = {
      ...allocations,
      [typeMatiere]: {
        ...allocations[typeMatiere],
        [rawMaterialId]: Math.round(safeQty * 100) / 100,
      },
    };
    onChange(next);
  }

  return (
    <div className="space-y-6">
      {recipe.composition.map((ing) => {
        const requiredQty = computeRequiredQty(ing, recipe, nombreBroches);
        const eligibleLots = getEligibleLots(rawMaterials, ing.typeMatiere, today);
        const ingAllocations = allocations[ing.typeMatiere] ?? {};
        const shortfall = computeShortfall(ingAllocations, requiredQty);
        const error = errors[ing.typeMatiere];

        return (
          <div key={ing.typeMatiere}>
            {/* Ingredient header */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">
                {TYPE_LABELS[ing.typeMatiere]} — requis :{" "}
                {requiredQty.toFixed(2)} kg
              </span>
            </div>

            {/* Lot mini-table */}
            {eligibleLots.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                Aucun lot disponible pour ce type de matière première.
              </p>
            ) : (
              <div className="rounded border bg-background overflow-hidden">
                <Table>
                  <colgroup>
                    <col style={{ width: "36%" }} />
                    <col style={{ width: "20%" }} />
                    <col style={{ width: "20%" }} />
                    <col style={{ width: "24%" }} />
                  </colgroup>
                  <TableHeader className="bg-zinc-50">
                    <TableRow>
                      <TableHead className="text-xs font-medium text-muted-foreground py-2 px-3 border-b border-border">
                        N° lot fournisseur
                      </TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground py-2 px-3 border-b border-border">
                        DLC
                      </TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground py-2 px-3 border-b border-border text-right">
                        Disponible
                      </TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground py-2 px-3 border-b border-border text-right">
                        Allouer (kg)
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eligibleLots.map((lot) => (
                      <TableRow
                        key={lot.id}
                        className="border-b border-border hover:bg-zinc-50"
                      >
                        <TableCell className="py-1.5 px-3 text-xs font-mono truncate">
                          {lot.numeroLotFournisseur}
                        </TableCell>
                        <TableCell className="py-1.5 px-3 text-xs">
                          <DlcBadge value={lot.dlc} />
                        </TableCell>
                        <TableCell className="py-1.5 px-3 text-xs tabular-nums text-right text-muted-foreground">
                          {lot.quantiteRestante.toFixed(2)} kg
                        </TableCell>
                        <TableCell className="py-1.5 px-3 text-right">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            className="h-7 text-xs w-full text-right"
                            value={ingAllocations[lot.id] ?? 0}
                            onChange={(e) =>
                              handleAllocationChange(
                                ing.typeMatiere,
                                lot.id,
                                e.target.value,
                              )
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Running total + shortfall / complete badge */}
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">
                Total alloué :{" "}
                {(requiredQty - shortfall).toFixed(2)} kg
              </span>
              {shortfall > 0 ? (
                <span
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium",
                    "bg-amber-100 text-amber-800 border-amber-200",
                  )}
                >
                  manquant : {shortfall.toFixed(2)} kg
                </span>
              ) : (
                <span
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium",
                    "bg-emerald-100 text-emerald-800 border-emerald-200",
                  )}
                >
                  Complet
                </span>
              )}
            </div>

            {/* Shortfall validation error (fired on step-advance attempt) */}
            {error ? (
              <p className="text-xs text-destructive mt-1.5">{error}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

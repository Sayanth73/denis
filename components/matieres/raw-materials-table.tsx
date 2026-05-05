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
import { DlcBadge } from "@/components/dlc-badge";
import {
  TYPE_LABELS,
  STATUT_LABELS,
  STATUT_CLASSES,
  deriveStatut,
} from "@/lib/raw-materials";
import { cn } from "@/lib/utils";
import type { RawMaterial } from "@/lib/types";

type RawMaterialsTableProps = { rows: RawMaterial[] };

type SortKey =
  | "type"
  | "nom"
  | "fournisseur"
  | "numeroLotFournisseur"
  | "quantite"
  | "dlc"
  | "statut";
type SortDir = "asc" | "desc";

const COLUMNS: Array<{
  key: SortKey;
  label: string;
  width: string;
  align: "left" | "right";
}> = [
  { key: "type", label: "Type", width: "10%", align: "left" },
  { key: "nom", label: "Nom", width: "22%", align: "left" },
  { key: "fournisseur", label: "Fournisseur", width: "18%", align: "left" },
  { key: "numeroLotFournisseur", label: "N° lot fournisseur", width: "16%", align: "left" },
  { key: "quantite", label: "Quantité", width: "12%", align: "right" },
  { key: "dlc", label: "DLC", width: "12%", align: "left" },
  { key: "statut", label: "Statut", width: "10%", align: "left" },
];

function compare(a: RawMaterial, b: RawMaterial, key: SortKey, today: Date): number {
  switch (key) {
    case "type":
      return TYPE_LABELS[a.type].localeCompare(TYPE_LABELS[b.type], "fr");
    case "nom":
      return a.nom.localeCompare(b.nom, "fr");
    case "fournisseur":
      return a.fournisseur.localeCompare(b.fournisseur, "fr");
    case "numeroLotFournisseur":
      return a.numeroLotFournisseur.localeCompare(b.numeroLotFournisseur, "fr");
    case "quantite":
      return a.quantiteRestante - b.quantiteRestante;
    case "dlc":
      return a.dlc.localeCompare(b.dlc);
    case "statut": {
      const order: Record<string, number> = { actif: 0, epuise: 1, dlc_depassee: 2 };
      return order[deriveStatut(a, today)] - order[deriveStatut(b, today)];
    }
  }
}

export function RawMaterialsTable({ rows }: RawMaterialsTableProps) {
  const [sortKey, setSortKey] = React.useState<SortKey | null>(null);
  const [sortDir, setSortDir] = React.useState<SortDir>("asc");
  const today = React.useMemo(() => new Date(), []);

  const sorted = React.useMemo(() => {
    if (!sortKey) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const r = compare(a, b, sortKey, today);
      return sortDir === "asc" ? r : -r;
    });
    return copy;
  }, [rows, sortKey, sortDir, today]);

  function handleSort(key: SortKey) {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
      return;
    }
    if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortKey(null);
      setSortDir("asc");
    }
  }

  return (
    <div className="rounded-md border bg-background overflow-hidden">
      <Table>
        <colgroup>
          {COLUMNS.map((c) => (
            <col key={c.key} style={{ width: c.width }} />
          ))}
        </colgroup>
        <TableHeader className="bg-zinc-50">
          <TableRow>
            {COLUMNS.map((c) => {
              const active = sortKey === c.key;
              const Indicator =
                !active
                  ? ChevronsUpDown
                  : sortDir === "asc"
                  ? ChevronUp
                  : ChevronDown;
              return (
                <TableHead
                  key={c.key}
                  className={cn(
                    "text-sm font-medium text-muted-foreground py-3 px-3 border-b border-border",
                    c.align === "right" ? "text-right" : "text-left",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => handleSort(c.key)}
                    className={cn(
                      "inline-flex items-center gap-1",
                      c.align === "right" ? "ml-auto" : "",
                    )}
                  >
                    <span>{c.label}</span>
                    <Indicator
                      size={14}
                      className={active ? "text-foreground" : "text-muted-foreground/60"}
                      aria-hidden="true"
                    />
                  </button>
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((rm) => {
            const statut = deriveStatut(rm, today);
            return (
              <TableRow
                key={rm.id}
                className="border-b border-border hover:bg-zinc-50 min-h-9"
              >
                <TableCell className="py-2 px-3 text-sm whitespace-nowrap">
                  {TYPE_LABELS[rm.type]}
                </TableCell>
                <TableCell className="py-2 px-3 text-sm truncate">{rm.nom}</TableCell>
                <TableCell className="py-2 px-3 text-sm truncate">
                  {rm.fournisseur}
                </TableCell>
                <TableCell className="py-2 px-3 text-sm font-mono whitespace-nowrap">
                  {rm.numeroLotFournisseur}
                </TableCell>
                <TableCell className="py-2 px-3 text-sm tabular-nums whitespace-nowrap text-right">
                  {rm.quantiteRestante} / {rm.quantiteRecue} kg
                </TableCell>
                <TableCell className="py-2 px-3 text-sm whitespace-nowrap">
                  <DlcBadge value={rm.dlc} />
                </TableCell>
                <TableCell className="py-2 px-3 text-sm whitespace-nowrap">
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium",
                      STATUT_CLASSES[statut],
                    )}
                  >
                    {STATUT_LABELS[statut]}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

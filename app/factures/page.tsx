"use client";

import * as React from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { useTraceabilityStore } from "@/lib/store";
import { EmptyState } from "@/components/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/raw-materials";
import { isFactureEnRetard, STATUT_PAIEMENT_LABELS, STATUT_PAIEMENT_CLASSES, CLASSE_EN_RETARD } from "@/lib/factures";
import type { Facture } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function FacturesPage() {
  const factures = useTraceabilityStore((s) => s.factures);
  const customers = useTraceabilityStore((s) => s.customers);
  const settings = useTraceabilityStore((s) => s.settings);
  const hasHydrated = useTraceabilityStore((s) => s.hasHydrated);

  if (!hasHydrated) {
    return <div className="h-9" />;
  }

  const today = new Date();
  function paiementRank(f: Facture): number {
    if (isFactureEnRetard(f, settings, today)) return 0;
    if (f.paiement.statut === "en_attente") return 1;
    return 2;
  }
  const sorted = [...factures].sort((a, b) => paiementRank(a) - paiementRank(b));

  if (sorted.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        heading="Aucune facture"
        body="Les factures sont générées automatiquement lors des livraisons."
      />
    );
  }

  return (
    <div className="rounded-md border bg-background overflow-x-auto overflow-hidden">
      <Table>
        <colgroup>
          <col style={{ width: "13%" }} />
          <col style={{ width: "18%" }} />
          <col style={{ width: "10%" }} />
          <col style={{ width: "7%" }} />
          <col style={{ width: "11%" }} />
          <col style={{ width: "10%" }} />
          <col style={{ width: "11%" }} />
          <col style={{ width: "11%" }} />
          <col style={{ width: "9%" }} />
        </colgroup>
        <TableHeader className="bg-zinc-50">
          <TableRow>
            <TableHead className="text-sm font-medium text-muted-foreground py-3 px-3 border-b border-border">
              N° facture
            </TableHead>
            <TableHead className="text-sm font-medium text-muted-foreground py-3 px-3 border-b border-border">
              Client
            </TableHead>
            <TableHead className="text-sm font-medium text-muted-foreground py-3 px-3 border-b border-border">
              Date
            </TableHead>
            <TableHead className="text-sm font-medium text-muted-foreground py-3 px-3 border-b border-border text-right">
              Nb broches
            </TableHead>
            <TableHead className="text-sm font-medium text-muted-foreground py-3 px-3 border-b border-border text-right">
              Total HT (CHF)
            </TableHead>
            <TableHead className="text-sm font-medium text-muted-foreground py-3 px-3 border-b border-border text-right">
              TVA (CHF)
            </TableHead>
            <TableHead className="text-sm font-medium text-muted-foreground py-3 px-3 border-b border-border text-right">
              Total TTC (CHF)
            </TableHead>
            <TableHead className="text-sm font-medium text-muted-foreground py-3 px-3 border-b border-border">
              Statut paiement
            </TableHead>
            <TableHead className="text-sm font-medium text-muted-foreground py-3 px-3 border-b border-border">
              Date paiement
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((f) => {
            const client = customers.find((c) => c.id === f.clientId);
            const tvaAmount = f.totalHT * f.tva;
            return (
              <TableRow
                key={f.id}
                className="border-b border-border hover:bg-zinc-50"
              >
                <TableCell className="py-2 px-3 text-sm">
                  <Link
                    href={`/factures/${f.id}`}
                    className="font-mono text-xs text-blue-600 hover:underline"
                  >
                    {f.numeroFacture}
                  </Link>
                </TableCell>
                <TableCell className="py-2 px-3 text-sm truncate max-w-0">
                  {client?.nom ?? "—"}
                </TableCell>
                <TableCell className="py-2 px-3 text-sm whitespace-nowrap">
                  {formatDate(f.dateFacture)}
                </TableCell>
                <TableCell className="py-2 px-3 text-sm text-right tabular-nums">
                  {f.lignes.length}
                </TableCell>
                <TableCell className="py-2 px-3 text-sm text-right tabular-nums">
                  {f.totalHT.toFixed(2)} CHF
                </TableCell>
                <TableCell className="py-2 px-3 text-sm text-right tabular-nums">
                  {tvaAmount.toFixed(2)} CHF
                </TableCell>
                <TableCell className="py-2 px-3 text-sm text-right tabular-nums font-medium">
                  {f.totalTTC.toFixed(2)} CHF
                </TableCell>
                <TableCell className="py-2 px-3 text-sm">
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium",
                      STATUT_PAIEMENT_CLASSES[f.paiement.statut],
                    )}
                  >
                    {STATUT_PAIEMENT_LABELS[f.paiement.statut]}
                  </span>
                  {isFactureEnRetard(f, settings, today) && (
                    <span
                      className={cn(
                        "ml-1 inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium",
                        CLASSE_EN_RETARD,
                      )}
                    >
                      En retard
                    </span>
                  )}
                </TableCell>
                <TableCell className="py-2 px-3 text-sm whitespace-nowrap">
                  {f.paiement?.datePaiement ? formatDate(f.paiement.datePaiement) : "—"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

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

export default function FacturesPage() {
  const factures = useTraceabilityStore((s) => s.factures);
  const customers = useTraceabilityStore((s) => s.customers);
  const hasHydrated = useTraceabilityStore((s) => s.hasHydrated);

  if (!hasHydrated) {
    return <div className="h-9" />;
  }

  const sorted = [...factures].reverse();

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
    <div className="rounded-md border bg-background overflow-hidden">
      <Table>
        <colgroup>
          <col style={{ width: "16%" }} />
          <col style={{ width: "24%" }} />
          <col style={{ width: "12%" }} />
          <col style={{ width: "10%" }} />
          <col style={{ width: "13%" }} />
          <col style={{ width: "12%" }} />
          <col style={{ width: "13%" }} />
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
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

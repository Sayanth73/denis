"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useReactToPrint } from "react-to-print";
import { FileText } from "lucide-react";
import { useTraceabilityStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/raw-materials";

export default function FactureDetailPage() {
  const { id } = useParams<{ id: string }>();
  const factures = useTraceabilityStore((s) => s.factures);
  const customers = useTraceabilityStore((s) => s.customers);
  const hasHydrated = useTraceabilityStore((s) => s.hasHydrated);

  const printableRef = React.useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printableRef,
    documentTitle: `Facture-${id}`,
  });

  if (!hasHydrated) {
    return <div className="h-9" />;
  }

  const facture = factures.find((f) => f.id === id);
  if (!facture) {
    return (
      <p className="text-sm text-muted-foreground">Facture introuvable.</p>
    );
  }

  const client = customers.find((c) => c.id === facture.clientId);
  const tvaAmount = facture.totalHT * facture.tva;

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold font-mono">{facture.numeroFacture}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Date : {formatDate(facture.dateFacture)}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <FileText size={14} className="mr-1.5" aria-hidden="true" />
          Imprimer / PDF
        </Button>
      </div>

      {/* Printable region */}
      <div ref={printableRef} className="print-target space-y-6">

        {/* Client block */}
        <div className="rounded-md border bg-background p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
            Client
          </p>
          <p className="font-medium">{client?.nom ?? "—"}</p>
          {client?.adresse && (
            <p className="text-sm text-muted-foreground mt-0.5">{client.adresse}</p>
          )}
          {client?.telephone && (
            <p className="text-sm text-muted-foreground">{client.telephone}</p>
          )}
        </div>

        {/* Lignes table */}
        <div className="rounded-md border bg-background overflow-hidden">
          <Table>
            <colgroup>
              <col style={{ width: "22%" }} />
              <col style={{ width: "30%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "18%" }} />
            </colgroup>
            <TableHeader className="bg-zinc-50">
              <TableRow>
                <TableHead className="text-xs font-medium text-muted-foreground py-2 px-3 border-b border-border">
                  N° lot
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground py-2 px-3 border-b border-border">
                  Recette
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground py-2 px-3 border-b border-border text-right">
                  Poids (kg)
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground py-2 px-3 border-b border-border text-right">
                  Prix unit. HT
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground py-2 px-3 border-b border-border text-right">
                  Montant HT
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facture.lignes.map((ligne) => (
                <TableRow
                  key={ligne.brocheId}
                  className="border-b border-border last:border-b-0"
                >
                  <TableCell className="py-2 px-3 text-sm">
                    <span className="font-mono text-xs">{ligne.numeroLot}</span>
                  </TableCell>
                  <TableCell className="py-2 px-3 text-sm">{ligne.recetteNom}</TableCell>
                  <TableCell className="py-2 px-3 text-sm text-right tabular-nums">
                    {ligne.poidsKg.toFixed(2)}
                  </TableCell>
                  <TableCell className="py-2 px-3 text-sm text-right tabular-nums">
                    {ligne.prixUnitaireHT.toFixed(2)} CHF
                  </TableCell>
                  <TableCell className="py-2 px-3 text-sm text-right tabular-nums">
                    {ligne.montantHT.toFixed(2)} CHF
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Totals footer */}
        <div className="flex justify-end">
          <div className="rounded-md border bg-background p-4 w-72 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total HT</span>
              <span className="tabular-nums">{facture.totalHT.toFixed(2)} CHF</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">TVA 8.1 %</span>
              <span className="tabular-nums">{tvaAmount.toFixed(2)} CHF</span>
            </div>
            <div className="flex justify-between font-semibold border-t border-border pt-1.5 mt-1.5">
              <span>Total TTC</span>
              <span className="tabular-nums">{facture.totalTTC.toFixed(2)} CHF</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

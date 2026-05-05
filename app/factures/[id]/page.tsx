"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useReactToPrint } from "react-to-print";
import { FileText } from "lucide-react";
import QRCode from "react-qr-code";
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
import { buildQrBillPayload, STATUT_PAIEMENT_LABELS, STATUT_PAIEMENT_CLASSES } from "@/lib/factures";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function FactureDetailPage() {
  const { id } = useParams<{ id: string }>();
  const factures = useTraceabilityStore((s) => s.factures);
  const customers = useTraceabilityStore((s) => s.customers);
  const settings = useTraceabilityStore((s) => s.settings);
  const updateFacture = useTraceabilityStore((s) => s.updateFacture);
  const hasHydrated = useTraceabilityStore((s) => s.hasHydrated);

  const printableRef = React.useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printableRef,
    documentTitle: `Facture`,
  });

  if (!hasHydrated) return <div className="h-9" />;

  const facture = factures.find((f) => f.id === id);
  if (!facture) {
    return <p className="text-sm text-muted-foreground">Facture introuvable.</p>;
  }

  const f = facture; // capture narrowed type after null guard
  const client = customers.find((c) => c.id === f.clientId);
  const tvaAmount = f.totalHT * f.tva;
  const echeanceDate = new Date(f.dateFacture);
  echeanceDate.setDate(echeanceDate.getDate() + settings.delaiPaiementJours);
  const echeancePaiement = echeanceDate.toISOString().slice(0, 10);

  function handlePayerLivraison() {
    if (f.paiement.statut !== "en_attente") return;
    updateFacture(f.id, {
      paiement: { statut: "payee_livraison", datePaiement: new Date().toISOString().slice(0, 10) },
    });
    toast.success(`Facture ${f.numeroFacture} marquée comme payée`);
  }

  function handleVirementRecu() {
    if (f.paiement.statut !== "en_attente") return;
    updateFacture(f.id, {
      paiement: { statut: "payee_virement", datePaiement: new Date().toISOString().slice(0, 10) },
    });
    toast.success(`Facture ${f.numeroFacture} marquée comme payée`);
  }

  const qrPayload = buildQrBillPayload(
    settings.iban,
    settings.nomCreancier,
    settings.adresseLigne1,
    settings.adresseLigne2,
    f.totalTTC,
  );

  return (
    <div>
      {/* Screen: top action bar */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div>
          <h2 className="text-lg font-semibold font-mono">{f.numeroFacture}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Date : {formatDate(f.dateFacture)}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <FileText size={14} className="mr-1.5" aria-hidden="true" />
          Exporter PDF
        </Button>
      </div>

      {/* Printable region */}
      <div ref={printableRef} className="print-target space-y-6">

        {/* Print header — company + facture info */}
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold text-base">{settings.nomCreancier || "TraceKebab Sàrl"}</p>
            {settings.adresseLigne1 && (
              <p className="text-sm text-muted-foreground">{settings.adresseLigne1}</p>
            )}
            {settings.adresseLigne2 && (
              <p className="text-sm text-muted-foreground">{settings.adresseLigne2}</p>
            )}
          </div>
          <div className="text-right">
            <p className="font-mono font-semibold text-base">{f.numeroFacture}</p>
            <p className="text-sm text-muted-foreground">
              Date : {formatDate(f.dateFacture)}
            </p>
          </div>
        </div>

        {/* Client block */}
        <div className="rounded-md border bg-background p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase mb-2 tracking-wide">
            Facturé à
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
              {f.lignes.map((ligne) => (
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
              <span className="tabular-nums">{f.totalHT.toFixed(2)} CHF</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">TVA 8.1 %</span>
              <span className="tabular-nums">{tvaAmount.toFixed(2)} CHF</span>
            </div>
            <div className="flex justify-between font-semibold border-t border-border pt-1.5 mt-1.5">
              <span>Total TTC</span>
              <span className="tabular-nums">{f.totalTTC.toFixed(2)} CHF</span>
            </div>
            <div className="flex justify-between border-t border-border pt-1.5 mt-1.5 text-muted-foreground">
              <span>Échéance</span>
              <span>{formatDate(echeancePaiement)}</span>
            </div>
          </div>
        </div>

        {/* Section paiement — boutons masqués à l'impression */}
        <div className="print:hidden rounded-md border bg-background p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase mb-3 tracking-wide">
            Paiement
          </p>
          {f.paiement.statut === "en_attente" ? (
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                onClick={handlePayerLivraison}
              >
                Payé à la livraison
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
                onClick={handleVirementRecu}
              >
                Virement reçu
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium",
                  STATUT_PAIEMENT_CLASSES[f.paiement.statut],
                )}
              >
                {STATUT_PAIEMENT_LABELS[f.paiement.statut]}
              </span>
              {f.paiement.datePaiement && (
                <span className="text-sm text-muted-foreground">
                  le {formatDate(f.paiement.datePaiement)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* QR-bill section — affiché seulement si IBAN configuré */}
        {qrPayload && (
          <div className="border-t-2 border-dashed border-border pt-4 mt-6">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Section paiement
            </p>
            <div className="flex gap-6 items-start">
              {/* QR code */}
              <div className="shrink-0 p-2 border border-border rounded bg-white">
                <QRCode value={qrPayload} size={130} />
              </div>

              {/* Payment details */}
              <div className="text-sm space-y-3 min-w-0">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-0.5">
                    Compte / Payable à
                  </p>
                  <p className="font-mono text-xs break-all">{settings.iban}</p>
                  <p className="font-medium mt-0.5">{settings.nomCreancier}</p>
                  {settings.adresseLigne1 && (
                    <p className="text-muted-foreground">{settings.adresseLigne1}</p>
                  )}
                  {settings.adresseLigne2 && (
                    <p className="text-muted-foreground">{settings.adresseLigne2}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-0.5">
                    Montant
                  </p>
                  <p className="font-semibold tabular-nums">
                    {f.totalTTC.toFixed(2)} CHF
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Placeholder quand IBAN non configuré */}
        {!qrPayload && (
          <div className="border-t border-dashed border-border pt-4 mt-6">
            <p className="text-xs text-muted-foreground">
              Configurez votre IBAN dans{" "}
              <span className="font-medium">Paramètres</span> pour afficher le QR-bill de paiement.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

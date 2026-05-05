"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  STATUT_LIVRAISON_CLASSES,
  STATUT_LIVRAISON_LABELS,
  formatDeliveryRow,
  getCustomerById,
} from "@/lib/deliveries";
import { useTraceabilityStore } from "@/lib/store";
import { buildFacture } from "@/lib/facture-builder";
import type { Delivery, FinishedProduct, Customer } from "@/lib/types";

type DeliveriesTableProps = {
  deliveries: Delivery[];
  finishedProducts: FinishedProduct[];
  customers: Customer[];
};

export function DeliveriesTable({
  deliveries,
  finishedProducts,
  customers,
}: DeliveriesTableProps) {
  const [pendingDeliveryId, setPendingDeliveryId] = React.useState<string | null>(null);

  const rows = React.useMemo(
    () =>
      [...deliveries]
        .reverse()
        .map((d) => formatDeliveryRow(d, finishedProducts, customers)),
    [deliveries, finishedProducts, customers],
  );

  const pendingDelivery = deliveries.find((d) => d.id === pendingDeliveryId);
  const pendingCustomerName = pendingDelivery
    ? (getCustomerById(pendingDelivery.customerId, customers)?.nom ?? "")
    : "";

  function handleConfirmLivree() {
    if (!pendingDelivery) return;
    const store = useTraceabilityStore.getState();
    const N = pendingDelivery.brochesLivrees.length;

    for (const fpId of pendingDelivery.brochesLivrees) {
      store.updateFinishedProduct(fpId, {
        statut: "livree",
        livraisonId: pendingDelivery.id,
      });
    }
    store.updateDelivery(pendingDelivery.id, { statut: "livree" });

    // Auto-generate facture via buildFacture (resolves per-client pricing)
    const { finishedProducts, productionOrders, recipes, factures, customers } = store;
    const customer = customers.find((c) => c.id === pendingDelivery.customerId)!;
    const facture = buildFacture(
      pendingDelivery.id,
      pendingDelivery.customerId,
      pendingDelivery.brochesLivrees,
      finishedProducts,
      productionOrders,
      recipes,
      customer,
      factures.length,
    );
    store.addFacture(facture);
    const numeroFacture = facture.numeroFacture;

    toast.success(`Livraison confirmée — Facture ${numeroFacture} générée`);
    setPendingDeliveryId(null);
  }

  return (
    <>
      <div className="rounded-md border bg-background overflow-hidden">
        <Table>
          <colgroup>
            <col style={{ width: "13%" }} />
            <col style={{ width: "24%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "24%" }} />
          </colgroup>
          <TableHeader className="bg-zinc-50">
            <TableRow>
              <TableHead className="text-sm font-medium text-muted-foreground py-3 px-3 border-b border-border">
                Date
              </TableHead>
              <TableHead className="text-sm font-medium text-muted-foreground py-3 px-3 border-b border-border">
                Client
              </TableHead>
              <TableHead className="text-sm font-medium text-muted-foreground py-3 px-3 border-b border-border text-right">
                Nb broches
              </TableHead>
              <TableHead className="text-sm font-medium text-muted-foreground py-3 px-3 border-b border-border text-right">
                Poids total
              </TableHead>
              <TableHead className="text-sm font-medium text-muted-foreground py-3 px-3 border-b border-border">
                Statut
              </TableHead>
              <TableHead className="text-sm font-medium text-muted-foreground py-3 px-3 border-b border-border" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.id}
                className="border-b border-border hover:bg-zinc-50"
              >
                <TableCell className="py-2 px-3 text-sm whitespace-nowrap">
                  {row.dateFormatted}
                </TableCell>
                <TableCell className="py-2 px-3 text-sm truncate max-w-0">
                  {row.clientName}
                </TableCell>
                <TableCell className="py-2 px-3 text-sm tabular-nums text-right whitespace-nowrap">
                  {row.nombreBroches}
                </TableCell>
                <TableCell className="py-2 px-3 text-sm tabular-nums text-right whitespace-nowrap">
                  {row.poidsTotal} kg
                </TableCell>
                <TableCell className="py-2 px-3">
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium",
                      STATUT_LIVRAISON_CLASSES[row.statut],
                    )}
                  >
                    {STATUT_LIVRAISON_LABELS[row.statut]}
                  </span>
                </TableCell>
                <TableCell className="py-2 px-3 text-right">
                  {row.statut === "preparee" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPendingDeliveryId(row.id)}
                      className="gap-1.5"
                    >
                      <CheckCircle2 size={14} aria-hidden="true" />
                      Marquer comme livrée
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={pendingDeliveryId !== null}
        onOpenChange={(open) => { if (!open) setPendingDeliveryId(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la livraison</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p>
                  Confirmez-vous la livraison de{" "}
                  {pendingDelivery?.brochesLivrees.length ?? 0} broche(s) à{" "}
                  {pendingCustomerName} ?
                </p>
                <p className="mt-1">
                  Cette action est irréversible. Les broches seront marquées comme
                  livrées.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmLivree}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

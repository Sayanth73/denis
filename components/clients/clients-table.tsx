"use client";

import * as React from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
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
import { useTraceabilityStore } from "@/lib/store";
import type { Customer } from "@/lib/types";

type ClientsTableProps = {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
};

export function ClientsTable({ customers, onEdit }: ClientsTableProps): JSX.Element {
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null);

  const pendingCustomer = customers.find((c) => c.id === pendingDeleteId);

  function handleDelete() {
    if (!pendingDeleteId) return;
    const nom = customers.find((c) => c.id === pendingDeleteId)?.nom ?? "";
    useTraceabilityStore.getState().deleteCustomer(pendingDeleteId);
    toast.success(`Client supprimé — ${nom}`);
    setPendingDeleteId(null);
  }

  return (
    <>
      <div className="rounded-md border bg-background overflow-hidden">
        <Table>
          <colgroup>
            <col style={{ width: "22%" }} />
            <col style={{ width: "28%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "12%" }} />
          </colgroup>
          <TableHeader className="bg-zinc-50">
            <TableRow>
              <TableHead className="text-sm font-medium text-muted-foreground py-3 px-3 border-b border-border">
                Nom
              </TableHead>
              <TableHead className="text-sm font-medium text-muted-foreground py-3 px-3 border-b border-border">
                Adresse
              </TableHead>
              <TableHead className="text-sm font-medium text-muted-foreground py-3 px-3 border-b border-border">
                Téléphone
              </TableHead>
              <TableHead className="text-sm font-medium text-muted-foreground py-3 px-3 border-b border-border">
                Email
              </TableHead>
              <TableHead className="text-sm font-medium text-muted-foreground py-3 px-3 border-b border-border" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow
                key={customer.id}
                className="border-b border-border hover:bg-zinc-50"
              >
                <TableCell className="py-2 px-3 text-sm">
                  <Link
                    href={`/clients/${customer.id}`}
                    className="hover:underline font-medium"
                  >
                    {customer.nom}
                  </Link>
                </TableCell>
                <TableCell className="py-2 px-3 text-sm truncate max-w-0">
                  {customer.adresse}
                </TableCell>
                <TableCell className="py-2 px-3 text-sm">
                  {customer.telephone}
                </TableCell>
                <TableCell className="py-2 px-3 text-sm text-muted-foreground truncate max-w-0">
                  {customer.email ? customer.email : "—"}
                </TableCell>
                <TableCell className="py-2 px-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      aria-label="Modifier"
                      onClick={() => onEdit(customer)}
                    >
                      <Pencil size={14} aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      aria-label="Supprimer"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setPendingDeleteId(customer.id)}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le client</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p>
                  Êtes-vous sûr de vouloir supprimer {pendingCustomer?.nom} ?
                </p>
                <p className="mt-1">Cette action est irréversible.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

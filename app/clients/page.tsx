"use client";

import * as React from "react";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { ClientsTable } from "@/components/clients/clients-table";
import { ClientDialog } from "@/components/clients/client-dialog";
import { useTraceabilityStore } from "@/lib/store";
import type { Customer } from "@/lib/types";

export default function ClientsPage() {
  const customers = useTraceabilityStore((s) => s.customers);
  const hasHydrated = useTraceabilityStore((s) => s.hasHydrated);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogMode, setDialogMode] = React.useState<"create" | "edit">("create");
  const [editTarget, setEditTarget] = React.useState<Customer | undefined>(undefined);

  if (!hasHydrated) {
    return (
      <div className="flex items-center justify-between mb-6 h-9">
        <div />
        <Button disabled className="gap-2">
          <Plus size={16} aria-hidden="true" />
          <span>+ Nouveau client</span>
        </Button>
      </div>
    );
  }

  const isEmpty = customers.length === 0;

  function openCreate() {
    setDialogMode("create");
    setEditTarget(undefined);
    setDialogOpen(true);
  }

  function openEdit(customer: Customer) {
    setDialogMode("edit");
    setEditTarget(customer);
    setDialogOpen(true);
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6 h-9">
        <div />
        <Button onClick={openCreate} className="gap-2">
          <Plus size={16} aria-hidden="true" />
          <span>+ Nouveau client</span>
        </Button>
      </div>

      {isEmpty ? (
        <EmptyState
          icon={Users}
          heading="Aucun client enregistré"
          body="Ajoutez votre premier client restaurant."
          cta={{ label: "+ Nouveau client", onClick: openCreate, icon: Plus }}
        />
      ) : (
        <ClientsTable customers={customers} onEdit={openEdit} />
      )}

      <ClientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        client={editTarget}
      />
    </>
  );
}

"use client";

import * as React from "react";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";
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

type StoreSnapshot = {
  rawMaterials: unknown;
  recipes: unknown;
  productionOrders: unknown;
  finishedProducts: unknown;
  customers: unknown;
  deliveries: unknown;
  factures: unknown;
  settings: unknown;
};

function isValidSnapshot(obj: unknown): obj is StoreSnapshot {
  if (typeof obj !== "object" || obj === null) return false;
  const keys: (keyof StoreSnapshot)[] = [
    "rawMaterials", "recipes", "productionOrders", "finishedProducts",
    "customers", "deliveries", "factures", "settings",
  ];
  return keys.every((k) => k in (obj as Record<string, unknown>));
}

export function BackupSection() {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = React.useState<StoreSnapshot | null>(null);

  function handleExport() {
    const s = useTraceabilityStore.getState();
    const snapshot: StoreSnapshot = {
      rawMaterials: s.rawMaterials,
      recipes: s.recipes,
      productionOrders: s.productionOrders,
      finishedProducts: s.finishedProducts,
      customers: s.customers,
      deliveries: s.deliveries,
      factures: s.factures,
      settings: s.settings,
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tracekebab-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Sauvegarde téléchargée");
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (!isValidSnapshot(parsed)) {
          toast.error("Fichier invalide — structure de données non reconnue.");
          return;
        }
        setPendingImport(parsed);
      } catch {
        toast.error("Fichier invalide — impossible de lire le JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function handleConfirmImport() {
    if (!pendingImport) return;
    useTraceabilityStore.setState({
      rawMaterials: pendingImport.rawMaterials as never,
      recipes: pendingImport.recipes as never,
      productionOrders: pendingImport.productionOrders as never,
      finishedProducts: pendingImport.finishedProducts as never,
      customers: pendingImport.customers as never,
      deliveries: pendingImport.deliveries as never,
      factures: pendingImport.factures as never,
      settings: pendingImport.settings as never,
    }, false);
    toast.success("Données restaurées");
    setPendingImport(null);
  }

  return (
    <>
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Sauvegarde et restauration</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Exportez toutes les données de l&apos;application en JSON ou restaurez une sauvegarde précédente.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button type="button" variant="outline" onClick={handleExport}>
            <Download size={14} className="mr-1.5" aria-hidden="true" />
            Exporter les données
          </Button>
          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload size={14} className="mr-1.5" aria-hidden="true" />
            Importer des données
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <AlertDialog
        open={pendingImport !== null}
        onOpenChange={(open) => { if (!open) setPendingImport(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurer une sauvegarde</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p>Toutes les données actuelles seront remplacées par celles du fichier importé.</p>
                <p className="mt-1">Cette action est irréversible.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmImport}
            >
              Restaurer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

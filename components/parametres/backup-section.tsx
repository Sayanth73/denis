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
import type { RawMaterial, Recipe, ProductionOrder, FinishedProduct, Customer, Delivery, Facture, AppSettings } from "@/lib/types";

type StoreSnapshot = {
  rawMaterials: RawMaterial[];
  recipes: Recipe[];
  productionOrders: ProductionOrder[];
  finishedProducts: FinishedProduct[];
  customers: Customer[];
  deliveries: Delivery[];
  factures: Facture[];
  settings: AppSettings;
};

function isValidSnapshot(obj: unknown): obj is StoreSnapshot {
  if (typeof obj !== "object" || obj === null) return false;
  const r = obj as Record<string, unknown>;
  const collectionKeys = [
    "rawMaterials", "recipes", "productionOrders", "finishedProducts",
    "customers", "deliveries", "factures",
  ] as const;
  return (
    collectionKeys.every((k) => Array.isArray(r[k])) &&
    typeof r.settings === "object" && r.settings !== null
  );
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
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
    toast.success("Sauvegarde téléchargée");
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Fichier trop volumineux (maximum 5 Mo).");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => toast.error("Impossible de lire le fichier.");
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
    try {
      useTraceabilityStore.setState({
        rawMaterials: pendingImport.rawMaterials,
        recipes: pendingImport.recipes,
        productionOrders: pendingImport.productionOrders,
        finishedProducts: pendingImport.finishedProducts,
        customers: pendingImport.customers,
        deliveries: pendingImport.deliveries,
        factures: pendingImport.factures,
        settings: pendingImport.settings,
      }, false);
      toast.success("Données restaurées");
    } catch {
      toast.error("Erreur lors de la restauration.");
    } finally {
      setPendingImport(null);
    }
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

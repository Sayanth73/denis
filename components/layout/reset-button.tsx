"use client";

import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useTraceabilityStore } from "@/lib/store";

export function ResetButton() {
  const handleReset = () => {
    useTraceabilityStore.getState().resetToSeed();
    toast.success("Données démo réinitialisées.");
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <RotateCcw size={16} aria-hidden="true" />
          <span>Réinitialiser démo</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Réinitialiser les données démo ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action efface l&apos;intégralité des données de démonstration et restaure le jeu de données initial. Cette opération est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: "destructive" })}
            onClick={handleReset}
          >
            Réinitialiser
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

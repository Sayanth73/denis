"use client";

import * as React from "react";
import { toast } from "sonner";
import { Edit2, Trash2, Plus } from "lucide-react";
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
import type { Recipe } from "@/lib/types";
import { TYPE_LABELS } from "@/lib/raw-materials";
import { RecipeDialog, type RecipeFormValues } from "./recette-dialog";

export function RecettesTab() {
  const recipes          = useTraceabilityStore((s) => s.recipes);
  const productionOrders = useTraceabilityStore((s) => s.productionOrders);
  const customers        = useTraceabilityStore((s) => s.customers);
  const addRecipe        = useTraceabilityStore((s) => s.addRecipe);
  const updateRecipe     = useTraceabilityStore((s) => s.updateRecipe);
  const deleteRecipe     = useTraceabilityStore((s) => s.deleteRecipe);
  const updateCustomer   = useTraceabilityStore((s) => s.updateCustomer);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editRecipe, setEditRecipe] = React.useState<Recipe | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null);

  function onSubmitCreate(values: RecipeFormValues) {
    addRecipe({
      id: crypto.randomUUID(),
      nom: values.nom.trim(),
      prixParDefautHT: parseFloat(values.prixParDefautHT),
      poidsTotal: 0,
      composition: [],
    });
    toast.success(`Recette créée — ${values.nom.trim()}`);
    setCreateOpen(false);
  }

  function onSubmitEdit(values: RecipeFormValues) {
    if (!editRecipe) return;
    updateRecipe(editRecipe.id, {
      nom: values.nom.trim(),
      prixParDefautHT: parseFloat(values.prixParDefautHT),
    });
    toast.success("Recette mise à jour");
    setEditRecipe(null);
  }

  function handleDeleteClick(id: string) {
    const isReferenced = productionOrders.some((o) => o.recipeId === id);
    if (isReferenced) {
      toast.error("Impossible de supprimer : cette recette est utilisée dans des ordres de fabrication.");
      return;
    }
    setPendingDeleteId(id);
  }

  function handleConfirmDelete() {
    if (!pendingDeleteId) return;
    customers
      .filter((c) => c.tarifs.some((t) => t.recetteId === pendingDeleteId))
      .forEach((c) =>
        updateCustomer(c.id, { tarifs: c.tarifs.filter((t) => t.recetteId !== pendingDeleteId) })
      );
    deleteRecipe(pendingDeleteId);
    toast.success("Recette supprimée");
    setPendingDeleteId(null);
  }

  const pendingRecipe = recipes.find((r) => r.id === pendingDeleteId) ?? null;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div />
        <Button variant="default" size="sm" onClick={() => setCreateOpen(true)}>
          <Plus size={14} className="mr-1.5" aria-hidden="true" />
          Nouvelle recette
        </Button>
      </div>

      {recipes.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Aucune recette.</p>
      ) : (
        <div className="space-y-4">
          {recipes.map((recipe) => (
            <div key={recipe.id} className="rounded-md border bg-background p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">{recipe.nom}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground tabular-nums">
                    {recipe.prixParDefautHT.toFixed(2)} CHF/kg HT
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      aria-label="Modifier"
                      onClick={() => setEditRecipe(recipe)}
                    >
                      <Edit2 size={14} aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      aria-label="Supprimer"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteClick(recipe.id)}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </div>
              {recipe.composition.length > 0 && (
                <>
                  <div className="border-t border-border my-3" />
                  <div className="space-y-1.5">
                    {recipe.composition.map((ing) => (
                      <div
                        key={ing.typeMatiere}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-foreground">
                          {TYPE_LABELS[ing.typeMatiere]}
                        </span>
                        <span className="text-sm text-muted-foreground tabular-nums">
                          {ing.pourcentage} %
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <RecipeDialog
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={onSubmitCreate}
      />

      <RecipeDialog
        mode="edit"
        open={editRecipe !== null}
        onOpenChange={(open) => { if (!open) setEditRecipe(null); }}
        recipe={editRecipe}
        onSubmit={onSubmitEdit}
      />

      <AlertDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => { if (!open) setPendingDeleteId(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la recette</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p>Êtes-vous sûr de vouloir supprimer « {pendingRecipe?.nom} » ?</p>
                <p className="mt-1">Cette action est irréversible.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmDelete}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Recipe } from "@/lib/types";

// Numeric field kept as string at form level (HTML inputs always return strings).
// Parsed to number in onSubmit — avoids z.coerce / z.transform resolver type conflicts.
export const recipeSchema = z.object({
  nom: z.string().min(1, "Le nom est requis."),
  prixParDefautHT: z
    .string()
    .min(1, "Le prix est requis.")
    .refine((v) => !Number.isNaN(parseFloat(v)), "Le prix doit être un nombre.")
    .refine((v) => parseFloat(v) > 0, "Le prix doit être un nombre positif."),
});
export type RecipeFormValues = z.infer<typeof recipeSchema>;

type RecipeDialogProps = {
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipe?: Recipe | null;
  onSubmit: (values: RecipeFormValues) => void;
};

export function RecipeDialog({ mode, open, onOpenChange, recipe, onSubmit }: RecipeDialogProps) {
  const form = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeSchema),
    defaultValues: { nom: "", prixParDefautHT: "" },
  });

  React.useEffect(() => {
    if (open) {
      if (mode === "edit" && recipe) {
        form.reset({ nom: recipe.nom, prixParDefautHT: String(recipe.prixParDefautHT) });
      } else {
        form.reset({ nom: "", prixParDefautHT: "" });
      }
    }
  }, [open, mode, recipe, form]);

  const isCreate = mode === "create";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isCreate ? "Nouvelle recette" : "Modifier la recette"}</DialogTitle>
          <DialogDescription>
            {isCreate
              ? "Renseignez le nom et le prix de la nouvelle recette."
              : "Mettez à jour le nom ou le prix de la recette."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de la recette</FormLabel>
                  <FormControl>
                    <Input placeholder="Nom de la recette" maxLength={120} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="prixParDefautHT"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prix par défaut (CHF/kg HT)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" variant="default">
                {isCreate ? "Créer" : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

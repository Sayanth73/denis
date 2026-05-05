"use client";

import type { Recipe } from "@/lib/types";
import { TYPE_LABELS } from "@/lib/raw-materials";

type RecettesTabProps = { recipes: Recipe[] };

export function RecettesTab({ recipes }: RecettesTabProps) {
  return (
    <div className="space-y-4">
      {recipes.map((recipe) => (
        <div key={recipe.id} className="rounded-md border bg-background p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">{recipe.nom}</span>
            <span className="text-sm text-muted-foreground tabular-nums">
              {recipe.poidsTotal} kg
            </span>
          </div>
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
        </div>
      ))}
    </div>
  );
}

---
phase: 17
status: PASS
---
# Phase 17 Validation

## Criteria Checks

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | "Nouvelle recette" button opens a dialog; submitting name + price adds recipe to store and makes it selectable in production wizard and tarif grids | PASS | `recettes-tab.tsx:84` — Button with `onClick={() => setCreateOpen(true)}`; `recettes-tab.tsx:35-45` — `onSubmitCreate` calls `addRecipe({id: crypto.randomUUID(), nom, prixParDefautHT, ...})`; `production-wizard.tsx:37,159` — wizard reads `useTraceabilityStore s.recipes` and maps all entries to `SelectItem`; `app/clients/[id]/page.tsx:61,83` — tarif grid iterates `recipes` from store, so new recipes appear automatically |
| 2 | Each recipe row has an "Éditer" action; saving name/price updates the store and shows a toast | PASS | `recettes-tab.tsx:103-111` — Edit2 button sets `editRecipe` state; `recettes-tab.tsx:47-55` — `onSubmitEdit` calls `updateRecipe(editRecipe.id, {nom, prixParDefautHT})` then `toast.success("Recette mise à jour")`; `lib/store.ts:122-125` — `updateRecipe` maps over `s.recipes` and merges patch |
| 3 | Deleting a recipe referenced by a production order shows a blocking message — no confirmation dialog, no deletion | PASS | `recettes-tab.tsx:57-64` — `handleDeleteClick` checks `productionOrders.some(o => o.recipeId === id)`; if true calls `toast.error("Impossible de supprimer...")` and returns early without calling `setPendingDeleteId`, so no AlertDialog opens and no deletion occurs |
| 4 | Deleting an unreferenced recipe opens an AlertDialog; cancelling leaves it untouched; confirming removes it from store and all tarif grids | PASS | `recettes-tab.tsx:63` — unreferenced path calls `setPendingDeleteId(id)`; `recettes-tab.tsx:165-189` — AlertDialog renders when `pendingDeleteId !== null` with `AlertDialogCancel` (sets pendingDeleteId to null, no deletion) and `AlertDialogAction` calling `handleConfirmDelete`; `recettes-tab.tsx:66-76` — `handleConfirmDelete` filters customer tarifs via `updateCustomer` for each affected customer, then calls `deleteRecipe(pendingDeleteId)`; `lib/store.ts:126-127` — `deleteRecipe` filters the recipe out of `s.recipes` |

## Verdict

PASS

All four success criteria are fully implemented and wired in the codebase.

Commits 6c85941 and 0791384 exist and match the expected changes (RecettesTab rewrite and stale prop removal).

The create/edit flows use `RecipeDialog` (recette-dialog.tsx) with Zod validation for name and price, and dispatch to the Zustand store actions `addRecipe` / `updateRecipe`. The delete guard correctly distinguishes referenced vs. unreferenced recipes: referenced ones receive only a `toast.error` with an immediate return; unreferenced ones open an `AlertDialog` whose confirm handler removes tarif rows from all affected customers via `updateCustomer` before calling `deleteRecipe`. The production wizard and tarif grids both read `recipes` from the store reactively, so newly created recipes appear in both without any additional wiring.

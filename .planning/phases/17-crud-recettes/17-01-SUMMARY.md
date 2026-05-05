---
phase: 17-crud-recettes
plan: "01"
subsystem: production-recettes
tags:
  - crud
  - react-hook-form
  - zod
  - zustand
  - alertdialog
dependency_graph:
  requires:
    - lib/store.ts (addRecipe, updateRecipe, deleteRecipe, updateCustomer)
    - lib/types.ts (Recipe, Customer, ProductionOrder)
    - components/ui/dialog
    - components/ui/alert-dialog
    - components/ui/form
  provides:
    - Full CRUD lifecycle for recipes (create, edit, delete with guard)
    - recette-dialog.tsx (shared create/edit dialog component)
  affects:
    - app/production/page.tsx (RecettesTab no longer receives recipes prop)
    - customer tarifs (cascade-cleaned on recipe deletion)
tech_stack:
  added: []
  patterns:
    - react-hook-form with zodResolver (string fields, parseFloat in onSubmit)
    - pendingDeleteId AlertDialog pattern (from clients-table)
    - granular useTraceabilityStore selectors (no prop drilling)
    - file extraction to stay under 300-line cap
key_files:
  created:
    - components/production/recette-dialog.tsx
  modified:
    - components/production/recettes-tab.tsx
    - app/production/page.tsx
decisions:
  - "DEC-17-01-string-field-parse: prixParDefautHT kept as z.string() at form level with parseFloat in onSubmit — avoids z.coerce/z.preprocess resolver type conflicts with react-hook-form (same pattern as reception-dialog.tsx)"
  - "DEC-17-02-dialog-extraction: Create/edit dialogs extracted to recette-dialog.tsx (117 lines) to keep recettes-tab.tsx under 300-line cap (188 lines)"
metrics:
  duration: "~10m"
  completed: "2026-05-05"
  tasks_completed: 2
  files_changed: 3
---

# Phase 17 Plan 01: CRUD Recettes Summary

**One-liner:** Self-contained recipe CRUD — create/edit dialogs with react-hook-form + zod, delete guard against production orders, AlertDialog confirmation with customer tarif cascade cleanup.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Rewrite recettes-tab.tsx as self-contained CRUD component | 6c85941 | components/production/recettes-tab.tsx, components/production/recette-dialog.tsx |
| 2 | Update host page — remove stale recipes prop from RecettesTab call | 0791384 | app/production/page.tsx |

## What Was Built

- **RecettesTab** (188 lines): Fully self-contained CRUD tab. Reads all state via 8 granular `useTraceabilityStore` selectors. Provides "Nouvelle recette" CTA in header row. Per-card Edit2 and Trash2 icon buttons. Delete guard checks `productionOrders.some(o => o.recipeId === id)` — blocked path shows error toast with no dialog; allowed path opens AlertDialog. Cascade removes recipe from all customer `tarifs` arrays before calling `deleteRecipe`.

- **RecipeDialog** (117 lines): Extracted create/edit dialog. Single component handles both modes via `mode="create"|"edit"` prop. Pre-fills form from `recipe` prop when mode is edit. Uses `useEffect` reset on open (same pattern as `client-dialog.tsx`).

- **app/production/page.tsx** (1-line change): `<RecettesTab recipes={recipes} />` → `<RecettesTab />`. The `recipes` selector is retained for `<OrdreFabricationTable>`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] z.coerce.number() and z.preprocess() resolver type conflicts**
- **Found during:** Task 1 TypeScript check
- **Issue:** Both `z.coerce.number()` and `z.preprocess()` infer `unknown` as the input type, causing `Resolver<{..., prixParDefautHT: unknown}>` vs `Resolver<{..., prixParDefautHT: number}>` incompatibility with react-hook-form's zodResolver
- **Fix:** Used `z.string()` with `.refine()` validation and `parseFloat()` in the submit handler — same pattern as `reception-dialog.tsx` (which has an inline comment documenting this exact issue)
- **Files modified:** components/production/recettes-tab.tsx, components/production/recette-dialog.tsx
- **Commit:** 6c85941

**2. [Rule 2 - File size cap] Extracted dialogs to recette-dialog.tsx**
- **Found during:** Task 1 line count check — inline implementation was 321 lines (over 300-line cap DEC-file-size-cap)
- **Fix:** Extracted create/edit dialog into `components/production/recette-dialog.tsx` as planned in the action block ("if the implementation approaches 280+ lines, extract...")
- **Result:** recettes-tab.tsx = 188 lines, recette-dialog.tsx = 117 lines
- **Commit:** 6c85941

## Known Stubs

None. All CRUD operations are wired to the live Zustand store. Empty state renders "Aucune recette." when `recipes.length === 0`.

## Threat Flags

No new network endpoints, auth paths, file access patterns, or schema changes introduced. T-17-01 (form input validation) is mitigated: `nom` validated with `z.string().min(1)`, `prixParDefautHT` validated with positive number check before store write.

## Self-Check: PASSED

- [x] components/production/recettes-tab.tsx exists (188 lines)
- [x] components/production/recette-dialog.tsx exists (117 lines)
- [x] app/production/page.tsx modified (1-line change)
- [x] Commit 6c85941 exists
- [x] Commit 0791384 exists
- [x] npx tsc --noEmit exits with zero errors
- [x] All acceptance criteria verified

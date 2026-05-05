---
phase: 10
plan: "01"
title: "Surface recipe name wherever broches appear"
one_liner: "Pure getRecipeForBroche helper wired into delivery dialog, client broches table, and tracabilite upstream Section 3"
completed: "2026-05-05"
duration_minutes: 15
tasks_completed: 4
files_created: 1
files_modified: 4
key_decisions:
  - "getRecipeForBroche placed in lib/finished-products.ts (not lib/tracabilite.ts) to keep domain separation: tracabilite.ts handles tracing flows, finished-products.ts handles FinishedProduct helpers"
  - "BrochesExpansion colgroup updated to 5 cols (30/25/15/18/12%) to accommodate Recette column without crowding lot link"
  - "Recipe name rendered null-safe everywhere (recipe && ... or recipe?.nom ?? '—') — no crash if productionOrder or recipe seed data gaps"
requirements_addressed:
  - REQ-v2-broche-recipe-display
---

# Phase 10 Plan 01: Surface Recipe Name Wherever Broches Appear — Summary

Pure `getRecipeForBroche` helper wired into delivery dialog, client broches table, and tracabilite upstream Section 3.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| T1 | Create lib/finished-products.ts | 513f26b | lib/finished-products.ts (created) |
| T2 | Show recipe name in delivery dialog | 03da171 | components/livraisons/new-delivery-dialog.tsx |
| T3 | Add Recette column to BrochesExpansion | 73554f5 | components/clients/broches-expansion.tsx, app/clients/[id]/page.tsx |
| T4 | Show recipe name in TracabiliteUpstream Section 3 | 0d50bba | components/tracabilite/tracabilite-upstream.tsx |

## Key Files

### Created
- `/Users/sayanth/Desktop/viande/lib/finished-products.ts` — exports `getRecipeForBroche(broche, productionOrders, recipes): Recipe | null`

### Modified
- `components/livraisons/new-delivery-dialog.tsx` — adds productionOrders + recipes store reads; renders recipe name between lot number and weight in broche checkbox rows
- `components/clients/broches-expansion.tsx` — adds Recipe to props/types, 5-column colgroup, Recette TableHead, recipe cell per broche row, colSpan 4→5 on RM expansion row
- `app/clients/[id]/page.tsx` — pulls recipes from store, passes recipes={recipes} to BrochesExpansion
- `components/tracabilite/tracabilite-upstream.tsx` — imports getRecipeForBroche, renders lot + recipe name per broche in Section 3 Lots livrés cell

## Verification

- `npx tsc --noEmit` — passed with zero errors
- All acceptance criteria greps confirmed per task

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- lib/finished-products.ts: FOUND
- components/livraisons/new-delivery-dialog.tsx: FOUND (modified)
- components/clients/broches-expansion.tsx: FOUND (modified)
- app/clients/[id]/page.tsx: FOUND (modified)
- components/tracabilite/tracabilite-upstream.tsx: FOUND (modified)
- Commits 513f26b, 03da171, 73554f5, 0d50bba: all present in git log

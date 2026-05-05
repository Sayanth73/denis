---
phase: 14
plan: "01"
subsystem: data-layer-tarification
tags: [types, store, migration, pricing, factures]
dependency_graph:
  requires: []
  provides: [Recipe.prixParDefautHT, Customer.tarifs, buildFacture-dynamic-pricing, store-v4]
  affects: [lib/types.ts, lib/store.ts, lib/facture-builder.ts, lib/seed.ts, components/livraisons/deliveries-table.tsx, components/clients/client-dialog.tsx]
tech_stack:
  added: []
  patterns: [zustand-migration, price-resolution-chain]
key_files:
  created: []
  modified:
    - lib/types.ts
    - lib/store.ts
    - lib/facture-builder.ts
    - lib/seed.ts
    - components/livraisons/deliveries-table.tsx
    - components/clients/client-dialog.tsx
decisions:
  - Price resolution chain: client tarif override → recipe prixParDefautHT → 25 CHF/kg fallback
  - Store bumped to v4; v3→v4 migration backfills prixParDefautHT and tarifs without data loss
  - deliveries-table now delegates to buildFacture, removing inline duplicated price logic
metrics:
  duration: ~8m
  completed: "2026-05-05"
  tasks_completed: 5
  files_modified: 6
---

# Phase 14 Plan 01: Data Layer — Tarification Summary

Dynamic pricing foundation: Recipe.prixParDefautHT + Customer.tarifs + buildFacture price-resolution chain (override → default → 25 fallback), store v4 migration.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 14-01-01 | Extend domain types | 4aee7c7 | lib/types.ts |
| 14-01-02 | Update seed data | 36ad70b | lib/seed.ts |
| 14-01-03 | Bump store to v4 with migration | 0d04cbc | lib/store.ts |
| 14-01-04 | Update buildFacture dynamic pricing | 205e260 | lib/facture-builder.ts |
| 14-01-05 | Update call sites to pass customer | fb2a503 | components/livraisons/deliveries-table.tsx, components/clients/client-dialog.tsx |

## Decisions Made

1. **Price resolution chain** — `override?.prixHT ?? recipe?.prixParDefautHT ?? 25` — client tarif takes priority over recipe default; the `?? 25` guard exists for robustness but will never fire once all recipes carry the field.

2. **Store v4 migration** — idempotent checks (`"prixParDefautHT" in r`, `"tarifs" in c`) prevent double-migration and handle edge cases where the field was already set.

3. **deliveries-table refactor** — the inline facture builder (duplicated logic, hardcoded 25) was replaced with a call to `buildFacture`, which is now the single source of truth for invoice construction.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed client-dialog missing tarifs on Customer creation**
- **Found during:** Task 5 (TypeScript compilation pass)
- **Issue:** `client-dialog.tsx` created Customer objects without the now-required `tarifs` field, causing a TypeScript error and runtime objects that don't conform to the type
- **Fix:** Added `tarifs: []` to the Customer object literal in the create branch of `onSubmit`
- **Files modified:** `components/clients/client-dialog.tsx`
- **Commit:** fb2a503

**2. [Rule 3 - Blocking] Replaced inline facture builder in deliveries-table**
- **Found during:** Task 5 — `buildFacture` had no call sites; the inline builder was the real code path
- **Issue:** `deliveries-table.tsx` had its own inline facture builder bypassing `buildFacture`, missing `paiement` field (pre-existing bug surfaced by type), and hardcoding 25 CHF/kg
- **Fix:** Replaced the entire inline builder with a call to `buildFacture` passing the resolved customer object
- **Files modified:** `components/livraisons/deliveries-table.tsx`
- **Commit:** fb2a503

## Known Stubs

None — all pricing fields have real values (prixParDefautHT: 25 in seed data; tarifs: [] empty arrays are correct initial state, not stubs).

## Threat Flags

None — no new network endpoints, auth paths, or trust boundary changes introduced.

## Self-Check: PASSED

- lib/types.ts contains `prixParDefautHT:` — FOUND
- lib/types.ts contains `tarifs:` — FOUND
- lib/store.ts contains `version: 4` — FOUND
- lib/store.ts contains `prixParDefautHT` — FOUND
- lib/facture-builder.ts contains `prixParDefautHT` — FOUND
- lib/facture-builder.ts contains `tarifs` — FOUND
- All commits exist: 4aee7c7, 36ad70b, 0d04cbc, 205e260, fb2a503 — FOUND
- TypeScript compiles with no errors — PASSED

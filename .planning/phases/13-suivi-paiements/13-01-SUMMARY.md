---
phase: "13"
plan: "01"
subsystem: "paiements-data-layer"
tags: ["factures", "paiement", "zustand", "migration", "dashboard"]
dependency_graph:
  requires: ["lib/types.ts", "lib/store.ts", "lib/factures.ts", "lib/dashboard.ts"]
  provides: ["paiement field on Facture", "updateFacture action", "isFactureEnRetard", "sumFacturesEnAttente", "countFacturesEnRetard"]
  affects: ["lib/facture-builder.ts"]
tech_stack:
  added: []
  patterns: ["Zustand CRUD action pattern", "versioned persist migration", "pure helper functions"]
key_files:
  created: []
  modified:
    - lib/types.ts
    - lib/store.ts
    - lib/factures.ts
    - lib/dashboard.ts
    - lib/facture-builder.ts
decisions:
  - "facture-builder.ts needed paiement field added (TypeScript required it) — all new factures start as en_attente"
  - "Store version bumped 2→3; migration maps existing factures to add paiement.statut=en_attente and settings.delaiPaiementJours=30"
  - "isFactureEnRetard uses UTC midnight normalization to avoid timezone drift"
metrics:
  duration: "~5 min"
  completed: "2026-05-05"
  tasks_completed: 3
  files_changed: 5
---

# Phase 13 Plan 01: Suivi Paiements — Data Layer Summary

**One-liner:** Extends Facture type with payment lifecycle, adds store migration v2→v3 with updateFacture action, and adds pure helpers for overdue detection and dashboard KPIs.

## Tasks Completed

| # | Task | Status |
|---|------|--------|
| T1 | Extend Facture.paiement + AppSettings.delaiPaiementJours in lib/types.ts | ✓ |
| T2 | Add updateFacture, DEFAULT_SETTINGS.delaiPaiementJours, version 3 + v2→v3 migration in lib/store.ts | ✓ |
| T3 | Add STATUT_PAIEMENT_LABELS/CLASSES, CLASSE_EN_RETARD, isFactureEnRetard to lib/factures.ts; add sumFacturesEnAttente/countFacturesEnRetard to lib/dashboard.ts | ✓ |

## Deviations from Plan

**1. [Rule 1 - Clarification] facture-builder.ts also needed paiement field**
- **Found during:** TypeScript check
- **Issue:** `lib/facture-builder.ts` creates Facture objects directly — missing the new required `paiement` field caused a TS error.
- **Fix:** Added `paiement: { statut: "en_attente" as const }` to the returned object.
- **Files modified:** lib/facture-builder.ts (unplanned but necessary)

## Known Stubs

None.

## Threat Flags

None.

## Self-Check: PASSED

- lib/types.ts paiement: FOUND (grep -c: 1)
- lib/types.ts delaiPaiementJours: FOUND (grep -c: 1)
- lib/store.ts updateFacture: FOUND (grep -c: 2)
- lib/store.ts version: 3: FOUND
- lib/factures.ts isFactureEnRetard: FOUND
- lib/dashboard.ts sumFacturesEnAttente: FOUND
- lib/dashboard.ts line count: 295 (≤ 300)
- TypeScript: 0 errors

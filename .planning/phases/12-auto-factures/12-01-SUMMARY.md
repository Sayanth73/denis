---
phase: "12"
plan: "01"
subsystem: "factures"
tags: ["factures", "livraisons", "zustand", "print"]
dependency_graph:
  requires: ["lib/types.ts", "lib/store.ts", "lib/seed.ts", "components/livraisons/deliveries-table.tsx"]
  provides: ["app/factures/page.tsx", "app/factures/[id]/page.tsx", "lib/factures.ts"]
  affects: ["lib/nav.ts", "lib/nav-icons.tsx"]
tech_stack:
  added: []
  patterns: ["useReactToPrint contentRef pattern", "Zustand CRUD action pattern"]
key_files:
  created:
    - lib/factures.ts
    - app/factures/page.tsx
    - app/factures/[id]/page.tsx
  modified:
    - lib/types.ts
    - lib/store.ts
    - lib/seed.ts
    - lib/nav.ts
    - lib/nav-icons.tsx
    - components/livraisons/deliveries-table.tsx
decisions:
  - "Auto-facture trigger is in deliveries-table.tsx handleConfirmLivree (not new-delivery-dialog.tsx) — that is where Marquer comme livrée logic actually lives"
  - "Price fixed at 25 CHF/kg HT; TVA 8.1% (0.081)"
  - "Facture number sequence: factures.length + 1 at time of creation"
metrics:
  duration: "~15 min"
  completed: "2026-05-05"
  tasks_completed: 9
  files_changed: 9
---

# Phase 12 Plan 01: Auto-Factures Summary

**One-liner:** Auto-generated CHF invoices (F-AAAA-NNNN) on delivery confirmation, with list and printable detail pages.

## Tasks Completed

| # | Task | Commit |
|---|------|--------|
| T1 | Add Facture/FactureLigne types to lib/types.ts | f9ea4ea |
| T2 | Create lib/factures.ts generateFactureNumber helper | 95db546 |
| T3 | Add factures state + actions to lib/store.ts | 8dc187d |
| T4 | Add factures: [] to lib/seed.ts buildSeed return | f17da14 |
| T5 | Auto-generate facture in deliveries-table.tsx handleConfirmLivree | a524075 |
| T6 | Add Receipt icon + Factures sidebar entry | 4bea1a8 |
| T7 | Create app/factures/page.tsx list page | b82dc08 |
| T8 | Create app/factures/[id]/page.tsx detail + print | 02c7a92 |
| T9 | TypeScript check (clean) + SUMMARY | this |

## Deviations from Plan

**1. [Rule 1 - Clarification] Facture trigger location**
- **Found during:** T5
- **Issue:** Plan instructions said to modify `new-delivery-dialog.tsx`, but "Marquer comme livrée" confirm logic lives in `components/livraisons/deliveries-table.tsx handleConfirmLivree`. The dialog only handles "Préparer la livraison" (statut: preparee).
- **Fix:** Updated `deliveries-table.tsx` instead — correct location for the auto-facture trigger.
- **Files modified:** components/livraisons/deliveries-table.tsx

## Known Stubs

None — all data is wired from Zustand store.

## Threat Flags

None — no new network endpoints or auth paths introduced.

## Self-Check: PASSED

- lib/factures.ts: FOUND
- app/factures/page.tsx: FOUND
- app/factures/[id]/page.tsx: FOUND
- TypeScript: 0 errors

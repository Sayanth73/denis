---
phase: 06-clients-screen
plan: 01
subsystem: data-helpers
tags: [pure-functions, traceability, typescript]
dependency_graph:
  requires: [lib/types.ts]
  provides: [lib/clients.ts]
  affects: []
tech_stack:
  added: []
  patterns: [type-predicate-filter, safe-fallback-null-map]
key_files:
  created:
    - lib/clients.ts
  modified: []
decisions:
  - "Used .filter((fp): fp is FinishedProduct => fp !== undefined) type predicate to safely narrow (FinishedProduct | undefined)[] without :any"
  - "Reversed filtered copy (not original array) for most-recent-first ordering in getDeliveriesForCustomer"
  - "getRawMaterialsForBroche maps to null for missing RMs then filters with type predicate — avoids sparse arrays"
metrics:
  duration: "~5 minutes"
  completed: "2026-05-05"
  tasks: 1
  files: 1
---

# Phase 6 Plan 1: Pure Traceability Helpers Summary

Pure data-access layer for the Clients screen — three helper functions in `lib/clients.ts` with safe fallbacks and strict TypeScript predicates.

## What Was Built

**`lib/clients.ts`** — 65-line pure module, no React, no Zustand.

### Function Signatures and Behaviors

**1. `getDeliveriesForCustomer(customerId: string, deliveries: Delivery[]): Delivery[]`**
- Spreads deliveries into a copy (`[...deliveries]`) before filtering and reversing to avoid mutating the caller's array.
- `.filter(d => d.customerId === customerId)` narrows to the target customer.
- `.reverse()` on the filtered copy produces most-recent-first order (matches the Phase 5 DeliveriesTable pattern).
- Returns `[]` if no deliveries match — no null/undefined possible.

**2. `getBrochesForDelivery(delivery: Delivery, finishedProducts: FinishedProduct[]): FinishedProduct[]`**
- Maps each id in `delivery.brochesLivrees` to a `FinishedProduct | undefined` via `.find()`.
- Type predicate filter `(fp): fp is FinishedProduct => fp !== undefined` safely narrows the union, satisfying TypeScript strict mode without `: any`.
- Silently drops IDs that have no matching FinishedProduct (safe fallback for data gaps).

**3. `getRawMaterialsForBroche(broche: FinishedProduct, productionOrders: ProductionOrder[], rawMaterials: RawMaterial[]): { rm: RawMaterial; quantiteUtilisee: number }[]`**
- Implements the full traceability chain:
  ```
  broche.productionOrderId
  → productionOrders.find(o => o.id === broche.productionOrderId)
  → order.matieresPremieresUtilisees[{ rawMaterialId, quantiteUtilisee }]
  → rawMaterials.find(r => r.id === rawMaterialId)
  ```
- Returns `[]` immediately if the production order is not found (early exit, no crash).
- Maps each `matieresPremieresUtilisees` entry to `{ rm, quantiteUtilisee } | null`, then filters with a type predicate to drop missing RMs.
- Returns `{ rm: RawMaterial; quantiteUtilisee: number }[]` — the caller knows exactly what each entry contains.

## TypeScript Strict-Mode Patterns Used

| Pattern | Where | Why |
|---------|-------|-----|
| `import type { ... }` | top of file | No value imports needed; avoids any runtime footprint |
| `(fp): fp is FinishedProduct => fp !== undefined` | getBrochesForDelivery | Narrows `FinishedProduct \| undefined` array without `:any` |
| `(entry): entry is { rm: RawMaterial; quantiteUtilisee: number } => entry !== null` | getRawMaterialsForBroche | Same pattern for `T \| null` after .map() |
| Spread before reverse: `[...deliveries]` | getDeliveriesForCustomer | Avoids in-place mutation of caller's array |

## Commits

| Task | Commit | Files |
|------|--------|-------|
| 1 — Create lib/clients.ts | b6b8f97 | lib/clients.ts (created, 65 lines) |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. This is a pure data-helper module with no UI rendering.

## Threat Flags

None. The pure helper module introduces no new network endpoints, auth paths, file access patterns, or schema changes. Threat posture is as assessed in the plan's STRIDE register (T-06-01, T-06-02 both accepted).

## Self-Check: PASSED

- FOUND: lib/clients.ts
- FOUND: commit b6b8f97
- `npx tsc --noEmit` exits 0

---
phase: 05-livraisons-screen
plan: "01"
subsystem: deliveries
tags: [shadcn, primitives, helpers, pure-functions, deliveries]
dependency_graph:
  requires: []
  provides:
    - components/ui/checkbox.tsx
    - components/ui/textarea.tsx
    - components/ui/scroll-area.tsx
    - lib/deliveries.ts
  affects:
    - Wave 2 (05-02): DeliveriesTable, page route consume lib/deliveries.ts exports and use ScrollArea/Checkbox
    - Wave 3 (05-03): NewDeliveryDialog uses Checkbox, Textarea, ScrollArea, getInStockBroches
tech_stack:
  added:
    - "@radix-ui/react-checkbox (via shadcn checkbox)"
    - "@radix-ui/react-scroll-area (via shadcn scroll-area)"
  patterns:
    - "STATUT_LIVRAISON_LABELS / STATUT_LIVRAISON_CLASSES mirrors lib/raw-materials.ts STATUT_LABELS / STATUT_CLASSES pattern"
    - "Pure helper functions — no React, no side effects"
key_files:
  created:
    - components/ui/checkbox.tsx
    - components/ui/textarea.tsx
    - components/ui/scroll-area.tsx
    - lib/deliveries.ts
  modified: []
decisions:
  - "Badge classes locked per 05-UI-SPEC.md: preparee=amber-50, livree=emerald-50"
  - "getInStockBroches sorts by dlc ascending (FIFO) to promote oldest stock for delivery"
  - "formatDate imported from lib/raw-materials to avoid duplication (single source of truth)"
metrics:
  duration: "~5 minutes"
  completed: "2026-05-05"
  tasks_completed: 2
  tasks_total: 2
---

# Phase 05 Plan 01: shadcn Primitives + Delivery Helpers Summary

**One-liner:** Three shadcn primitives installed (checkbox, textarea, scroll-area) plus `lib/deliveries.ts` with 6 pure exports for the Livraisons screen.

## What Was Built

### Task 1: shadcn Primitives Installed

Three new UI primitive files added to `components/ui/`:

| File | Export | Dependency |
|------|--------|------------|
| `checkbox.tsx` | `Checkbox` | `@radix-ui/react-checkbox` |
| `textarea.tsx` | `Textarea` | (base HTML) |
| `scroll-area.tsx` | `ScrollArea`, `ScrollBar` | `@radix-ui/react-scroll-area` |

These primitives are used in Wave 3's `NewDeliveryDialog` for the broches multi-select list (ScrollArea + Checkbox per row) and notes field (Textarea).

### Task 2: lib/deliveries.ts — Pure Delivery Helpers

Created `lib/deliveries.ts` (94 lines, no `:any`, pure functions only).

**Status maps (6 exports total):**

| Export | Type | Purpose |
|--------|------|---------|
| `STATUT_LIVRAISON_LABELS` | `Record<Delivery["statut"], string>` | French display labels for badges/filters |
| `STATUT_LIVRAISON_CLASSES` | `Record<Delivery["statut"], string>` | Tailwind badge classes (locked) |
| `getInStockBroches` | `(fps) => FinishedProduct[]` | Filter + sort in-stock broches by DLC asc |
| `getDeliveryWeight` | `(delivery, fps) => number` | Sum poids for delivery's brochesLivrees |
| `getCustomerById` | `(id, customers) => Customer | undefined` | Customer lookup |
| `formatDeliveryRow` | `(delivery, fps, customers) => row` | Pre-computed table row object |

**Locked badge classes (per 05-UI-SPEC.md §Statut Badge):**
- `preparee`: `"bg-amber-50 border-amber-200 text-amber-800"`
- `livree`: `"bg-emerald-50 border-emerald-200 text-emerald-800"`

**`getInStockBroches` behavior:**
- Filters `fp.statut === "en_stock"` only
- Sorts by `dlc` ascending (lexicographic ISO date sort = chronological)
- Result promotes oldest-DLC broches to top of the checkbox list (FIFO logic)

## Notes for Wave 2/3 Consumers

**Wave 2 (DeliveriesTable + route page):**
- Import `formatDeliveryRow` to build table rows without inline JSX computation
- Import `STATUT_LIVRAISON_LABELS`, `STATUT_LIVRAISON_CLASSES` for badge rendering
- Use `ScrollArea` if table body needs constrained height

**Wave 3 (NewDeliveryDialog):**
- Import `getInStockBroches` to populate the checkbox list (already sorted by DLC)
- Use `Checkbox` + `ScrollArea` for the broches multi-select UI
- Use `Textarea` for the optional notes field
- `formatDate` is NOT re-exported from `lib/deliveries.ts` — import it directly from `lib/raw-materials` if needed in components

## Deviations from Plan

None — plan executed exactly as written.

## Threat Flags

None — Wave 1 contains only pure primitive components and pure helper functions. No network endpoints, auth paths, or data-boundary crossings introduced.

## Self-Check: PASSED

- `components/ui/checkbox.tsx` — FOUND
- `components/ui/textarea.tsx` — FOUND
- `components/ui/scroll-area.tsx` — FOUND
- `lib/deliveries.ts` — FOUND (94 lines, ≤ 300 cap)
- All 6 exports present — VERIFIED
- Locked badge classes present — VERIFIED
- `npx tsc --noEmit` — exit 0
- Task 1 commit `1a2cff3` — FOUND
- Task 2 commit `a484f7a` — FOUND

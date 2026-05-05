---
phase: 04-production-screen
plan: "01"
subsystem: production-helpers
tags: [shadcn, tabs, fifo, production, helpers]
dependency_graph:
  requires: [03-01-SUMMARY, 03-02-SUMMARY]
  provides: [components/ui/tabs.tsx, lib/production.ts]
  affects: [04-02-PLAN, 04-03-PLAN]
tech_stack:
  added: ["@radix-ui/react-tabs", "shadcn tabs primitive"]
  patterns: ["pure-function helpers", "FIFO lot allocation", "shadcn@2.10.0 pinned install"]
key_files:
  created:
    - components/ui/tabs.tsx
    - lib/production.ts
  modified:
    - package.json
    - package-lock.json
decisions:
  - "Pin shadcn@2.10.0 consistent with Phase 3 to avoid mixing primitive layouts"
  - "lib/production.ts is pure — no React, no store access, no side effects"
  - "Math.round(x * 100) / 100 throughout buildFifoDefaults and computeShortfall to avoid floating-point drift"
  - "todayIso uses UTC (slice of .toISOString()) to match generateLotNumber and computeBrocheDlc UTC conventions"
metrics:
  duration: 92s
  completed_date: "2026-05-05"
  tasks_completed: 2
  tasks_total: 2
---

# Phase 4 Plan 01: shadcn Tabs + FIFO production helpers Summary

**One-liner:** shadcn Tabs primitive (2.10.0) installed and pure FIFO lot-allocation helpers shipped in lib/production.ts for Wave 2/3 consumption.

## What Was Built

### Task 1: shadcn Tabs primitive (commit f6d361e)

`components/ui/tabs.tsx` generated via `npx shadcn@2.10.0 add tabs --yes`. Exports:

- `Tabs` — wrapper (TabsPrimitive.Root)
- `TabsList` — horizontal pill container with muted background
- `TabsTrigger` — individual tab button with active-state shadow
- `TabsContent` — panel with focus-ring

Peer dependency `@radix-ui/react-tabs` added to `package.json` and resolves via Node. File is 55 lines, untouched from registry output.

### Task 2: lib/production.ts — FIFO allocation helpers (commit aa01fdd)

91-line pure-function module. No React imports, no store access, no side effects. Imports only `RawMaterial` and `Recipe` types from `./types`.

**Exported functions and contracts:**

| Function | Contract |
|---|---|
| `computeRequiredQty(ingredient, recipe, nombreBroches)` | Returns `(recipe.poidsTotal * ingredient.pourcentage / 100) * nombreBroches` in kg. No rounding — callers use `.toFixed(2)` for display. |
| `getEligibleLots(rawMaterials, typeMatiere, todayIso)` | Filters by `type === typeMatiere && quantiteRestante > 0 && dlc >= todayIso`, then sorts by `dlc` ascending (lexicographic = chronological for ISO YYYY-MM-DD). |
| `buildFifoDefaults(eligibleLots, requiredQty)` | Greedy fill from earliest-DLC lot first. Returns `Record<string, number>` allocation map; unused lots get `0`. Rounds each allocation to 2 decimal places. |
| `computeShortfall(allocations, requiredQty)` | Returns `requiredQty - sum(values)` rounded to 2 decimal places. Positive = shortage, negative = over-allocated. Callers check `> 0` for warning display and wizard step blocking. |
| `todayIso()` | Returns `new Date().toISOString().slice(0, 10)` (UTC ISO YYYY-MM-DD). Consistent with `generateLotNumber` and `computeBrocheDlc` UTC conventions. |

## Wave 2/3 Hand-off

**Wave 2 (04-02-PLAN.md — page + tabs + table) imports:**
- `components/ui/tabs.tsx` — `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` for the `/production` page two-tab layout

**Wave 3 (04-03-PLAN.md — wizard) imports:**
- `lib/production.ts` — `computeRequiredQty`, `getEligibleLots`, `buildFifoDefaults`, `computeShortfall`, `todayIso` for the 3-step wizard Step 2 FIFO allocation and Step 3 confirmation

## Deviations from Plan

None — plan executed exactly as written.

## Threat Flags

No new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries introduced. Pure client-side helpers with no security-relevant surface.

## Self-Check: PASSED

- `components/ui/tabs.tsx` exists: FOUND
- `lib/production.ts` exists: FOUND
- Commit f6d361e exists: FOUND
- Commit aa01fdd exists: FOUND
- `npx tsc --noEmit` exit 0: PASSED
- Both files <= 300 lines: PASSED (tabs: 55, production: 91)
- No `: any` in lib/production.ts: PASSED

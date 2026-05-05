---
phase: 07-tracabilite-screen
plan: 01
subsystem: tracabilite
tags: [pure-helpers, react-to-print, pdf-export, print-css, reusable-components]
dependency_graph:
  requires: []
  provides:
    - lib/tracabilite.ts (6 pure helpers)
    - components/ui/tracabilite-section.tsx (TracabiliteSection card)
    - components/tracabilite/tracabilite-printable.tsx (TracabilitePrintable forwardRef)
    - app/globals.css (@media print isolation)
  affects:
    - Phase 7 Wave 2 (builds page on top of these primitives)
    - Phase 7 Wave 3 (cross-screen links to /tracabilite?lot=...)
tech_stack:
  added:
    - react-to-print (useReactToPrint hook for print-to-PDF)
  patterns:
    - Pure helper functions with explicit parameters (no store access)
    - React.forwardRef for print target exposure
    - @media print CSS isolation via .print-target class
key_files:
  created:
    - lib/tracabilite.ts
    - components/ui/tracabilite-section.tsx
    - components/tracabilite/tracabilite-printable.tsx
  modified:
    - package.json (react-to-print added)
    - package-lock.json
    - app/globals.css (@media print block appended)
decisions:
  - Used Array.from(Map) for iteration to satisfy TypeScript strict mode without downlevelIteration flag
  - step prop typed as 1|2|3 on TracabiliteSection for future use but not rendered as numeric label (per PRD §7 no design fun)
metrics:
  duration: ~15 minutes
  completed: 2026-05-05
  tasks_completed: 2
  files_created: 3
  files_modified: 3
---

# Phase 7 Plan 01: Traçabilité Foundational Layer Summary

Wave 1 installed `react-to-print` and created the entire foundational layer — 6 pure traceability helpers, the reusable `<TracabiliteSection>` card primitive, the `<TracabilitePrintable>` forwardRef wrapper, and print isolation CSS — with no route page touched.

## Helper Function Contracts

### `detectLotType(input: string): "broche" | "supplier" | null`

Regex-based lot type detection. Internal broche lots match `/^TK-\d{4}-\d{4}-\d{3}$/`.

| Input | Output |
|-------|--------|
| `""` (empty/whitespace) | `null` |
| `"TK-2024-0301-001"` | `"broche"` |
| `"LOT-FOURNISSEUR-123"` | `"supplier"` |

### `findSupplierLot(input, rawMaterials): RawMaterial | null`

Matches by `numeroLotFournisseur` field. Returns first match or null.

### `findBroche(input, finishedProducts): FinishedProduct | null`

Matches by `numeroLotInterne` field. Returns first match or null.

### `getProductionOrdersForRm(rmId, productionOrders): { order, quantiteUtilisee }[]`

Trace path: scans `order.matieresPremieresUtilisees` for `rawMaterialId === rmId`. Returns matches sorted by `order.date` descending (most recent first).

### `getClientsImpactes(rmId, productionOrders, finishedProducts, deliveries, customers): { customer, delivery, broches }[]`

Full downstream trace (RM → customers):
1. Find all orders where `matieresPremieresUtilisees` includes `rmId`
2. Collect all `brochesProduites` IDs from those orders
3. Resolve in `finishedProducts` — keep only `statut === "livree"` with `livraisonId` set
4. Group by `livraisonId`
5. Resolve `delivery` + `customer` for each group
6. Sort by `delivery.date` descending

Returns `[]` safely if any intermediate lookup fails.

### `getRecipeForOrder(broche, productionOrders, recipes): { order, recipe } | null`

Lookup path: `broche.productionOrderId` → `order.recipeId` → `recipe`. Returns null if either step fails.

## Component Contracts

### `TracabiliteSection` (`components/ui/tracabilite-section.tsx`)

Props: `{ step: 1|2|3, heading: string, children: ReactNode, className?: string }`

Renders a `div` with `pl-10 pb-2` offset. Contains:
- An absolute-positioned step dot at `left-[0.625rem] top-3` with `bg-border ring-2 ring-background` (aligns to a `left-4` vertical rail line in the parent)
- A card surface (`rounded-md border bg-background p-5`) with an `h3` heading

Parent must have `className="relative"` for dot positioning to work correctly.

### `TracabilitePrintable` (`components/tracabilite/tracabilite-printable.tsx`)

`React.forwardRef<HTMLDivElement, { children: ReactNode }>` — exposes ref for `useReactToPrint`'s `contentRef`. Renders as `<div className="print-target">`. `displayName` set for React DevTools.

## Print CSS Approach

Appended to `app/globals.css` as a standalone `@media print` block (outside any `@layer`):

```css
@media print {
  body * { visibility: hidden; }
  .print-target, .print-target * { visibility: visible; }
  .print-target { position: absolute; top: 0; left: 0; width: 100%; }
}
```

This ensures only the `TracabilitePrintable` wrapper content is visible when printing, hiding the nav, sidebar, search bar, and everything else.

## Phase 7 Wave 2 Hand-off Notes

Wave 2 (`07-02-PLAN.md`) builds the `/tracabilite` route page and result components directly on these primitives:

1. **Import tracabilite helpers** from `lib/tracabilite.ts` — all 6 are ready.
2. **`<TracabiliteSection>`** is the card primitive for both Cas 1 and Cas 2 three-section layouts.
3. **`<TracabilitePrintable ref={contentRef}>`** wraps the result region; pass `contentRef` to `useReactToPrint({ contentRef })` for the "Exporter PDF" button.
4. **URL search param**: `?lot={value}` — `detectLotType` determines whether to call `findSupplierLot` (Cas 1) or `findBroche` (Cas 2).
5. **Shortcut chips**: read first supplier lot and first broche from the Zustand store on mount to pre-populate the two example buttons.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Map iteration TypeScript error with strict mode**
- **Found during:** Task 1 verification (`npx tsc --noEmit`)
- **Issue:** `for...of` over `Map` entries produced TS2802 ("can only be iterated through when using --downlevelIteration or target es2015+"). The tsconfig has no explicit `target` field, causing tsc to default to ES3.
- **Fix:** Replaced `for (const [key, val] of map)` with `for (const [key, val] of Array.from(map))` — equivalent behavior, no flag needed.
- **Files modified:** `lib/tracabilite.ts` (line 144)
- **Commit:** 1fb5c4b

## Known Stubs

None — this plan creates pure helpers and primitive components only. No data display, no wired store access. No stubs exist.

## Threat Flags

No new threat surface beyond what was already registered in the plan's threat model (T-07-01, T-07-02, T-07-03). All inputs are typed union returns or plain lookups; no new network endpoints or auth paths introduced.

## Self-Check: PASSED

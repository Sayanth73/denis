---
phase: 07-tracabilite-screen
plan: 02
subsystem: tracabilite
tags: [react-to-print, useSearchParams, zustand, next-navigation, search-state-machine, url-sync]

requires:
  - phase: 07-01
    provides: lib/tracabilite.ts (6 pure helpers), TracabiliteSection, TracabilitePrintable, @media print CSS

provides:
  - app/tracabilite/page.tsx (search bar, SearchState machine, URL sync, result dispatch)
  - components/tracabilite/tracabilite-upstream.tsx (Cas 1 — 3-section amont view with PDF export)
  - components/tracabilite/tracabilite-downstream.tsx (Cas 2 — 3-section aval view with PDF export)

affects:
  - Phase 7 Wave 3 (cross-screen links: production toast + BrochesExpansion lot number → /tracabilite?lot=...)

tech-stack:
  added: []
  patterns:
    - SearchState union discriminant type for multi-case result rendering
    - Inner/outer Suspense split for useSearchParams in Next.js 14 SSG pages
    - TracabilitePrintable forwardRef + useReactToPrint contentRef pattern for PDF export
    - Definition list grid (grid-cols-[auto_1fr]) for field/value pairs in result sections

key-files:
  created:
    - app/tracabilite/page.tsx
    - components/tracabilite/tracabilite-upstream.tsx
    - components/tracabilite/tracabilite-downstream.tsx
  modified: []

key-decisions:
  - "Wrapped TracabilitePageInner in React.Suspense to satisfy Next.js useSearchParams SSG pre-rendering requirement"
  - "triggerSearch reads finishedProducts/rawMaterials via closure — hasHydrated as useEffect dep ensures store is populated before URL-param auto-search"
  - "Broche-first fallback in triggerSearch: if TK-... regex matches but no broche found, falls back to supplier lot search"

requirements-completed:
  - REQ-tracabilite-search
  - REQ-tracabilite-upstream
  - REQ-tracabilite-downstream
  - REQ-tracabilite-pdf-export

duration: ~20min
completed: 2026-05-05
---

# Phase 7 Plan 02: Traçabilité Route Page and Result Components Summary

**Full-stack traceability UI: bidirectional lot search with URL sync, three-section upstream/downstream result views, and PDF export via useReactToPrint — the killer feature of the POC is now live.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-05-05
- **Completed:** 2026-05-05
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- `/tracabilite` page with search state machine, shortcut chips, URL `?lot=` sync, and result dispatch to Cas 1 or Cas 2 views
- `<TracabiliteUpstream>` (Cas 1): three-section amont view showing Matière première details, Ordres de fabrication concernés table, and Clients impactés table — all derived from Wave 1 pure helpers
- `<TracabiliteDownstream>` (Cas 2): three-section aval view showing Broche finie details, Ordre de fabrication + recipe composition pills, and Matières premières utilisées table
- Both result components wired to `useReactToPrint` via `TracabilitePrintable` forwardRef for one-click PDF export

## Task Commits

1. **Task 1: TracabiliteUpstream and TracabiliteDownstream result components** — `fe2d7e6` (feat)
2. **Task 2: /tracabilite page — search bar, URL sync, result dispatch** — `a5c01c9` (feat)

## Files Created/Modified

- `components/tracabilite/tracabilite-upstream.tsx` — Cas 1 result component: props `{ rm, productionOrders, finishedProducts, deliveries, customers, recipes }`, calls `getProductionOrdersForRm` + `getClientsImpactes`, wired to `useReactToPrint`
- `components/tracabilite/tracabilite-downstream.tsx` — Cas 2 result component: props `{ broche, productionOrders, rawMaterials, customers, deliveries, recipes }`, calls `getRecipeForOrder` + `getRawMaterialsForBroche`, wired to `useReactToPrint`
- `app/tracabilite/page.tsx` — Client page: `SearchState` union type, `triggerSearch` dispatcher, URL sync via `useSearchParams`+`useEffect(hasHydrated)`, two shortcut chips from store seed data

## Search State Machine

```typescript
type SearchState =
  | { kind: "idle" }              // before any search — idle EmptyState
  | { kind: "not-found" }         // searched, no match — SearchX EmptyState
  | { kind: "upstream"; rm: RawMaterial }         // Cas 1
  | { kind: "downstream"; broche: FinishedProduct }; // Cas 2
```

`triggerSearch(value)` logic:
1. `detectLotType(trimmed)` → "broche" | "supplier" | null
2. If "broche" → `findBroche()` → if found: downstream; if not: fallback to `findSupplierLot()` → upstream or not-found
3. If "supplier" → `findSupplierLot()` → upstream or not-found
4. If null (empty) → idle

## URL Sync Pattern

```typescript
// On mount (after hydration):
React.useEffect(() => {
  if (!hasHydrated) return;
  const lotParam = searchParams.get("lot");
  if (lotParam) { setQuery(lotParam); triggerSearch(lotParam); }
}, [hasHydrated]);

// On submit / chip click:
router.replace(`/tracabilite?lot=${encodeURIComponent(value)}`);
```

`hasHydrated` as the sole dependency ensures the Zustand store is populated (seed data loaded) before the URL param auto-search runs. `router.replace` (not `push`) keeps back-navigation clean.

## Component Contracts

### TracabiliteUpstream props
```typescript
{ rm: RawMaterial; productionOrders: ProductionOrder[]; finishedProducts: FinishedProduct[];
  deliveries: Delivery[]; customers: Customer[]; recipes: Recipe[] }
```
Helper calls: `getProductionOrdersForRm(rm.id, productionOrders)` + `getClientsImpactes(rm.id, ...)`

### TracabiliteDownstream props
```typescript
{ broche: FinishedProduct; productionOrders: ProductionOrder[]; rawMaterials: RawMaterial[];
  customers: Customer[]; deliveries: Delivery[]; recipes: Recipe[] }
```
Helper calls: `getRecipeForOrder(broche, productionOrders, recipes)` + `getRawMaterialsForBroche(broche, productionOrders, rawMaterials)`

### PDF Wiring (both components)
```typescript
const printableRef = React.useRef<HTMLDivElement>(null);
const handlePrint = useReactToPrint({ contentRef: printableRef, documentTitle: "Tracabilite-{lotNumber}" });
// <TracabilitePrintable ref={printableRef}> wraps section content
// <Button onClick={handlePrint}> triggers print dialog
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added React.Suspense wrapper for useSearchParams**
- **Found during:** Task 2 verification (`npm run build`)
- **Issue:** Next.js 14 SSG pre-rendering fails with `useSearchParams() should be wrapped in a suspense boundary at page "/tracabilite"` when the hook is called directly in the page component
- **Fix:** Split into `TracabilitePageInner` (all hooks + JSX) and `TracabilitePage` default export that wraps inner in `<React.Suspense fallback={null}>`. This is the standard Next.js 14 pattern.
- **Files modified:** `app/tracabilite/page.tsx`
- **Verification:** `npm run build` exits 0; `/tracabilite` appears as static in build output
- **Committed in:** `a5c01c9` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Required for build correctness. No scope creep. Page line count remains 182 (well under 300 cap).

## Issues Encountered

- Zustand `localStorage` rehydration warnings during SSR build (`r.getItem is not a function`) are pre-existing behavior from the store's persist middleware running in a Node.js environment without `localStorage`. These are not errors introduced by this plan and do not affect the build output or runtime behavior.

## Phase 7 Wave 3 Hand-off Notes

Three surgical link additions remain for Phase 7 Wave 3 (not in scope for this plan):

1. **Production toast** (`app/production/` confirm handler): add `action: { label: "Voir la traçabilité", onClick: () => router.push(\`/tracabilite?lot=${firstBroche.numeroLotInterne}\`) }` to `toast.success`.
2. **BrochesExpansion lot link** (`components/clients/broches-expansion.tsx`): wrap `<span className="font-mono">{fp.numeroLotInterne}</span>` in `<Link href={/tracabilite?lot=${fp.numeroLotInterne}}>`.
3. **Livraisons delivery confirm toast** (if toast exists): add tracabilité action link referencing first delivered broche.

## Known Stubs

None — all three components render live data from the Zustand store. The shortcut chips read from `rawMaterials[0]` and `finishedProducts[0]` which are populated by seed data on first hydration.

## Threat Flags

No new threat surface introduced beyond the registered threat model (T-07-04, T-07-05, T-07-06). The `?lot=` URL param is passed through `detectLotType` (regex only) then to array lookups — no store mutation, no code evaluation.

## Self-Check: PASSED

- `app/tracabilite/page.tsx` — exists, 182 lines, `"use client"`, all required patterns present
- `components/tracabilite/tracabilite-upstream.tsx` — exists, section headings verified, useReactToPrint wired
- `components/tracabilite/tracabilite-downstream.tsx` — exists, section headings verified, useReactToPrint wired
- Commits `fe2d7e6` and `a5c01c9` verified in git log
- `npx tsc --noEmit` exits 0
- `npm run build` exits 0, `/tracabilite` in build output

---
phase: 15-ui-layer-grille-tarifaire-tarifs-speciaux
plan: "01"
subsystem: ui
tags: [react, zustand, shadcn, table, pricing, next.js]

# Dependency graph
requires:
  - phase: 14-data-layer-pricing
    provides: prixParDefautHT on Recipe, tarifs on Customer, updateRecipe/updateCustomer store actions
provides:
  - Grille tarifaire section in /parametres with 3 editable CHF/kg inputs per recipe
  - Tarifs speciaux section in /clients/[id] with 3-column override table per recipe
  - handleSaveGrille and handleSaveTarifs event handlers with validation and toast feedback
affects: [factures, clients, parametres]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "localPrices / overrides state pattern: initialize from store on hydration, edit locally, flush on save"
    - "useTraceabilityStore.getState() for write operations inside event handlers (not reactive subscriptions)"
    - "Number(val) over parseFloat for price parsing — rejects '25abc' correctly"
    - "customer derived before hooks so useEffect can reference it without ESLint closure issues"

key-files:
  created: []
  modified:
    - app/parametres/page.tsx
    - "app/clients/[id]/page.tsx"

key-decisions:
  - "Moved customer derivation (customers.find) above useState hooks so the initializer useEffect can safely reference it without ESLint closure warnings"
  - "One-time initialization useEffect (deps: [hasHydrated]) intentionally omits recipes/customer to avoid discarding in-progress edits on store updates"
  - "Empty override field is valid for Tarifs speciaux (restores recipe default by excluding entry from customer.tarifs) but invalid for Grille tarifaire (recipe prices are required)"

patterns-established:
  - "Inline-edit table pattern: read-only derived column + editable Input column + single Enregistrer button per section"
  - "Validation pattern: iterate recipes, check val==='' and Number(val)<0 before writing; show inline error via state"

requirements-completed:
  - REQ-v3-prix-client-override

# Metrics
duration: 15min
completed: 2026-05-05
---

# Phase 15 Plan 01: UI Layer — Grille tarifaire & Tarifs spéciaux Summary

**Inline-edit pricing UI in /parametres (recipe defaults CHF/kg) and /clients/[id] (per-client overrides) wired to Phase 14 Zustand store actions**

## Performance

- **Duration:** 15 min
- **Started:** 2026-05-05T00:00:00Z
- **Completed:** 2026-05-05T00:15:00Z
- **Tasks:** 3 (2 implementation + 1 verification)
- **Files modified:** 2

## Accomplishments
- Grille tarifaire section in /parametres: 3-row editable table seeded from recipe.prixParDefautHT, save validates and calls updateRecipe per recipe, shows toast "Grille tarifaire mise à jour"
- Tarifs spéciaux section in /clients/[id]: 3-column table (name, read-only default, editable override) seeded from customer.tarifs, clearing a field on save removes that entry, shows toast "Tarifs mis à jour"
- Full TypeScript check passes (exit 0) with no regressions

## Task Commits

1. **Task 1: Grille tarifaire section in parametres page** - `5323df9` (feat)
2. **Task 2: Tarifs speciaux section in client detail page** - `52dde83` (feat)
3. **Task 3: TypeScript verification** - covered by Task 2 commit (tsc --noEmit exit 0)

## Files Created/Modified
- `app/parametres/page.tsx` - Added Table imports, recipes/localPrices/prixError state, useEffect initializer, handleSaveGrille, Grille tarifaire JSX section
- `app/clients/[id]/page.tsx` - Added Input/Button/toast/Table imports, moved customer derivation above hooks, added overrides/tarifsError state, useEffect initializer, handleSaveTarifs, Tarifs speciaux JSX section

## Decisions Made
- Moved `customer = customers.find(...)` above the useState/useEffect hooks so the initialization effect can reference it safely. This avoids a stale closure while keeping rules-of-hooks compliance.
- Used `Number(val)` not `parseFloat(val)` for price parsing per plan spec — parseFloat("25abc") returns 25 (incorrect), Number("25abc") returns NaN (correct).
- One-time initialization useEffect with `[hasHydrated]` dep array intentionally omits `recipes` and `customer` to prevent discarding in-progress edits when the store updates.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Moved customer derivation above hooks**
- **Found during:** Task 2 (Tarifs speciaux implementation)
- **Issue:** Plan instructed adding the useEffect after `toggleDelivery` function, but `customer` was only derived after the `hasHydrated` early-return guard — meaning the effect would reference an undefined variable, causing a TypeScript error and potential runtime crash
- **Fix:** Derived `customer = customers.find((c) => c.id === id)` before the useState declarations (above all hooks), then removed the duplicate derivation that was after the guard
- **Files modified:** app/clients/[id]/page.tsx
- **Verification:** tsc --noEmit exits 0
- **Committed in:** 52dde83 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Necessary for TypeScript correctness and rules-of-hooks compliance. No scope creep.

## Issues Encountered
None beyond the customer-derivation ordering issue documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Both pricing UI sections are live and wired to the Phase 14 store
- The buildFacture helper from Phase 14 uses prixParDefautHT and customer.tarifs — those values are now operator-editable via UI
- No blockers for the next phase

## Self-Check: PASSED
- app/parametres/page.tsx: FOUND (modified)
- app/clients/[id]/page.tsx: FOUND (modified)
- Commit 5323df9: FOUND
- Commit 52dde83: FOUND
- tsc --noEmit: Exit 0

---
*Phase: 15-ui-layer-grille-tarifaire-tarifs-speciaux*
*Completed: 2026-05-05*

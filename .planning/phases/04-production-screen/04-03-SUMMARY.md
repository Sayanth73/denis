---
phase: 04-production-screen
plan: "03"
subsystem: production-wizard
tags: [wizard, fifo, allocation, production-order, finished-product, zod-v4]
dependency_graph:
  requires: [04-01-SUMMARY, 04-02-SUMMARY]
  provides:
    - components/production/allocation-step.tsx
    - components/production/production-wizard.tsx
  affects:
    - app/production/page.tsx
    - Phase 5 (livraisons — FinishedProduct.statut en_stock available)
    - Phase 7 (tracabilite — ProductionOrder.matieresPremieresUtilisees available)
tech_stack:
  added: []
  patterns:
    - "3-step Dialog wizard with internal step state (1|2|3)"
    - "Zod v4 string-refine pattern for numeric inputs"
    - "useEffect FIFO default rebuild on recipe/nombreBroches change"
    - "getState() synchronous store mutation (same as Phase 3 addRawMaterial)"
    - "per-day broche lot sequencing via finishedProducts.filter(fp => fp.dateProduction === today).length"
key_files:
  created:
    - components/production/allocation-step.tsx
    - components/production/production-wizard.tsx
  modified:
    - app/production/page.tsx
decisions:
  - "Zod v4 string-refine pattern for nombreBroches: z.string().refine(v => parseInt(v) >= 1) — no z.coerce.number() (Phase 3 SUMMARY deviation)"
  - "FIFO allocations rebuilt in useEffect with deps [recipeId, nombreBroches, rawMaterials, selectedRecipe] — stable references, no circular update"
  - "handleConfirm is one synchronous block: decrement RMs → addProductionOrder → addFinishedProduct × N → toast → close"
  - "existingTodayCount read from finishedProducts closure before mutations for consistent per-day sequence"
  - "State reset via setTimeout(200ms) after dialog close to avoid flicker during close animation"
  - "AllocationStep receives allocations/onChange as controlled props — wizard owns all state"
  - "onOpenChange={setWizardOpen} prop matches ProductionWizardProps contract exactly"
metrics:
  duration: 480s
  completed_date: "2026-05-05"
  tasks_completed: 4
  tasks_total: 4
---

# Phase 4 Plan 03: Production Wizard — 3-step Dialog Summary

**One-liner:** 3-step production wizard with FIFO lot allocation editor, full store mutation (RM decrement + ProductionOrder + N FinishedProducts), TK lot numbering, and DLC+5j computation wired end-to-end in /production.

## What Was Built

### Task 1: AllocationStep — step 2 FIFO lot allocation editor (commit f2706bd)

`components/production/allocation-step.tsx` — 185-line client component.

**Contract:**
```typescript
type AllocationsByIngredient = Record<string, Record<string, number>>;
type AllocationStepProps = {
  recipe: Recipe;
  nombreBroches: number;
  rawMaterials: RawMaterial[];
  allocations: AllocationsByIngredient;
  onChange: (next: AllocationsByIngredient) => void;
  errors: Record<string, string>;
};
export function AllocationStep(props: AllocationStepProps): JSX.Element;
```

**Per-ingredient layout:**
- Header: `TYPE_LABELS[typeMatiere] — requis : {qty} kg` in `text-sm font-medium text-foreground`
- Mini-table: `rounded border bg-background overflow-hidden` with `colgroup` widths 36/20/20/24 %
- Table header: `bg-zinc-50`, cells `text-xs font-medium text-muted-foreground py-2 px-3 border-b`
- Lot rows: lot number `font-mono`, DLC column uses `<DlcBadge>`, disponible `tabular-nums`, allocation `<Input h-7 text-xs text-right>`
- Running total: `text-xs text-muted-foreground` label using `(requiredQty - shortfall).toFixed(2)`
- Shortage badge: `bg-amber-100 text-amber-800 border-amber-200` — "manquant : X kg"
- Complete badge: `bg-emerald-100 text-emerald-800 border-emerald-200` — "Complet"
- Validation error (on step-advance attempt): `text-xs text-destructive mt-1.5`

Allocation change handler clamps to ≥ 0 and rounds to 2 decimal places.

### Task 2: ProductionWizard — 3-step dialog with confirm handler (commit 34c44ed)

`components/production/production-wizard.tsx` — 228-line client component.

**Contract:**
```typescript
type ProductionWizardProps = { open: boolean; onOpenChange: (next: boolean) => void };
export function ProductionWizard(props: ProductionWizardProps): JSX.Element;
```

**Step 1 — Recipe + broches form:**
- Zod v4 schema: `z.string().min(1)` for recipeId; `z.string().refine(v => parseInt(v) >= 1)` for nombreBroches
- Form submitted via `form="step1-form"` on the Suivant button (avoids nested `<form>` in DialogContent)
- FIFO defaults built in `useEffect` on deps `[recipeId, nombreBroches, rawMaterials, selectedRecipe]`

**Step 2 — Allocation editor:**
- Delegates to `<AllocationStep>` with controlled allocations state
- Step-advance blocked on any shortfall > 0 (sets per-ingredient errors map)

**Step 3 — Récapitulatif:**
- Shows: Recette, Broches, Date (JJ.MM.AAAA), DLC (JJ.MM.AAAA + "(production + 5 jours)")
- Consumed lots list with `TYPE_LABELS` label, `font-mono` lot number, `tabular-nums` qty

**Confirm handler (synchronous, one block):**
1. Build `matieresPremieresUtilisees` from allocations (filter qty > 0)
2. Compute `existingTodayCount = finishedProducts.filter(fp => fp.dateProduction === today).length`
3. Create N `FinishedProduct` objects with `generateLotNumber(new Date(), existingTodayCount + i + 1)`, `dlc = computeBrocheDlc(today)`, `statut = "en_stock"`
4. Create `ProductionOrder` with all fields
5. Decrement `quantiteRestante` on each consumed lot: `Math.round((rm.quantiteRestante - quantiteUtilisee) * 100) / 100`
6. `store.addProductionOrder(order)` then `store.addFinishedProduct(fp)` × N
7. `toast.success("Production confirmée — {N} broches ({recipeName})")` — em-dash with spaces
8. `handleClose()` → `onOpenChange(false)` + `setTimeout(200ms)` state reset

**Dialog dimensions:** `sm:max-w-[640px] max-h-[90vh] overflow-y-auto`

**Footer layout per step:**
- Step 1: Annuler (outline, left) | Suivant → (right)
- Step 2: ← Retour (outline, left) | Suivant → (right)
- Step 3: ← Retour (outline, left) | Confirmer la production (right)

### Task 3: /production page — mount wizard (commit 265c364)

`app/production/page.tsx` updated (65 lines):
- Added import: `ProductionWizard` from `@/components/production/production-wizard`
- Replaced `{wizardOpen && null}` placeholder with `<ProductionWizard open={wizardOpen} onOpenChange={setWizardOpen} />`
- Removed Wave 3 placeholder comments

## Zod v4 String-Refine Pattern (Deviation from Zod v3 docs)

Per Phase 3 SUMMARY: Zod v4.4.3 is installed. Do NOT use `z.coerce.number()` or `z.enum(keys, { errorMap })`.

Correct pattern (applied in this plan):
```typescript
// Numeric field:
nombreBroches: z.string().min(1, "Champ requis")
  .refine((v) => { const n = parseInt(v, 10); return Number.isInteger(n) && n >= 1; },
          "Le nombre de broches doit être d'au moins 1")

// Enum/select field (recipeId is a string ID):
recipeId: z.string().min(1, "Sélectionnez une recette")

// Parse in handler:
const nombreBroches = parseInt(nombreBrochesStr, 10) || 1;
```

## Lot Numbering Sequence Logic

```
existingTodayCount = finishedProducts.filter(fp => fp.dateProduction === today).length
// At confirm time (before mutations), captured from closure
for (let i = 0; i < nombreBroches; i++) {
  sequence = existingTodayCount + i + 1  // 1-based, per-day
  lot = generateLotNumber(new Date(), sequence)  // TK-YYYY-MMDD-NNN
}
```

Reading `finishedProducts` from the React closure (before mutation) ensures consistent sequencing within the confirm block even if `addFinishedProduct` updates the store mid-loop.

## DLC Calculation

```typescript
const dlcBroche = computeBrocheDlc(today);  // today ISO + 5 days UTC
// Applied to all N broches in the same production order (same DLC)
```

## Toast String (Locked)

```
"Production confirmée — {N} broches ({recipeName})"
```

Em-dash (` — `) with spaces matches Phase 3 pattern for `sonner` toast.success().

## Threat Model Coverage

- **T-04-03 (DoS — allocation useEffect loop):** Deps `[recipeId, nombreBroches, rawMaterials, selectedRecipe]` are all stable. `setAllocations` does not mutate any dep → no circular update possible. MITIGATED.
- **T-04-01 (Tampering — allocation inputs):** `handleAllocationChange` clamps to `Math.max(0, qty)` and rounds to 2 dp. Over-allocation passes through (by PRD design — user controls allocations). ACCEPTED.
- **T-04-02 (localStorage):** No change to persistence posture from Phase 2. ACCEPTED.

## Phase 5/7 Hand-off Notes

**Phase 5 (Livraisons):**
- `finishedProducts` with `statut: "en_stock"` are available immediately after wizard confirm
- `FinishedProduct.id` is a UUID — Phase 5 `Delivery.brochesLivrees` is `string[]` of these IDs
- Phase 5 will call `store.updateFinishedProduct(id, { statut: "livree", livraisonId })` on delivery

**Phase 7 (Traçabilité):**
- `ProductionOrder.matieresPremieresUtilisees[].rawMaterialId` links to raw material lot
- `ProductionOrder.brochesProduites[].numeroLotInterne` is the TK lot for forward tracing
- `ProductionOrder.recipeId` links to recipe for composition-level tracing

## Deviations from Plan

None — plan executed exactly as written. The implementation skeletons were used as specified; the only adjustment was compacting whitespace to stay within the 300-line cap (production-wizard.tsx: 228 lines vs plan estimate of ≤ 270, achieved by consolidating multi-line imports onto single lines and removing blank lines between function declarations).

## Known Stubs

None. All data flows from the Zustand store. FIFO defaults are computed from live `rawMaterials`. Lot numbers use real `generateLotNumber`. DLC uses real `computeBrocheDlc`. Store mutations are wired end-to-end.

## Threat Flags

No new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries introduced. All mutations are client-side Zustand state.

## Self-Check: PASSED

- `components/production/allocation-step.tsx` exists: FOUND (185 lines)
- `components/production/production-wizard.tsx` exists: FOUND (228 lines)
- `app/production/page.tsx` updated: FOUND (65 lines)
- Commit f2706bd (AllocationStep): FOUND
- Commit 34c44ed (ProductionWizard): FOUND
- Commit 265c364 (page update): FOUND
- `npx tsc --noEmit` exit 0: PASSED
- `npm run build` exit 0: PASSED
- All files <= 300 lines: PASSED
- No `: any` in new files: PASSED
- No TODO/FIXME/XXX in new files: PASSED
- Task 4 human-verify: AUTO-APPROVED (tsc + build both exit 0 per milestone policy)

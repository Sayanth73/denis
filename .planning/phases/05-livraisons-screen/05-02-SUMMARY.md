---
phase: 05-livraisons-screen
plan: "02"
subsystem: deliveries
tags: [table, route-page, alert-dialog, badges, hydration-guard, store-mutation]
dependency_graph:
  requires:
    - 05-01 (lib/deliveries.ts, shadcn alert-dialog)
  provides:
    - components/livraisons/deliveries-table.tsx
    - app/livraisons/page.tsx
  affects:
    - Wave 3 (05-03): NewDeliveryDialog mounts on the dialogOpen slot in page.tsx
    - Phase 6 (Clients): DeliveriesTable row data (formatDeliveryRow) may be referenced from client detail view
    - Phase 7 (Tracabilite): FinishedProduct.livraisonId set here is Phase 7's primary downstream link
    - Phase 8 (Dashboard): deliveries array now populated; KPI reads date range
tech_stack:
  added: []
  patterns:
    - "Hydration guard pattern (same as Phase 3 + Phase 4): returns disabled skeleton until hasHydrated"
    - "pendingDeliveryId lifted state: single AlertDialog at table level, opened by inline row button"
    - "useMemo on deliveries.reverse().map(formatDeliveryRow) to avoid recompute on each render"
    - "Atomic store mutation: updateFinishedProduct (statut+livraisonId) per broche then updateDelivery (statut)"
    - "dialogOpen slot pattern: page owns state, Wave 3 replaces {dialogOpen && null} comment with <NewDeliveryDialog>"
key_files:
  created:
    - components/livraisons/deliveries-table.tsx
    - app/livraisons/page.tsx
  modified: []
decisions:
  - "Single AlertDialog at table level with pendingDeliveryId state (not per-row) — avoids N dialog mounts"
  - "Page replaces PlaceholderPage entirely — route is now fully functional for read + mark-livree flows"
  - "dialogOpen && null placeholder preserves Wave 3 zero-diff page update pattern"
metrics:
  duration: "~8 minutes"
  completed: "2026-05-05"
  tasks_completed: 2
  tasks_total: 2
---

# Phase 05 Plan 02: Livraisons Route Page + DeliveriesTable Summary

**One-liner:** `/livraisons` route page with hydration guard + 6-column deliveries table with amber/emerald statut badges and AlertDialog "Marquer comme livrée" mutation flow.

## What Was Built

### Task 1: DeliveriesTable Component

Created `components/livraisons/deliveries-table.tsx` (190 lines, client component).

**Component contract:**

```typescript
type DeliveriesTableProps = {
  deliveries: Delivery[];
  finishedProducts: FinishedProduct[];
  customers: Customer[];
};
export function DeliveriesTable(props: DeliveriesTableProps): JSX.Element;
```

**Table columns (colgroup widths 13/24/11/14/14/24):**

| # | Header | Width | Notes |
|---|--------|-------|-------|
| 1 | Date | 13% | `whitespace-nowrap`, formatted via `formatDeliveryRow` |
| 2 | Client | 24% | `truncate max-w-0`, resolved from customerId |
| 3 | Nb broches | 11% | `text-right tabular-nums whitespace-nowrap` |
| 4 | Poids total | 14% | `text-right tabular-nums whitespace-nowrap`, `{value} kg` |
| 5 | Statut | 14% | Colored badge (amber/emerald) |
| 6 | Actions | 24% | "Marquer comme livrée" button for preparee rows; empty otherwise |

**Statut badge classes (locked per 05-UI-SPEC.md):**
- `preparee`: `bg-amber-50 border-amber-200 text-amber-800`
- `livree`: `bg-emerald-50 border-emerald-200 text-emerald-800`

**AlertDialog flow:**
- `pendingDeliveryId: string | null` state in table component
- Inline "Marquer comme livrée" button sets `pendingDeliveryId = row.id`
- Single `<AlertDialog open={pendingDeliveryId !== null}>` at component level
- Confirm handler: iterates `brochesLivrees`, calls `updateFinishedProduct(fpId, { statut: "livree", livraisonId })` per broche, then `updateDelivery(id, { statut: "livree" })`, fires toast, clears state

**Locked toast string:**
```
Livraison confirmée — {N} broche(s) livrée(s) à {clientName}
```
(em-dash with spaces, matching Phase 3/4 convention)

**Locked AlertDialog copy:**
- Title: `Confirmer la livraison`
- Body line 1: `Confirmez-vous la livraison de {N} broche(s) à {clientName} ?`
- Body line 2: `Cette action est irréversible. Les broches seront marquées comme livrées.`
- Cancel: `Annuler` | Confirm: `Confirmer`

### Task 2: /livraisons Route Page

Created `app/livraisons/page.tsx` (66 lines, client component). Replaces the Phase 1 `PlaceholderPage`.

**Hydration guard:** Until `hasHydrated` is true, renders a disabled-CTA skeleton (same pattern as `app/matieres-premieres/page.tsx` and `app/production/page.tsx`). Prevents empty-state flicker before Zustand persist middleware rehydrates localStorage.

**Render logic:**
- `deliveries.length === 0` → `<EmptyState icon={Truck} heading="Aucune livraison" ...>`
- Otherwise → `<DeliveriesTable deliveries={...} finishedProducts={...} customers={...} />`

**Dialog slot:** `dialogOpen` state defined. Wave 3 replaces `{dialogOpen && null}` with `<NewDeliveryDialog open={dialogOpen} onOpenChange={setDialogOpen} />` — no structural change to the page.

## Store Mutation Sequence on "Confirmer"

```
1. For each fpId in delivery.brochesLivrees:
   updateFinishedProduct(fpId, { statut: "livree", livraisonId: delivery.id })
2. updateDelivery(delivery.id, { statut: "livree" })
3. toast.success(`Livraison confirmée — ${N} broche(s) livrée(s) à ${clientName}`)
4. setPendingDeliveryId(null)  // closes AlertDialog
```

All 4 steps execute synchronously in a single event handler. No async operations.

## Phase Hand-off Notes

**For Wave 3 (05-03 — NewDeliveryDialog):**
- Import `NewDeliveryDialog` and replace `{dialogOpen && null}` in `app/livraisons/page.tsx` line 60
- Page already owns `dialogOpen`/`setDialogOpen` — no structural changes needed
- The "Préparer la livraison" toast (`Livraison préparée — {N} broche(s) pour {clientName}`) is Wave 3's responsibility

**For Phase 6 (Clients):**
- `formatDeliveryRow` returns `clientName` resolved from `customerId` — usable in client detail aggregations
- `Delivery.customerId` is the foreign key linking deliveries to clients

**For Phase 7 (Tracabilite):**
- `FinishedProduct.livraisonId` is set atomically on "Marquer comme livrée" confirm — this is the primary Phase 7 downstream link
- `Delivery.brochesLivrees` array is the inverse link

**For Phase 8 (Dashboard):**
- `deliveries` array is now populated with real data on "Préparer la livraison"
- KPI "Livraisons cette semaine" pattern: `deliveries.filter(d => d.date >= weekStart && d.statut === "livree")`

## Deviations from Plan

None — plan executed exactly as written.

## Threat Flags

None — no new network endpoints, auth paths, or file access patterns introduced. All mutations are client-side store operations on existing trust boundary (same posture as T-05-02/T-05-03 in plan threat register).

## Self-Check: PASSED

- `components/livraisons/deliveries-table.tsx` — FOUND (190 lines)
- `app/livraisons/page.tsx` — FOUND (66 lines)
- `export function DeliveriesTable` — VERIFIED
- `export default function LivraisonsPage` — VERIFIED
- AlertDialog present with locked French copy — VERIFIED
- `updateFinishedProduct` + `updateDelivery` calls — VERIFIED
- `Livraison confirmée` toast prefix — VERIFIED
- `STATUT_LIVRAISON_CLASSES` + `STATUT_LIVRAISON_LABELS` — VERIFIED
- No `:any` in either file — VERIFIED
- Both files ≤ 300 lines — VERIFIED (190, 66)
- `npx tsc --noEmit` — exit 0
- Task 1 commit `9d25b8a` — FOUND
- Task 2 commit `0febbbe` — FOUND

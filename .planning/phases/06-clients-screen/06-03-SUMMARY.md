---
phase: 06-clients-screen
plan: "03"
subsystem: clients-ui
tags: [react, zustand, next-link, shadcn, traceability, expansion-pattern]

requires:
  - phase: 06-01
    provides: "lib/clients.ts — getDeliveriesForCustomer, getBrochesForDelivery, getRawMaterialsForBroche"
  - phase: 06-02
    provides: "components/clients/ — ClientDialog, ClientsTable, app/clients/page.tsx"
  - phase: 05-livraisons-screen
    provides: "lib/deliveries.ts — getDeliveryWeight, STATUT_LIVRAISON_CLASSES, STATUT_LIVRAISON_LABELS"
  - phase: 03-matieres-premieres-screen
    provides: "lib/raw-materials.ts — TYPE_LABELS, formatDate; components/dlc-badge.tsx"
provides:
  - "app/clients/[id]/page.tsx — dynamic route detail page with useParams()"
  - "components/clients/broches-expansion.tsx — BrochesExpansion + UpstreamRMList nested expansion"
affects: [phase-07-tracabilite, phase-08-dashboard]

tech-stack:
  added: []
  patterns:
    - "two-level inline expansion: delivery → broches (expandedDeliveryId) → upstream RMs (expandedBrocheId)"
    - "useParams() id extraction with type narrowing for string | string[] | undefined"
    - "colSpan=4 TableCell with p-0 as expansion container inside shadcn Table"
    - "React.Fragment key pattern for conditional sibling rows in TableBody"

key-files:
  created:
    - app/clients/[id]/page.tsx
    - components/clients/broches-expansion.tsx
  modified: []

key-decisions:
  - "'use client' + useParams() for id — all data is Zustand client-side; no server fetch possible (locked decision)"
  - "UpstreamRMList kept private in broches-expansion.tsx — not exported; only BrochesExpansion is the public API"
  - "expandedBrocheId state lives in BrochesExpansion (not the page) — encapsulates broche toggle per delivery instance"
  - "expandedDeliveryId state lives in the page — only one delivery expanded at a time, collapses on second click"

patterns-established:
  - "Hydration guard: if (!hasHydrated) return <minimal back-link stub /> — same pattern as Phase 5"
  - "Not-found guard: if (!customer) return <text-sm error /> — graceful 404 for tampered/invalid ids"
  - "Nested table expansion via colSpan={4} + p-0 TableCell wrapping sub-component"

requirements-completed:
  - REQ-client-detail-history
  - REQ-empty-states

duration: "~3 minutes"
completed: "2026-05-05"
---

# Phase 6 Plan 3: Client Detail Page + Nested Expansion Summary

**`/clients/[id]` detail page with two-level inline expansion — delivery → broches (DlcBadge + lot numbers) → upstream raw material lots — completing the full traçabilité chain from client to supplier**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-05-05T06:54:37Z
- **Completed:** 2026-05-05T06:56:49Z
- **Tasks:** 2 (Task 3 auto-approved per milestone policy: tsc + build exit 0)
- **Files modified:** 2

## Accomplishments

- `BrochesExpansion` component renders `getBrochesForDelivery` results with `font-mono` lot numbers, `DlcBadge`, and "Voir matières premières" toggle; nested `UpstreamRMList` traces `getRawMaterialsForBroche` results with `TYPE_LABELS`, fournisseur, and `font-mono` lot numbers; `expandedBrocheId` state ensures only one broche expanded at a time
- `/clients/[id]` detail page reads `id` via `useParams()`, shows client info card (nom h2, adresse · telephone · email metadata), "Historique des livraisons" expansion list using `getDeliveriesForCustomer` (most-recent-first), EmptyState with Truck icon and "Aucune livraison" (no CTA), and `ChevronDown` toggle with `rotate-180` class when expanded
- `npx tsc --noEmit` and `npm run build` both exit 0; all files ≤ 300 lines, no `:any`, no `TODO/FIXME/XXX`

## BrochesExpansion Component Contract

**Props:**
```typescript
type BrochesExpansionProps = {
  delivery: Delivery;
  finishedProducts: FinishedProduct[];
  productionOrders: ProductionOrder[];
  rawMaterials: RawMaterial[];
};
export function BrochesExpansion(props: BrochesExpansionProps): JSX.Element;
```

**Expansion state pattern:**
```typescript
const [expandedBrocheId, setExpandedBrocheId] = React.useState<string | null>(null);
function toggleBroche(id: string) {
  setExpandedBrocheId((prev) => (prev === id ? null : id));
}
```

State lives in `BrochesExpansion` — encapsulated per delivery instance. Page does not own broche toggle state.

**UpstreamRMList trace path:**
```
broche.productionOrderId
  → productionOrders.find(o => o.id === broche.productionOrderId)
  → order.matieresPremieresUtilisees[{ rawMaterialId, quantiteUtilisee }]
  → rawMaterials.find(r => r.id === rawMaterialId)
  → TYPE_LABELS[rm.type], rm.fournisseur, rm.numeroLotFournisseur, quantiteUtilisee
```

Implemented via `getRawMaterialsForBroche` from `lib/clients.ts`. Returns `[]` safely if production order not found.

**Nested expansion row pattern:**
```tsx
<React.Fragment key={fp.id}>
  <TableRow>...</TableRow>
  {expandedBrocheId === fp.id && (
    <TableRow>
      <TableCell colSpan={4} className="p-0">
        <UpstreamRMList ... />
      </TableCell>
    </TableRow>
  )}
</React.Fragment>
```

`React.Fragment` with `key` avoids table structure violations. `colSpan={4}` + `p-0` lets the sub-component fill the full table width.

## Detail Page Structure

**useParams pattern:**
```typescript
const params = useParams();
const id =
  typeof params.id === "string"
    ? params.id
    : Array.isArray(params.id)
      ? params.id[0]
      : "";
```

**Hydration guard:** Returns a minimal back-link stub while `!hasHydrated` — prevents empty-state flicker during SSR.

**Not-found guard:** Returns `"Client introuvable."` when `customers.find(c => c.id === id)` returns `undefined`. Safe against tampered/invalid URL params (T-06-07 accepted per threat model).

**Delivery expansion state:** `expandedDeliveryId: string | null` in the page — only one delivery expanded at a time. Clicking an already-expanded delivery row collapses it.

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Build BrochesExpansion | edc5ebf | components/clients/broches-expansion.tsx (created, 188 lines) |
| 2 | Build /clients/[id] detail page | 93a4df7 | app/clients/[id]/page.tsx (created, 156 lines) |
| 3 | Human verify | auto-approved | tsc + build exit 0 |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. Both files are fully wired to Zustand store selectors with live data. No placeholder text or hardcoded empty values flow to UI rendering.

## Threat Flags

None. No new network endpoints, auth paths, file access patterns, or schema changes were introduced. Threat mitigations from the plan's STRIDE register:
- T-06-07: Invalid `id` from `useParams()` returns `undefined` from `customers.find()` → "Client introuvable." guard. No store mutation on the detail page.
- T-06-08: Detail page renders the same Zustand data accessible from other screens. No additional sensitive data exposed. POC demo posture.
- T-06-09: `getRawMaterialsForBroche` has safe `[]` fallback if production order not found. No mutation possible from the detail page.

## Phase 7 Hand-off Notes

**Phase 7 (Traçabilité):** The full traçabilité chain traced here (`broche.productionOrderId → matieresPremieresUtilisees → RawMaterial`) is the canonical implementation. Phase 7 upstream/downstream search should:
- Reuse or mirror `getRawMaterialsForBroche` from `lib/clients.ts` — it is the established pattern
- The `/clients/[id]` page demonstrates the exact trace path Phase 7 will generalize into a search surface

**Phase 8 (Dashboard):** The `customers` store selector pattern shown in this page (`useTraceabilityStore((s) => s.customers)`) is ready for aggregation in dashboard KPIs.

## Self-Check: PASSED

- FOUND: app/clients/[id]/page.tsx (156 lines)
- FOUND: components/clients/broches-expansion.tsx (188 lines)
- FOUND: commit edc5ebf (Task 1)
- FOUND: commit 93a4df7 (Task 2)
- `npx tsc --noEmit` exits 0
- `npm run build` exits 0

---
*Phase: 06-clients-screen*
*Completed: 2026-05-05*

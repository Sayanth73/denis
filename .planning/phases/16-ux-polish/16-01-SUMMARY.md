---
phase: 16-ux-polish
plan: 01
subsystem: ui
tags: [ux, search, delete-confirmation, date-format, client-side-filter]
dependency_graph:
  requires: []
  provides: [REQ-v4-dates-suisses, REQ-v4-delete-confirmation-client, REQ-v4-delete-confirmation-mp, REQ-v4-search-clients, REQ-v4-search-livraisons, REQ-v4-search-matieres]
  affects: [app/clients, app/livraisons, app/matieres-premieres, components/matieres]
tech_stack:
  added: []
  patterns: [AlertDialog-delete-guard, useMemo-client-side-filter, search-input-above-table]
key_files:
  created: []
  modified:
    - components/matieres/raw-materials-table.tsx
    - app/matieres-premieres/page.tsx
    - app/clients/page.tsx
    - app/livraisons/page.tsx
decisions:
  - AlertDialog pattern copied verbatim from clients-table.tsx for consistency
  - Search filter placed before table in dedicated div.mb-4 (not in header row)
  - useMemo hooks declared before hasHydrated early return to satisfy React rules-of-hooks
  - "Instead" pattern used for no-results (renders <p> instead of empty table border)
  - productionOrders guard checks po.matieresPremieresUtilisees array for RM references
metrics:
  duration: "~15 minutes"
  completed: "2026-05-05"
  tasks_completed: 3
  files_modified: 4
---

# Phase 16 Plan 01: UX Polish — Date Audit, Delete Confirmation, Search Inputs Summary

Six Phase 16 UX requirements delivered via four targeted file changes: date format audit (zero violations found), matières premières delete confirmation with production guard, and client-side search inputs on three pages.

## What Was Done

### Task 1: Date Format Audit (REQ-v4-dates-suisses + REQ-v4-delete-confirmation-client)

Ran grep audit across all app/ and components/ .tsx files for raw ISO date renders:

```
grep -rn "{(d|rm|f|po)\.(date|dateReception|dateFacture|datePaiement)}" app/ components/ --include="*.tsx"
```

Result: **zero violations**. All date renders in the codebase already pass through `formatDate()` (from `lib/raw-materials.ts`) or `DlcBadge`'s `formatDateJjMmAaaa()`. No file edits required.

Also confirmed: `components/clients/clients-table.tsx` already has a complete AlertDialog implementation for client deletion — REQ-v4-delete-confirmation-client is satisfied with no changes.

### Task 2: MP Delete Column + AlertDialog (REQ-v4-delete-confirmation-mp)

**`components/matieres/raw-materials-table.tsx`** — Extended from 187 lines to ~240 lines:

- Added imports: `Trash2` (lucide-react), `toast` (sonner), `ProductionOrder` (types), `Button`, `useTraceabilityStore`, AlertDialog subcomponents
- Extended props: `{ rows: RawMaterial[]; productionOrders: ProductionOrder[] }`
- Added `pendingDeleteId` state
- Added `handleTrashClick(rm)` — checks `productionOrders.some(po => po.matieresPremieresUtilisees.some(l => l.rawMaterialId === rm.id))`; fires `toast.error` if referenced, else sets `pendingDeleteId`
- Added `handleDelete()` — calls `deleteRawMaterial(pendingDeleteId)` + `toast.success`
- Added 8th column: `<col style={{ width: "6%" }} />` in colgroup, blank `<TableHead />` in header, `<TableCell>` with Trash2 ghost button per row
- Added AlertDialog after table div (pattern identical to clients-table.tsx)
- Adjusted COLUMNS widths to accommodate new column (dlc: 12% → 10%, statut: 10% → 6%)

**`app/matieres-premieres/page.tsx`** — Added `productionOrders` store selector, passed as prop to `<RawMaterialsTable>`.

### Task 3: Search Inputs on Three Pages (REQ-v4-search-clients, REQ-v4-search-livraisons, REQ-v4-search-matieres)

Same pattern applied to all three pages. Key implementation detail: `useMemo` and `useState` hooks declared **before** the `if (!hasHydrated)` early return to satisfy React rules-of-hooks.

**`app/clients/page.tsx`:**
- Filter: `c.nom.toLowerCase().includes(q)`
- No-results: shows `<p>Aucun résultat pour « {query} ».</p>` instead of empty ClientsTable

**`app/livraisons/page.tsx`:**
- Filter: `customerName.toLowerCase().includes(q) || d.date.includes(query)`
- ISO date substring search (e.g., "2026-05" shows May deliveries) uses raw `query` (not lowercased) since ISO dates are case-safe
- No-results: shows inline message instead of empty DeliveriesTable

**`app/matieres-premieres/page.tsx`:**
- Filter: `rm.nom.toLowerCase().includes(q) || rm.fournisseur.toLowerCase().includes(q)`
- No-results: shows inline message instead of empty RawMaterialsTable
- `isEmpty` tracks raw `rawMaterials.length === 0` (EmptyState only when store is truly empty)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None. No new network endpoints, auth paths, or trust boundaries introduced. All filtering is client-side in-memory. The T-16-03 threat (raw ISO dates in DOM) was verified mitigated by audit — zero violations found.

## Self-Check: PASSED

- [x] `components/matieres/raw-materials-table.tsx` exists and contains `pendingDeleteId`
- [x] `app/matieres-premieres/page.tsx` exists and contains `query`
- [x] `app/clients/page.tsx` exists and contains `query`
- [x] `app/livraisons/page.tsx` exists and contains `query`
- [x] Commit `89a2ebb` exists in git log
- [x] TypeScript: `npx tsc --noEmit` exits 0 with zero errors

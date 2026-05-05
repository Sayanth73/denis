# Phase 16: UX Polish — Dates suisses, confirmations, recherche - Context

**Gathered:** 2026-05-05
**Status:** Ready for planning
**Mode:** Auto-generated (autonomous smart discuss)

<domain>
## Phase Boundary

Phase 16 adds three categories of UX polish to the existing app:
1. Audit and confirm Swiss date format (DD.MM.YYYY) is used everywhere — formatDate already outputs this but two requirements are effectively pre-satisfied.
2. Add delete confirmation for matières premières (client delete is already implemented).
3. Add client-side search/filter inputs above the livraisons, clients, and matières premières tables.

No new routes, no new store actions beyond `deleteRawMaterial` (which already exists). Changes are additive to existing pages and components.

</domain>

<decisions>
## Implementation Decisions

### Date format audit
- `formatDate` in `lib/raw-materials.ts` already returns `DD.MM.YYYY` format (e.g., `05.05.2026`)
- `DlcBadge` has its own `formatDateJjMmAaaa` helper also returning `DD.MM.YYYY`
- All date displays in the app go through one of these two helpers
- Action: audit for any raw ISO date strings rendered to UI; fix if any found; confirm compliance by inspection

### Delete confirmations
- Client delete AlertDialog already fully implemented in `components/clients/clients-table.tsx` — no changes needed
- Matières premières: `raw-materials-table.tsx` has no delete button or action
- Add a "Supprimer" Trash2 icon button as a new rightmost column to `raw-materials-table.tsx`
- Add AlertDialog with same pattern as clients-table: `pendingDeleteId` state, `AlertDialogTitle` "Supprimer la matière première", description naming the item
- Deletion guard: if the raw material's `quantiteRestante < quantiteRecue` (i.e., it's been used in production), block deletion with a toast "Impossible de supprimer un lot déjà utilisé en production." — do not show the confirm dialog
- If `quantiteRestante === quantiteRecue` AND no ProductionOrder references `rawMaterialId === rm.id`: allow deletion via AlertDialog
- Actually simpler guard: check if any `productionOrders` reference this RM's `id` in their `lotsUtilises` — if yes, block. Otherwise allow with confirmation.
- Call `useTraceabilityStore.getState().deleteRawMaterial(id)` on confirm

### Search placement and styling
- Place a search `<Input>` above the table, in the page header row (same row as the CTA button) or between the header row and the table
- Use `placeholder="Rechercher..."` with a Search (lucide) icon prefix or just Input alone — use Input alone to stay consistent with existing simple inputs in the app
- Search state: `useState("")` local to the page component (not the table component) — pass filtered rows to table
- Filter is case-insensitive substring match

### Search — livraisons
- Filter target: customer name and date
- `customers.find(c => c.id === d.customerId)?.nom` for name, `d.date` (ISO) for date substring
- Show all deliveries when query is empty
- Place Input between header bar and table (not in header row since header is full-width flex justify-between)

### Search — clients  
- Filter target: `customer.nom` (case-insensitive)
- Pass filtered customers to `<ClientsTable>` component
- Place Input between header bar and table

### Search — matières premières
- Filter target: `rm.nom` and `rm.fournisseur` (case-insensitive, either field)
- Pass filtered rawMaterials to `<RawMaterialsTable>` component
- Place Input between header bar and table

### Claude's Discretion
- Exact column width for the new delete action column in raw-materials-table.tsx
- Whether to use a label "Supprimer" or icon-only button (follow clients-table pattern: icon-only with aria-label)
- Input width for search boxes (w-64 or w-72 — choose what fits the page layout)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `formatDate` from `lib/raw-materials.ts` — already returns `DD.MM.YYYY`
- AlertDialog pattern from `components/clients/clients-table.tsx` — copy verbatim for matières premières
- `deleteRawMaterial(id)` store action — already exists in `lib/store.ts`
- `Input` from `@/components/ui/input` — use for search boxes
- `productionOrders` from store — needed for deletion guard check

### Established Patterns
- Delete confirmation: `pendingDeleteId` state → set on Trash2 click → AlertDialog open={pendingDeleteId !== null} → on confirm call store action + toast
- Page layout: `<div className="flex items-center justify-between mb-6 h-9">` for header row; search input goes in a separate `<div className="mb-4">` block between header and table
- Filter pattern from `stock-broches/page.tsx`: `React.useMemo` to compute filtered list, pass to table component

### Integration Points
- `app/matieres-premieres/page.tsx` — add search state, filter rawMaterials, pass to RawMaterialsTable
- `components/matieres/raw-materials-table.tsx` — add delete column + AlertDialog
- `app/clients/page.tsx` — add search state, filter customers, pass to ClientsTable
- `app/livraisons/page.tsx` — add search state, filter deliveries, pass to DeliveriesTable

</code_context>

<specifics>
## Specific Ideas

- The client delete AlertDialog already says "Êtes-vous sûr de vouloir supprimer {nom} ? Cette action est irréversible." — use the same copy pattern for matières premières
- The matières premières deletion guard should check productionOrders for any reference to the RM id before showing the AlertDialog — show a toast error if blocked
- Search inputs should have a consistent placeholder: "Rechercher..." across all three pages
- For search in livraisons, matching on ISO date string (e.g., "2026-05") gives users a way to search by month, which is useful

</specifics>

<deferred>
## Deferred Ideas

- Per-column search in tables — overkill for current data volume
- Highlight matching text in search results — nice to have, not needed for POC
- Persist search state in URL params — unnecessary complexity

</deferred>

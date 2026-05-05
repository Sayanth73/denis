# Phase 11: Stock Broches Finies Screen - Context

**Gathered:** 2026-05-05
**Status:** Ready for planning
**Mode:** Auto-generated (full autonomy mode)

<domain>
## Phase Boundary

New route `/stock-broches` with sortable table of all FinishedProducts, filter chips by statut (Tous/En stock/Livrés), sidebar entry "Stock broches", and dashboard KPI card link update.

</domain>

<decisions>
## Implementation Decisions

### Route & Page
- New file: `app/stock-broches/page.tsx` — client component, reads from Zustand store
- Route: `/stock-broches` with optional `?statut=` query param
- Default filter: "En stock" (statut === "en_stock")

### Table Columns
- N° lot interne (font-mono), Recette (recipe.nom via getRecipeForBroche), Poids (kg, tabular-nums), DLC (DlcBadge), Statut (badge: "En stock" / "Livrée"), Client livré (customer.nom when statut=livree, "—" otherwise)
- Sortable by clicking column headers (same pattern as matieres-premieres table)

### Filter Chips
- Three chips above table: "Tous" | "En stock" | "Livrés"
- Use URL query param `?statut=` so browser back works
- Default: "En stock" when no param

### Sidebar Entry
- Icon: `BoxesIcon` from lucide-react (verify exact name: `Boxes`)
- Label: "Stock broches"
- Position: after "Matières premières" entry in lib/nav.ts
- Route: `/stock-broches`

### Dashboard KPI Link
- `components/dashboard/kpi-card.tsx` "Broches en stock" card — add `href="/stock-broches?statut=en_stock"` or wrap title in a Link
- Check how dashboard page renders KPI cards

### Empty State
- Copy: "Aucune broche en stock — lancez un ordre de fabrication"

### File Size Cap
- Max 300 lines per file. If page.tsx would exceed, split into `StockBrochesTable` component in `components/stock-broches/`

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/finished-products.ts` — `getRecipeForBroche(broche, productionOrders, recipes): Recipe | null` (Phase 10)
- `components/dlc-badge.tsx` — `DlcBadge` component for DLC display
- `components/empty-state.tsx` — `EmptyState` component
- `lib/raw-materials.ts` — `formatDate()` helper
- Pattern: `app/matieres-premieres/page.tsx` + sortable table — follow same structure
- `lib/nav.ts` — sidebar nav items array

### Established Patterns
- Store access: `useTraceabilityStore((s) => ({ finishedProducts: s.finishedProducts, ... }))`
- Sortable tables: local `sortKey`/`sortDir` state, `useMemo` for sorted array
- Filter: local state or URL param with `useSearchParams`
- shadcn Badge for statut display

### Integration Points
- `lib/nav.ts` — add new nav item
- `components/dashboard/kpi-card.tsx` or `app/dashboard/page.tsx` — update "Broches en stock" KPI link
- `app/stock-broches/page.tsx` — new route

</code_context>

<specifics>
## Specific Ideas

- Use `useSearchParams` for the `?statut=` filter param (requires `React.Suspense` wrapper per Next.js 14 App Router static build requirement)
- The `BoxesIcon` in lucide-react is named `Boxes` — verify before using

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>

# Plan 11-01: Stock Broches Finies Screen — Summary

## What Was Built

New `/stock-broches` route displaying all FinishedProducts in a sortable, filterable table. The page uses URL query params (`?statut=`) for filter state (Tous / En stock / Livrés, defaulting to En stock), local React state for sort key/direction, and resolves recipe names via `getRecipeForBroche` and customer names via delivery lookup. The table component was split into `components/stock-broches/stock-broches-table.tsx` to stay within the 300-line cap. The sidebar nav gained a "Stock broches" entry with the `Boxes` icon (added to `NavIconName` union and `NAV_ICONS` map). The dashboard "Broches en stock" KPI card now accepts an optional `href` prop and renders a Next.js `Link` wrapper when provided.

## Key Files

- `app/stock-broches/page.tsx` — client page with `useSearchParams` inside `React.Suspense`, filter chips, hydration guard
- `components/stock-broches/stock-broches-table.tsx` — sortable table with DlcBadge, statut Badge, customer resolution
- `lib/nav.ts` — added `"Boxes"` to `NavIconName` union + "Stock broches" nav item
- `lib/nav-icons.tsx` — added `Boxes` to `NAV_ICONS` record
- `components/dashboard/kpi-card.tsx` — added optional `href` prop with Link wrapping
- `app/page.tsx` — passed `href="/stock-broches"` to "Broches en stock" KpiCard

## Deviations from Plan

None — plan executed exactly as written. `lib/nav-icons.tsx` required an update alongside `lib/nav.ts` (Rule 2: correctness requirement for icon rendering); this was expected from the codebase pattern.

## Self-Check: PASSED

- [x] /stock-broches route exists (`app/stock-broches/page.tsx`)
- [x] Sidebar has Stock broches entry (`lib/nav.ts` + `lib/nav-icons.tsx`)
- [x] Table shows all FinishedProducts with filter chips (Tous / En stock / Livrés)
- [x] Dashboard KPI card links to /stock-broches
- [x] npx tsc --noEmit exits 0

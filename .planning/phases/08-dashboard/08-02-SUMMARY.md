---
phase: 08-dashboard
plan: "02"
subsystem: ui
tags: [dashboard, zustand, kpi, next.js, lucide, shadcn, react]

requires:
  - phase: 08-01
    provides: lib/dashboard.ts pure helpers (countActiveRMs, getAlertes, getRecentActivity, etc.) and shadcn Card primitive

provides:
  - app/page.tsx — full operational dashboard (hydration guard + 4 KPI cards + Alertes + Activité récente)
  - components/dashboard/kpi-card.tsx — presentational KPI card with label/value/subLabel/alert badge
  - components/dashboard/alertes-column.tsx — severity-dot alert list with empty state
  - components/dashboard/recent-activity-column.tsx — clickable Link activity rows with empty state

affects:
  - any phase that adds new event types to extend getRecentActivity streams
  - any phase adding new alert conditions to getAlertes

tech-stack:
  added: []
  patterns:
    - hydration-guard-before-zustand-hooks (render skeletons until hasHydrated)
    - presentational-component-with-prepared-data-props (KpiCard, AlertesColumn, RecentActivityColumn receive data, no store access)
    - responsive-kpi-grid (grid-cols-1 md:grid-cols-2 xl:grid-cols-4)

key-files:
  created:
    - components/dashboard/kpi-card.tsx
    - components/dashboard/alertes-column.tsx
    - components/dashboard/recent-activity-column.tsx
  modified:
    - app/page.tsx

key-decisions:
  - "KpiCard is a server component (no use client) — pure presentational, no hooks"
  - "AlertesColumn is a server component — data passed as props, severity rendered via cn()"
  - "RecentActivityColumn is use client — formatRelativeDate uses date-fns formatDistanceToNow (browser Date)"
  - "app/page.tsx is use client — required for Zustand store subscriptions"
  - "Hydration guard shows 4 animated skeleton cards until hasHydrated, then renders live data"

patterns-established:
  - "Dashboard components: receive typed props from page, no direct Zustand access"
  - "Severity dots: bg-red-500 for critical, bg-amber-400 for warning"
  - "KPI DLC badge: inline red badge (bg-red-100 text-red-700 border-red-200) on KPI card when alertingDLCCount > 0"

requirements-completed:
  - REQ-dashboard

duration: ~12 min
completed: 2026-05-05
---

# Phase 8 Plan 02: Dashboard UI Summary

**Full operational dashboard at `/` — 4 KPI cards with French locked labels, DLC alert badge, severity-dot Alertes column, and clickable-Link Activité récente column, all driven by Zustand store subscriptions with hydration guard.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-05-05T07:00:00Z
- **Completed:** 2026-05-05T07:12:00Z
- **Tasks:** 2 (+ 1 auto-approved human-verify checkpoint)
- **Files modified:** 4

## Accomplishments

- Replaced Phase 1 placeholder at `/` with full live dashboard
- 4 KPI cards in responsive grid (1 col → 2 col → 4 col) with locked French copy and computed values from Zustand store
- AlertesColumn with red/amber severity dots and ShieldCheck empty state ("Tout va bien / Aucune alerte en cours.")
- RecentActivityColumn with Package/Factory/Truck icon rows, French relative timestamps via `formatRelativeDate`, and Activity empty state
- Hydration skeleton guard prevents flash of empty content before localStorage rehydrates

## Task Commits

Each task was committed atomically:

1. **Task 1: Build KpiCard, AlertesColumn, RecentActivityColumn components** - `f0394d1` (feat)
2. **Task 2: Replace app/page.tsx with the full dashboard page** - `c832e66` (feat)

**Plan metadata:** (this SUMMARY commit — docs)

## Files Created/Modified

- `components/dashboard/kpi-card.tsx` — Presentational card: label (uppercase muted), large bold value, optional red alert badge, sub-label
- `components/dashboard/alertes-column.tsx` — Severity-dot list (critical=red, warning=amber); EmptyState with ShieldCheck when items=[]
- `components/dashboard/recent-activity-column.tsx` — Link rows with Lucide icon + title + `formatRelativeDate`; EmptyState with Activity icon when items=[]
- `app/page.tsx` — Replaced placeholder; subscribes to 6 Zustand collections + hasHydrated; hydration guard; calls all KPI helpers + getAlertes + getRecentActivity; renders KPI grid + lower 2-col grid

## Decisions Made

- `KpiCard` and `AlertesColumn` are not marked `"use client"` — they are pure presentational components receiving props, no hooks. Next.js 14 allows them as server components in the App Router.
- `RecentActivityColumn` requires `"use client"` because `formatRelativeDate` calls `formatDistanceToNow` which depends on browser `Date.now()`.
- `app/page.tsx` requires `"use client"` for Zustand hooks.
- Hydration skeleton renders 4 `animate-pulse` Card skeletons (matching KPI card shape) — consistent with Phase 3/4/5/6 pattern.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

The `npm run build` output showed `[tracekebab] rehydration failed, clearing corrupt persisted state TypeError: r.getItem is not a function` warnings during static page generation. This is expected behavior: Next.js static generation runs in Node.js where `localStorage` is unavailable. The Zustand persist middleware catches this gracefully and `hasHydrated` remains `false`, which triggers the hydration guard skeleton. The build completed with exit 0 and all 10 pages generated successfully.

## Known Stubs

None — all KPI values, alert items, and activity items are computed from live Zustand store data (or seed data on first load).

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes introduced. Dashboard reads client-side Zustand state only. Link hrefs are string literals from `getRecentActivity` (e.g., `/matieres-premieres`), not user-controlled.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Dashboard is complete and fully operational
- KPI values update reactively as the user adds/edits data on other screens
- To extend: add new alert conditions to `getAlertes` in `lib/dashboard.ts`, or new event types to `getRecentActivity`
- No blockers

## Self-Check: PASSED

- `components/dashboard/kpi-card.tsx`: FOUND, contains KpiCard, 31 lines (≤ 60 cap)
- `components/dashboard/alertes-column.tsx`: FOUND, contains AlertesColumn, ShieldCheck, "Tout va bien", "Aucune alerte en cours.", severity critical logic
- `components/dashboard/recent-activity-column.tsx`: FOUND, contains RecentActivityColumn, formatRelativeDate, "Aucune activité", Link rows
- `app/page.tsx`: FOUND, "use client", useTraceabilityStore, hasHydrated, all 4 KPI labels, all 4 sub-label templates, KpiCard/AlertesColumn/RecentActivityColumn, 98 lines (≤ 120 cap)
- commit `f0394d1` (Task 1): FOUND
- commit `c832e66` (Task 2): FOUND
- `npx tsc --noEmit`: exit 0
- `npm run build`: exit 0 (10/10 pages generated)

---

*Phase: 08-dashboard*
*Completed: 2026-05-05*

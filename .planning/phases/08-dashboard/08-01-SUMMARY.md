---
phase: 08-dashboard
plan: "01"
subsystem: dashboard-data-layer
tags: [pure-helpers, kpi, dashboard, date-fns, typescript]
dependency_graph:
  requires: []
  provides: [lib/dashboard.ts, components/ui/card.tsx]
  affects: [app/page.tsx]
tech_stack:
  added: [shadcn/card]
  patterns: [pure-function-data-layer, ISO-week-Monday-start, date-fns-fr-locale]
key_files:
  created:
    - lib/dashboard.ts
    - components/ui/card.tsx
  modified: []
decisions:
  - "Low stock threshold locked at < 5 kg quantiteRestante"
  - "Stale broche threshold locked at en_stock + dateProduction > 3 days ago"
  - "DLC alert threshold locked at DLC within 3 calendar days of today"
  - "ISO week uses Monday start via date-fns startOfWeek({ weekStartsOn: 1 })"
  - "getAlertes deduplication: RM in DLC alert is excluded from low-stock alert"
  - "ActivityItem.iconName uses string union Package | Factory | Truck (Lucide icon names)"
metrics:
  duration: "~10 minutes"
  completed: "2026-05-05"
  tasks_completed: 2
  tasks_total: 2
---

# Phase 8 Plan 01: Dashboard Data Layer Summary

Pure KPI, alertes, and activity helpers in `lib/dashboard.ts` with shadcn card primitive installed.

## What Was Built

### Task 1: shadcn card primitive installed

`components/ui/card.tsx` installed via `npx shadcn add card --yes`. Exports: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`. Required by the dashboard page layout in Wave 2.

### Task 2: lib/dashboard.ts — pure helpers module

All 10 named exports implemented. No React. No Zustand. No side effects.

## Exported Functions

| Function | Signature | Description |
|----------|-----------|-------------|
| `countActiveRMs` | `(rms: RawMaterial[]) => number` | Count RMs with quantiteRestante > 0 |
| `countAlertingDLCs` | `(rms, today, daysWindow=3) => number` | Count active RMs with DLC within 3 days |
| `countBrochesEnStock` | `(fps: FinishedProduct[]) => number` | Count FPs with statut === "en_stock" |
| `sumBrochesWeight` | `(fps: FinishedProduct[]) => number` | Sum poids for en_stock FPs |
| `countProducedThisWeek` | `(fps, today) => number` | FPs produced in current ISO week |
| `countDeliveriesThisWeek` | `(deliveries, today) => number` | Deliveries in current ISO week |
| `countBrochesLivreesThisWeek` | `(deliveries, today) => number` | Total brochesLivrees count in current ISO week |
| `getAlertes` | `(state, today) => AlerteItem[]` | Merged sorted alert list |
| `getRecentActivity` | `(state, n=5) => ActivityItem[]` | Merged activity timeline, n most recent |
| `formatRelativeDate` | `(iso: string) => string` | French relative date (date-fns fr locale) |

## Exported Types

```typescript
type AlerteItem = {
  id: string;
  severity: "critical" | "warning";
  message: string;
  href?: string;
};

type ActivityItem = {
  id: string;
  iconName: "Package" | "Factory" | "Truck"; // Lucide icon names for Wave 2 components
  title: string;
  date: string; // ISO date YYYY-MM-DD
  href: string;
};
```

## Locked Thresholds

| Threshold | Value | Used In |
|-----------|-------|---------|
| Low stock | `quantiteRestante < 5 kg` | `getAlertes` — low-stock branch |
| Stale broche | `en_stock && dateProduction > today - 3 days` | `getAlertes` — stale-broche branch |
| DLC alert | `DLC within 3 calendar days of today` | `countAlertingDLCs`, `getAlertes` — DLC-near branch |
| ISO week | Monday start `{ weekStartsOn: 1 }` | `countProducedThisWeek`, `countDeliveriesThisWeek`, `countBrochesLivreesThisWeek` |

## Alert Logic Details

`getAlertes` produces three alert categories merged and sorted:

1. **DLC-near (critical/warning):** Active RMs (quantiteRestante > 0) with DLC < today + 3 days. `critical` if < 2 days remaining, `warning` if 2-3 days.
2. **Low-stock (warning):** Active RMs with quantiteRestante < 5 kg, **skipped if already in a DLC alert** (deduplication).
3. **Stale-broche (warning):** FPs with statut === "en_stock" and dateProduction > 3 days ago.

Sort order: critical first, then warning; within each severity lexicographic by message (French locale).

## Activity Stream Format

`getRecentActivity` merges three streams:
- **Reception:** `"Réception — {nom} ({fournisseur})"` — icon `Package` — href `/matieres-premieres`
- **Production:** `"Production — {N} broche(s) ({recipeName})"` — icon `Factory` — href `/production`
- **Livraison:** `"Livraison — {N} broche(s) → {customerName}"` — icon `Truck` — href `/livraisons`

Sorted by `date` (ISO string, descending). Capped to `n` items (default 5).

## Deviations from Plan

None — plan executed exactly as written.

## Threat Flags

None — no new network endpoints, auth paths, or trust boundary changes introduced. Library is pure client-side data transformation.

## Self-Check: PASSED

- `components/ui/card.tsx`: FOUND
- `lib/dashboard.ts`: FOUND
- commit `542c170` (chore — shadcn card): FOUND
- commit `981907d` (feat — dashboard.ts): FOUND
- `npx tsc --noEmit`: exit 0
- All 10 exports verified: PASSED
- No React/Zustand imports: PASSED

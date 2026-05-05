---
phase: 04-production-screen
plan: "02"
subsystem: production-ui
tags: [production, tabs, recipes, orders, hydration-guard]
dependency_graph:
  requires: [04-01-SUMMARY, 03-01-SUMMARY]
  provides: [app/production/page.tsx, components/production/recettes-tab.tsx, components/production/ordre-fabrication-table.tsx]
  affects: [04-03-PLAN]
tech_stack:
  added: []
  patterns: ["client component with hydration guard", "separate useTraceabilityStore calls per slice", "lookup maps for display"]
key_files:
  created:
    - components/production/recettes-tab.tsx
    - components/production/ordre-fabrication-table.tsx
  modified:
    - app/production/page.tsx
decisions:
  - "wizardOpen state lives in ProductionPage; Wave 3 inserts <ProductionWizard open={wizardOpen} onClose={() => setWizardOpen(false)} /> below the Tabs block and removes the {wizardOpen && null} placeholder"
  - "onOpenWizard prop on OrdreFabricationTable keeps the component decoupled — it calls setWizardOpen(true) via callback, not direct state access"
  - "Fragment root on ProductionPage to avoid double-padding with layout.tsx <main className=px-6 py-6>"
  - "Four separate useTraceabilityStore calls (one per slice) replicates Phase 3 pattern to avoid useShallow"
metrics:
  duration: 200s
  completed_date: "2026-05-05"
  tasks_completed: 3
  tasks_total: 3
---

# Phase 4 Plan 02: /production Route — Tabs, Recettes Cards, Orders Table Summary

**One-liner:** /production route wired with Recettes read-only cards and Ordres de fabrication 5-column table behind a two-tab layout with hydration guard and CTA state hand-off for Wave 3 wizard.

## What Was Built

### Task 1: RecettesTab read-only recipe card list (commit c593a62)

`components/production/recettes-tab.tsx` — 39-line client component.

**Contract:**
```typescript
type RecettesTabProps = { recipes: Recipe[] };
export function RecettesTab(props: RecettesTabProps): JSX.Element;
```

- Recipe cards: `rounded-md border bg-background p-4` (no shadow-sm per spec)
- Card header: recipe name `text-sm font-semibold text-foreground`, weight `text-sm text-muted-foreground tabular-nums`
- Separator: plain `<div className="border-t border-border my-3">` (avoids shadcn Separator import)
- Ingredient rows: `space-y-1.5`, label via `TYPE_LABELS[typeMatiere]`, percentage `tabular-nums`
- No create/edit/delete affordances (DEC-recipe-readonly)

### Task 2: OrdreFabricationTable 5-column table with EmptyState (commit 47b38a9)

`components/production/ordre-fabrication-table.tsx` — 114-line client component.

**Contract:**
```typescript
type OrdreFabricationTableProps = {
  orders: ProductionOrder[];
  recipes: Recipe[];
  rawMaterials: RawMaterial[];
  onOpenWizard: () => void;
};
export function OrdreFabricationTable(props: OrdreFabricationTableProps): JSX.Element;
```

- Empty state: `Factory` icon, heading `"Aucun ordre de fabrication"`, body `"Créez votre premier ordre pour commencer la production."`, CTA `"+ Nouvel ordre de fabrication"` calling `onOpenWizard`
- 5-column table with `colgroup` widths: 14/26/12/16/32 %
- Header: `bg-zinc-50`, `text-sm font-medium text-muted-foreground py-3 px-3 border-b`
- Data rows: `border-b border-border hover:bg-zinc-50 min-h-9`
- Date: `formatDate(order.date)` → JJ.MM.AAAA
- Poids total: `recipe.poidsTotal × nombreBroches` kg
- Lots consommés: `numeroLotFournisseur` values, comma-separated, `font-mono`
- Numeric columns: `tabular-nums whitespace-nowrap text-right`

### Task 3: ProductionPage route — tabs, CTA, hydration guard (commit 8fc0434)

`app/production/page.tsx` — 66-line client component. Replaces Phase 1 PlaceholderPage.

- Fragment (`<>`) root — no double-padding with layout.tsx
- Page header: `flex items-center justify-between mb-6 h-9`, empty left div, CTA flush right
- CTA: `Button` default variant, `gap-2`, `Plus size={16}`, label `"+ Nouvel ordre de fabrication"`
- Hydration guard: `if (!hasHydrated)` returns disabled skeleton CTA shape
- Four separate `useTraceabilityStore` calls (recipes, productionOrders, rawMaterials, hasHydrated)
- `<Tabs defaultValue="recettes">`: Recettes active by default
- `TabsList className="mb-4"`: 16 px gap between tab list and panel
- `{wizardOpen && null}` placeholder consumed by Wave 3

## Wave 3 Hand-off Contract

Wave 3 (04-03-PLAN.md) inserts `<ProductionWizard>` into `app/production/page.tsx`:

1. **Where to insert:** Below the closing `</Tabs>` tag, before the closing `</>`
2. **State available:** `wizardOpen` (boolean) and `setWizardOpen` (dispatch) are already declared in `ProductionPage`
3. **Import to add:** `import { ProductionWizard } from "@/components/production/production-wizard"`
4. **Replace:** Remove `{wizardOpen && null}` and replace with `<ProductionWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />`
5. **onOpenWizard prop:** `OrdreFabricationTable` already receives `onOpenWizard={() => setWizardOpen(true)}` — no changes needed to that component

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. All data is wired from the Zustand store via `useTraceabilityStore`. The `{wizardOpen && null}` line is an intentional placeholder documented in the Wave 3 hand-off contract above, not a data stub.

## Threat Flags

No new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries introduced. Pure client-side rendering components consuming existing store state.

## Self-Check: PASSED

- `app/production/page.tsx` exists: FOUND
- `components/production/recettes-tab.tsx` exists: FOUND
- `components/production/ordre-fabrication-table.tsx` exists: FOUND
- Commit c593a62 exists: FOUND
- Commit 47b38a9 exists: FOUND
- Commit 8fc0434 exists: FOUND
- `PlaceholderPage` import absent from page.tsx: PASSED
- All files <= 300 lines (66, 39, 114): PASSED
- No `: any` in any file: PASSED
- No TODO/FIXME/XXX in any file: PASSED
- `npx tsc --noEmit` exit 0: PASSED
- `npm run build` exit 0: PASSED

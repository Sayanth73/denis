# Phase 10: Broche Recipe Display - Context

**Gathered:** 2026-05-05
**Status:** Ready for planning
**Mode:** Auto-generated (full autonomy mode)

<domain>
## Phase Boundary

Add `getRecipeForBroche(broche, productionOrders, recipes)` helper in `lib/finished-products.ts` and surface the recipe name in every component where a broche appears but the recipe is currently missing: new-delivery-dialog checkbox rows, broches-expansion table (client detail), and tracabilite-upstream Section 3 "Clients impactés".

Note: `tracabilite-downstream.tsx` already resolves and shows recipe name via `getRecipeForOrder()` — no change needed there.

</domain>

<decisions>
## Implementation Decisions

### Helper Location
- New file `lib/finished-products.ts` — exports `getRecipeForBroche(broche: FinishedProduct, productionOrders: ProductionOrder[], recipes: Recipe[]): Recipe | null`
- Chain: `broche.productionOrderId → order.recipeId → recipe`

### Delivery Dialog Label
- Current: `[lot number] — [poids] kg — DLC [badge]`
- New: `[lot number] — [recipe.nom] — [poids] kg — DLC [badge]`
- Recipe resolved at render time from store's productionOrders + recipes

### BrochesExpansion Table
- Add "Recette" column between "N° lot interne" and "Poids"
- colgroup widths adjust to accommodate new column (5 cols total)
- `BrochesExpansionProps` receives `recipes: Recipe[]` — caller (clients detail page) must pass it

### TracabiliteUpstream Section 3
- "Clients impactés" table currently shows: Client | Date livraison | Lots livrés
- Add recipe name per broche lot in "Lots livrés" cell: `[lot] — [recipe name]`
- `TracabiliteUpstreamProps` already has `recipes: Recipe[]` — can use directly
- Resolve recipe per broche: `broche.productionOrderId → order.recipeId → recipe`

### Claude's Discretion
- Exact formatting of recipe name in delivery dialog: use dash separator consistent with existing style
- Column width adjustments in broches-expansion

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/tracabilite.ts` has `getRecipeForOrder(broche, productionOrders, recipes)` returning `{ order, recipe } | null` — can use similar pattern
- `DlcBadge` component from `@/components/dlc-badge`
- Store provides `productionOrders`, `recipes`, `finishedProducts` from `useTraceabilityStore`

### Established Patterns
- Pure helper functions in `lib/*.ts` with no React/Zustand dependencies
- Props drilling: components receive typed arrays, no direct store access inside components
- `colgroup` used for table column widths

### Integration Points
- `components/livraisons/new-delivery-dialog.tsx` line ~213: broche label — needs recipe name inserted
- `components/clients/broches-expansion.tsx`: BrochesExpansionProps needs `recipes` prop + new column
- Caller of BrochesExpansion: check `app/clients/[id]/page.tsx` for prop passing
- `components/tracabilite/tracabilite-upstream.tsx` Section 3 "Lots livrés" cell needs recipe name per broche

</code_context>

<specifics>
## Specific Ideas

- In delivery dialog, recipe name helps user confirm they're selecting the right broche type
- In broches-expansion, recipe name disambiguates when multiple broches have same weight
- Keep font-mono only on lot numbers; recipe name in normal text

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

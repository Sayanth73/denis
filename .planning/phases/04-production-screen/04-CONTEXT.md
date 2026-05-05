# Phase 4: Production Screen - Context

**Gathered:** 2026-05-05
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

The user can view recipes and production orders, and create a new production order through a 3-step wizard that proposes FIFO lot allocation and produces broches with valid internal lot numbers.

**Requirements covered:** REQ-recipes-readonly, REQ-production-orders-list, REQ-production-wizard

**Success criteria (from ROADMAP §Phase 4):**
1. `/production` shows two tabs: "Recettes" (read-only, 3 seeded recipes, composition sums to 100%) and "Ordres de fabrication" (table: Date, Recette, Nombre de broches, Poids total, Lots consommés).
2. New production order opens Step 1 → Step 2 → Step 3 wizard. Step 2 shows per-ingredient lot allocation (lots sorted by DLC asc, splittable across lots, real-time "manquant : X kg" indicator). Step 3 shows récapitulatif with "Confirmer la production".
3. On confirmation: decrement `quantiteRestante` on consumed lots, create N `FinishedProduct` broches with `TK-AAAA-MMJJ-NNN` lot numbers and `dlc = productionDate + 5 days`, persist `ProductionOrder` linking inputs to outputs.
4. Success toast with link to traçabilité view (link may be placeholder until Phase 7).
5. After refresh: new production order persists in tab; matières premières quantities reflect decrements.

</domain>

<decisions>
## Implementation Decisions

### Locked from PRD / earlier phases
- Stack: Next.js App Router + Tailwind + shadcn/ui + Zustand + react-hook-form + zod (already installed Phase 1–3).
- Locale: French only, sober B2B aesthetic (Linear/Notion/Vercel reference).
- File-size cap: 300 lines per source file (DEC-file-size-cap).
- No tests (POC) but type-clean and `npm run build` must succeed.
- Lot number generator already exists at `lib/store.ts` `generateLotNumber()` (Phase 2) — REUSE it; do not re-derive.
- Date helpers, dlc bucket, DlcBadge, EmptyState already shipped Phase 3 — REUSE.
- Toasts via `sonner` (Phase 1).
- Persist via Zustand `persist` middleware (Phase 2).
- Internal lot format: `TK-AAAA-MMJJ-NNN` where NNN is the per-day broche counter (1-based, padded to 3 digits).

### Claude's Discretion
All implementation choices not locked above are at Claude's discretion. Use ROADMAP phase goal, success criteria, REQUIREMENTS.md, PRD §5/§6, and existing codebase conventions to guide:
- Tab component selection (shadcn Tabs).
- Wizard component approach (single-page Dialog with step state, not separate routes).
- Form library: react-hook-form + zod (consistent with Phase 3).
- Step 2 FIFO algorithm: pure function in `lib/production.ts`. Greedy FIFO — fill from earliest-DLC lot first, splitting across lots until quantity satisfied or shortage shown.

</decisions>

<code_context>
## Existing Code Insights

Codebase facts to honor (verify in plan-phase research):
- `lib/store.ts` exports `useTraceabilityStore` with: `rawMaterials`, `recipes`, `productionOrders`, `finishedProducts`, `customers`, `deliveries`, `hasHydrated`. Actions include `addRawMaterial`, `updateRawMaterial`, plus expected `addProductionOrder`, `addFinishedProducts` (or similar) and helpers like `generateLotNumber`.
- Phase 2 SUMMARY: store also persists with `persist` middleware. Zustand state should be mutated via the store actions only.
- Phase 3 SUMMARY: dialog open-state is parent-owned (page owns `open` / `onOpenChange`). Reuse this pattern for the wizard dialog.
- shadcn primitives installed Phase 3: Dialog, Button, Input, Select, Form, Table, Combobox, DatePicker. Tabs may need to be added if not present.
- Locked French copy lives in inline strings (Phase 2/3 convention — no i18n).

</code_context>

<specifics>
## Specific Ideas

- Wizard implementation: single Dialog with internal `step` state (1|2|3) and per-step views; Back/Next buttons in DialogFooter; final step Confirm calls all store mutations atomically.
- Step 2 lot allocation editor: per-ingredient block listing eligible lots (sorted by DLC asc); each row has a number input for `quantitéAllouée`; running total per ingredient + "manquant : X kg" badge when sum < required. Pre-fill greedy FIFO defaults.
- Lot-number generator: rely on existing `generateLotNumber(productionDate)` if it exists; otherwise derive `TK-{YYYY}-{MMDD}-{NNN}` where `NNN` is `existingFinishedProducts.filter(fp => fp.dateProduction === today).length + 1`, padded.
- Recipes tab is read-only — no buttons.
- "Ordres de fabrication" tab: shadcn Table with the 5 columns from success criteria; empty state when `productionOrders.length === 0`.
- Page uses the same hydration guard pattern as `/matieres-premieres`.

</specifics>

<deferred>
## Deferred Ideas

- Production traçabilité link target — placeholder until Phase 7 wires `/tracabilite?lot={lotNumber}`.
- No tests in this phase (POC milestone policy).

</deferred>

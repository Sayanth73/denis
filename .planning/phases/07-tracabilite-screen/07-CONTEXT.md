# Phase 7: Traçabilité Screen - Context

**Gathered:** 2026-05-05
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

Killer feature. The user can search by either a supplier lot number or an internal broche lot number and immediately see the entire chain upstream-or-downstream in a polished three-section view, exportable as PDF.

**Requirements:** REQ-tracabilite-search, REQ-tracabilite-upstream, REQ-tracabilite-downstream, REQ-tracabilite-pdf-export.

**Success criteria (ROADMAP §Phase 7):**
1. `/tracabilite` shows a prominent search bar with placeholder "Rechercher un numéro de lot (matière première ou broche finie)..." plus two shortcut buttons that pre-fill a seeded supplier lot and a seeded internal broche lot.
2. Cas 1 (supplier lot input) → three vertically stacked sections with visual connectors: (1) Matière première card (fournisseur, certificat sanitaire, dates, température); (2) Ordres de fabrication concernés (quantity used per order); (3) Clients impactés (delivery date + n° lot interne).
3. Cas 2 (internal broche lot input) → three sections: (1) Broche finie card (n° lot interne, date production, poids, DLC, client livré + date livraison); (2) Ordre de fabrication with recipe used; (3) Matières premières utilisées (every contributing supplier lot).
4. Both result views show "Exporter dossier traçabilité (PDF)" button top-right; click generates PDF (`react-to-print` or `jsPDF`) with the same info as on-screen.
5. Unknown lot → contextual empty state "Aucun lot trouvé pour ce numéro".

</domain>

<decisions>
## Implementation Decisions

### Locked
- Stack as before. POC; output not visually polished but content-complete (PRD §5).
- This is "the screen that sells" — apply highest UX polish: typography hierarchy, generous spacing, clear connectors between sections (vertical line + arrow icons).
- PDF: use `react-to-print` (lighter dependency than jsPDF; renders the on-screen DOM tree as a printable view in a new window). Install via `npm install react-to-print`.
- Search: instant submission on Enter or click; no debounce needed for POC scale.
- URL search params: `?lot={value}` — clicking a "Voir traçabilité" link from elsewhere (Phase 4 production toast, Phase 5 deliveries, Phase 6 client detail) navigates here pre-populated.
- Lot type detection: simple regex. Internal broche lots match `^TK-\d{4}-\d{4}-\d{3}$`. Anything else is treated as a supplier lot string match.
- If both interpretations match, prefer the internal broche match (more specific).

### Claude's Discretion
- Layout: search section pinned at top with two shortcut chips. Below, the result rendering region.
- Three-section view uses card primitives + a vertical line on the left as a connector with arrow chevrons indicating flow direction (upstream Cas 1: arrows down; downstream Cas 2: arrows down — "from broche to materials" still reads top-to-bottom).
- For Cas 1, since multiple production orders may use the same supplier lot, render as a list within the section.
- For Cas 1 Section 3 (Clients impactés), aggregate broches by client+delivery; show client name, delivery date, list of broche lot numbers.
- For Cas 2 Section 3 (Matières premières utilisées), each contributing RM lot is shown with `quantiteUtilisee` (kg) consumed in the production order.
- Empty state: `<EmptyState icon={SearchX} heading="Aucun lot trouvé pour ce numéro" body="Vérifiez le format ou essayez un des exemples ci-dessus." />`. Initial empty state (before any search): `<EmptyState icon={Search} heading="Lancez une recherche" body="Saisissez un numéro de lot ou utilisez un des exemples." />`.

</decisions>

<code_context>
## Existing Code Insights

- `lib/clients.ts` has `getRawMaterialsForBroche` — useful reference but Phase 7 needs the inverse (find broches that came from a given supplier lot) and aggregation by client.
- `lib/store.ts` exposes everything needed: rawMaterials, productionOrders, finishedProducts, customers, deliveries.
- Internal lot regex from `lib/lot-number.ts`: format `TK-AAAA-MMJJ-NNN`.
- DLC badges exist in `components/dlc-badge.tsx`.
- Page-level "use client" + hydration guard pattern.

</code_context>

<specifics>
## Specific Ideas

- Pure helpers in `lib/tracabilite.ts`:
  - `detectLotType(input: string): "broche" | "supplier" | null` — regex-based.
  - `findSupplierLot(input, rms): RawMaterial | null` — match by `numeroLotFournisseur`.
  - `findBroche(input, finishedProducts): FinishedProduct | null` — match by `numeroLotInterne`.
  - `getProductionOrdersForRm(rmId, productionOrders): { order: ProductionOrder; quantiteUtilisee: number }[]`.
  - `getClientsImpactes(rmId, productionOrders, finishedProducts, deliveries, customers): { customer: Customer; delivery: Delivery; broches: FinishedProduct[] }[]`.
  - `getRecipeForOrder(orderId, productionOrders, recipes): { order: ProductionOrder; recipe: Recipe } | null`.
  - `getRMsForBroche(brocheId, ...)` — already in `lib/clients.ts` — reuse.
- Search bar: shadcn Input + Search icon prefix + Submit button. Two shortcut buttons below: "Exemple — N° fournisseur" and "Exemple — N° broche interne". Pre-fill values from the seeded data (read from store on mount, pick first lot of each type).
- Result rendering: `<TracabiliteUpstream rm={...} />` for Cas 1, `<TracabiliteDownstream broche={...} />` for Cas 2. Both render a `<TracabilitePrintable ref={...} />` wrapper that the PDF button targets via `react-to-print`.
- "Exporter PDF" button uses `useReactToPrint` hook; print target is the printable wrapper.
- For PDF print styles: add `@media print` overrides in a small `globals.css` block or inline component styles. Hide nav/sidebar in print mode.

</specifics>

<deferred>
## Deferred Ideas

- PDF visual polish (header, footer with page numbers, styled tables) — out of scope per PRD §5 ("output need not be visually polished but must contain the same information").
- Multi-lot search (search returns multiple matches) — single-result UX is sufficient for the demo.

</deferred>

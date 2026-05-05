# Phase 8: Dashboard - Context

**Gathered:** 2026-05-05
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

The user lands on `/` and immediately sees the operational health of the business — current stock levels, alerts that need attention, and what happened recently.

**Requirements:** REQ-dashboard.

**Success criteria (ROADMAP §Phase 8):**
1. `/` shows 4 KPI cards across the top:
   - "Matières premières en stock" (count of active lots; red alert if any DLC < 3 days).
   - "Broches en stock" (count + total weight).
   - "Production cette semaine" (count of broches produced this week).
   - "Livraisons cette semaine" (count + estimated value — if no price data, just count).
2. "Alertes" column listing: RMs approaching DLC, low-stock conditions, broches not delivered > 3 days. One-line label each.
3. "Recent activity" column: 5 most recent actions (réceptions, productions, livraisons) in a vertical timeline with timestamps.
4. Empty seed state → contextual empty state in activity column.
5. KPIs update without manual refresh (Zustand subscription).

</domain>

<decisions>
## Implementation Decisions

### Locked
- Stack as before. File-size cap 300. French only.
- Estimated value: PRD does not include unit prices; use a simple flat-rate proxy: `25 CHF/kg` (sober assumption noted in seed/comment). Alternative: omit value entirely and just show count. Choose count-only for honesty and simplicity (still meets criteria — "count + estimated value" with clear "—" when no value).
- Date logic: "this week" = ISO week (Monday start). Use plain Date math.
- Low stock threshold: < 5 kg `quantiteRestante`.
- Broches not delivered > 3 days: `statut === "en_stock" && dateProduction < today - 3 days`.
- Reuse existing primitives: `<DlcBadge>`, `<EmptyState>`, `<Card>` from shadcn.
- Hydration guard pattern.
- shadcn `Card` may need install if not yet present.

### Claude's Discretion
- Layout: 4 KPI cards on top in a `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4`. Below, `grid grid-cols-1 md:grid-cols-2 gap-4` with Alertes (left) and Recent Activity (right).
- KPI card has: small label (uppercase, muted), big number, optional sub-label (kg total, alerts, etc.). For DLC alert, render a small red badge "X DLC <3j" inside the card.
- Pure helpers in `lib/dashboard.ts`:
  - `countActiveRMs(rms): number` — count where `quantiteRestante > 0`.
  - `countAlertingDLCs(rms, today): number` — count where DLC < today + 3 days.
  - `countBrochesEnStock(fps): number` and `sumBrochesWeight(fps): number`.
  - `countProducedThisWeek(fps, today): number`.
  - `countDeliveriesThisWeek(deliveries, today): number`.
  - `getAlertes(state, today): { id; severity; message; href? }[]` — combine RM near-DLC, low-stock RMs, stale broches.
  - `getRecentActivity(state, n=5): { type; date; title; href }[]` — merge 3 streams of events sorted by date desc.
- Activity event types: `"reception"` (RM added), `"production"` (production order created), `"livraison"` (delivery created or marked livrée). Use the entity's date field. Cap to 5.

</decisions>

<code_context>
## Existing Code Insights

- `app/page.tsx` currently shows a placeholder. Replace.
- `<EmptyState>` exists.
- DLC color from `lib/dlc.ts`.
- `lib/raw-materials.ts` has `formatDate(iso)` for display.
- shadcn `Card` is used in some places already? Check during execute.

</code_context>

<specifics>
## Specific Ideas

- Toast helpers not needed here (read-only screen).
- Each Alerte one-liner format:
  - DLC near: `Lot {numeroLotFournisseur} ({nom}) — DLC dans {N}j`.
  - Low stock: `Lot {numeroLotFournisseur} ({nom}) — {quantiteRestante}kg restants`.
  - Broche stale: `Broche {numeroLotInterne} en stock depuis {N}j`.
- Activity timeline format:
  - "Réception — {nom} ({fournisseur})" + date
  - "Production — {N} broches ({recipeName})" + date
  - "Livraison — {N} broches → {customerName}" + date
- Each activity row → `<Link>` to relevant detail (e.g., `/matieres-premieres`, `/production`, `/livraisons`).
- Time delta string: small `formatRelative(date, now)` helper using date-fns (already installed) — `il y a 2 jours`, etc.

</specifics>

<deferred>
## Deferred Ideas

- Charts/graphs — out of POC scope.
- Real-time WebSocket — Zustand subscription is sufficient.

</deferred>

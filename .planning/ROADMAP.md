# Roadmap: TraceKebab

**Milestone:** v0.2 — broche-recipe-stock-factures
**Granularity:** standard (3 focused enhancement phases)
**Coverage:** 3/3 v0.2 requirements mapped.

## Overview

v0.2 addresses three gaps discovered during the v0.1 demo review: (1) broche recipe names are not displayed anywhere a broche appears (delivery dialog, client detail, traçabilité), making broches unidentifiable; (2) there is no inventory screen for finished products (broches en stock), only matières premières; (3) deliveries create no paper trail — a facture should be auto-generated on "Marquer comme livrée" and accessible as a dedicated screen. Each phase is independently demoable; they execute in sequence because Phase 11 links to Phase 12's facture route and Phase 12 depends on the store additions from Phase 10 context.

## Phases

**Phase Numbering:**
- Phases 10-12 continue the v0.1 numbering sequence (1-9 are complete).

- [x] **Phase 10: Broche Recipe Display** — Add `getRecipeForBroche()` helper and surface recipe name in every component that lists or shows a broche: new-delivery-dialog, broches-expansion, tracabilite-downstream, tracabilite-upstream. (completed 2026-05-05)
- [ ] **Phase 11: Stock Broches Finies Screen** — New route `/stock-broches` with a sortable table of all FinishedProducts (en_stock + livree), filter chips by statut, and a "Broches en stock" sidebar entry. Update the dashboard KPI card link.
- [ ] **Phase 12: Auto-Factures** — `Facture` domain type, `addFacture` store action, auto-generate facture on "Marquer comme livrée", new `/factures` list screen and `/factures/[id]` detail with print/PDF, sidebar entry "Factures".

## Phase Details

### Phase 10: Broche Recipe Display
**Goal**: The recipe name of a broche is visible wherever broches appear — delivery creation, client detail, traçabilité — so users can identify what they are handling.
**Depends on**: v0.1 complete (Phases 1-9 done)
**Requirements**: REQ-v2-broche-recipe-display
**Success Criteria** (what must be TRUE):
  1. `lib/finished-products.ts` exports `getRecipeForBroche(brocheId, productionOrders, recipes): Recipe | null` that resolves `FinishedProduct → ProductionOrder → Recipe`.
  2. The "+ Nouvelle livraison" dialog checkbox rows show `[n° lot interne] — [recipe.nom] — [poids] kg — DLC [date]` instead of just the lot number.
  3. The client detail broches-expansion table includes a "Recette" column.
  4. The Cas 2 (downstream) traçabilité broche card shows the recipe name under "Ordre de fabrication".
  5. The Cas 1 (upstream) traçabilité finished products section shows the recipe name next to each broche lot.
**Plans**: TBD

### Phase 11: Stock Broches Finies Screen
**Goal**: The user can navigate to a dedicated screen listing all finished product broches (both in stock and delivered), with recipe name, DLC badge, statut, and filter chips.
**Depends on**: Phase 10
**Requirements**: REQ-v2-stock-broches-screen
**Success Criteria** (what must be TRUE):
  1. Navigating to `/stock-broches` shows a sortable table with columns N° lot interne, Recette, Poids (kg), DLC (color badge), Statut, Client livré (when applicable).
  2. Filter chips above the table allow filtering by statut: "Tous", "En stock", "Livrés". Default view shows "En stock" only.
  3. The left sidebar includes a "Stock broches" entry (with `BoxesIcon` from lucide-react) below "Matières premières".
  4. The dashboard "Broches en stock" KPI card links to `/stock-broches?statut=en_stock`.
  5. Empty state "Aucune broche en stock — lancez un ordre de fabrication" renders when the filter returns zero rows.
**Plans**: TBD

### Phase 12: Auto-Factures
**Goal**: Every delivery automatically generates a facture on "Marquer comme livrée"; the user can view all factures in a list and open any facture as a printable/PDF detail.
**Depends on**: Phase 11
**Requirements**: REQ-v2-factures
**Success Criteria** (what must be TRUE):
  1. `lib/types.ts` includes a `Facture` type with fields: `id`, `numeroFacture` (format `F-AAAA-NNNN`), `livraisonId`, `clientId`, `dateFacture`, `lignes` (array of `{ brocheId, numeroLot, recetteNom, poidsKg, prixUnitaireHT, montantHT }`), `totalHT`, `tva` (8.1% Suisse), `totalTTC`.
  2. The Zustand store adds `factures: Facture[]`, `addFacture`, and `deleteFacture` actions; `factures` is included in `partialize` for persistence.
  3. On "Marquer comme livrée" in the delivery dialog, a `Facture` is auto-created (25 CHF/kg HT, TVA 8.1%) and persisted; a toast shows "Livraison confirmée — Facture [numero] générée".
  4. Navigating to `/factures` shows a table with columns N° facture, Client, Date, Nombre de broches, Total HT, TVA, Total TTC, with a row action to open the detail.
  5. Navigating to `/factures/[id]` shows a printable facture detail with client info, ligne items, and totals; a "Imprimer / PDF" button triggers `react-to-print`.
  6. The left sidebar includes a "Factures" entry (with `ReceiptIcon` from lucide-react) below "Livraisons".
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 10 → 11 → 12

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 10. Broche Recipe Display | 1/1 | Complete   | 2026-05-05 |
| 11. Stock Broches Finies Screen | 0/TBD | Not started | - |
| 12. Auto-Factures | 0/TBD | Not started | - |

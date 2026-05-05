# Requirements: TraceKebab

**Defined:** 2026-05-05
**Milestone:** v0.2 — broche-recipe-stock-factures
**Core Value:** Surface recipe identity on every broche, add a finished-product inventory screen, and auto-generate factures on delivery confirmation.

## v0.2 Requirements

Three gaps identified post-v0.1 demo review.

### Broche Recipe Display

- [ ] **REQ-v2-broche-recipe-display** — Wherever a broche (FinishedProduct) is displayed — the new-delivery-dialog checkbox list, the client detail broches-expansion table, the Cas 1 upstream traçabilité finished-products section, and the Cas 2 downstream traçabilité broche card — the recipe name that produced it must be visible. A `getRecipeForBroche(brocheId, productionOrders, recipes)` helper in `lib/finished-products.ts` resolves the chain `FinishedProduct → ProductionOrder → Recipe`.

### Finished-Product Inventory

- [ ] **REQ-v2-stock-broches-screen** — A new route `/stock-broches` displays all FinishedProducts in a sortable table (N° lot interne, Recette, Poids kg, DLC badge, Statut, Client livré). Filter chips above the table allow filtering by statut ("Tous" / "En stock" / "Livrés"), defaulting to "En stock". Sidebar entry "Stock broches" (BoxesIcon) appears below "Matières premières". The dashboard "Broches en stock" KPI card links to `/stock-broches?statut=en_stock`. Empty state: "Aucune broche en stock — lancez un ordre de fabrication".

### Invoicing

- [ ] **REQ-v2-factures** — A `Facture` type (fields: id, numeroFacture `F-AAAA-NNNN`, livraisonId, clientId, dateFacture, lignes with brocheId/numeroLot/recetteNom/poidsKg/prixUnitaireHT/montantHT, totalHT, tva 8.1%, totalTTC) is added to `lib/types.ts`. The Zustand store gains `factures`, `addFacture`, `deleteFacture` (persisted). On "Marquer comme livrée", a Facture is auto-created at 25 CHF/kg HT with 8.1% Swiss TVA and a toast confirms "Livraison confirmée — Facture [numero] générée". Route `/factures` lists all factures (N° facture, Client, Date, Nombre de broches, Total HT, TVA, Total TTC). Route `/factures/[id]` renders a printable detail with client info, ligne items, and totals, with a "Imprimer / PDF" button via `react-to-print`. Sidebar entry "Factures" (ReceiptIcon) appears below "Livraisons".

## v0.1 Requirements (Validated)

All v0.1 requirements shipped in milestone v0.1 (completed 2026-05-05).

- [x] REQ-layout-shell
- [x] REQ-dashboard
- [x] REQ-raw-materials-list
- [x] REQ-raw-material-receive
- [x] REQ-recipes-readonly
- [x] REQ-production-orders-list
- [x] REQ-production-wizard
- [x] REQ-deliveries-list
- [x] REQ-delivery-create
- [x] REQ-clients-crud
- [x] REQ-client-detail-history
- [x] REQ-tracabilite-search
- [x] REQ-tracabilite-upstream
- [x] REQ-tracabilite-downstream
- [x] REQ-tracabilite-pdf-export
- [x] REQ-dlc-color-coding
- [x] REQ-toasts-on-mutations
- [x] REQ-confirmations-on-critical-actions
- [x] REQ-empty-states
- [x] REQ-no-pagination
- [x] REQ-success-criteria-demo-flow

## Out of Scope (v0.2)

- Custom pricing per client or per recipe (25 CHF/kg flat rate for now)
- Facture numbering tied to fiscal year reset (sequential from 1 each year, simple counter)
- QR-bill / Swiss payment slip integration
- Email delivery of factures
- Credit notes / avoir / cancellation flows
- Authentication

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| REQ-v2-broche-recipe-display | Phase 10 | Pending |
| REQ-v2-stock-broches-screen | Phase 11 | Pending |
| REQ-v2-factures | Phase 12 | Pending |

**Coverage:**
- v0.2 requirements: 3 total
- Mapped to phases: 3
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-05*
*Milestone: v0.2 broche-recipe-stock-factures*

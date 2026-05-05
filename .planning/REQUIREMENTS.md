# Requirements: TraceKebab

**Defined:** 2026-05-05
**Milestone:** v0.4 — usabilite-et-exports
**Core Value:** L'opérateur peut utiliser l'app au quotidien avec des dates au format suisse, des confirmations avant suppression, de la recherche dans les listes, la gestion complète des recettes, l'export PDF des factures, et la sauvegarde/restauration des données.

## v0.4 Requirements

### UX — Format et navigation

- [ ] **REQ-v4-dates-suisses** — All dates are displayed in DD.MM.YYYY format (Swiss standard) throughout the app. No ISO-8601 date strings (2026-05-05) visible to the user.

- [ ] **REQ-v4-delete-confirmation-client** — Before a client is permanently deleted, the user sees a confirmation dialog (AlertDialog) naming the client and warning about data loss. Cancelling aborts the deletion.

- [ ] **REQ-v4-delete-confirmation-mp** — Before a matière première is permanently deleted, the user sees a confirmation dialog naming the item and warning about data loss. Cancelling aborts the deletion.

- [ ] **REQ-v4-search-livraisons** — On the livraisons page, a search/filter input lets the user narrow the list by typing part of a client name or date. The filter applies client-side with no store changes.

- [ ] **REQ-v4-search-clients** — On the clients page, a search/filter input lets the user narrow the list by typing part of a client name.

- [ ] **REQ-v4-search-matieres** — On the matières premières page, a search/filter input lets the user narrow the list by typing part of a product name or supplier name.

### Recettes CRUD

- [ ] **REQ-v4-recettes-create** — User can create a new recipe by specifying a name and default price per kg HT. The recipe is saved to the store and immediately appears in all recipe-aware views (production wizard, tarifs, etc.).

- [ ] **REQ-v4-recettes-edit** — User can edit an existing recipe's name and default price. Changes persist immediately and are reflected on all factures generated after the change.

- [ ] **REQ-v4-recettes-delete** — User can delete a recipe from the list. If the recipe is referenced by any production order, deletion is blocked with an explanatory message. Otherwise a confirmation dialog is shown before deletion.

### Exports

- [ ] **REQ-v4-facture-pdf** — On the facture detail page (/factures/[id]), an "Exporter PDF" button generates and downloads a formatted PDF of the invoice (client details, line items, total HT, total TTC, payment deadline). Uses react-to-print or jsPDF (already available).

- [ ] **REQ-v4-export-json** — In Paramètres, an "Exporter les données" button downloads the entire Zustand store state as a JSON file (filename: tracekebab-backup-YYYY-MM-DD.json). No sensitive data — purely localStorage content.

- [ ] **REQ-v4-import-json** — In Paramètres, an "Importer des données" button opens a file picker accepting .json files. After selecting a file, a confirmation dialog warns that current data will be replaced. On confirm, the store is replaced with the imported data.

## v0.3 Requirements (Validated)

All v0.3 requirements shipped in milestone v0.3 (completed 2026-05-05).

- [x] REQ-v3-prix-recette-defaut — Default price per kg configurable per recipe in Paramètres
- [x] REQ-v3-prix-client-override — Per-client price override per recipe on client detail page
- [x] REQ-v3-facture-prix-auto — Factures auto-generated with correct per-recipe, per-client price

## v0.2 Requirements (Validated)

All v0.2 requirements shipped in milestone v0.2 (completed 2026-05-05).

- [x] REQ-v2-broche-recipe-display — Recipe name visible wherever a broche appears
- [x] REQ-v2-stock-broches-screen — /stock-broches inventory screen for finished products
- [x] REQ-v2-factures — Auto-generate facture on delivery, /factures list and detail screens
- [x] REQ-v2-suivi-paiements — Payment lifecycle tracking, dashboard KPI, paramètre délai

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

## Out of Scope (v0.4)

- Export CSV factures pour comptabilité — format complexe, hors besoin POC
- Relance automatique factures en retard — nécessite backend
- Historique des modifications de prix — hors POC
- Impression depuis mobile — desktop only
- QR-bill sur facture PDF — réservé pour une version production

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| REQ-v4-dates-suisses | Phase 16 | Pending |
| REQ-v4-delete-confirmation-client | Phase 16 | Pending |
| REQ-v4-delete-confirmation-mp | Phase 16 | Pending |
| REQ-v4-search-livraisons | Phase 16 | Pending |
| REQ-v4-search-clients | Phase 16 | Pending |
| REQ-v4-search-matieres | Phase 16 | Pending |
| REQ-v4-recettes-create | Phase 17 | Pending |
| REQ-v4-recettes-edit | Phase 17 | Pending |
| REQ-v4-recettes-delete | Phase 17 | Pending |
| REQ-v4-facture-pdf | Phase 18 | Pending |
| REQ-v4-export-json | Phase 19 | Pending |
| REQ-v4-import-json | Phase 19 | Pending |

**Coverage:**
- v0.4 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-05*
*Milestone: v0.4 usabilite-et-exports*

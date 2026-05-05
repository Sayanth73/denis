# Requirements: TraceKebab

**Defined:** 2026-05-05
**Milestone:** v0.3 — grille-tarifaire
**Core Value:** Chaque recette a un prix par défaut au kg ; chaque client peut avoir des tarifs spécifiques par recette ; les factures auto-générées utilisent toujours le bon prix.

## v0.3 Requirements

### Tarification

- [x] **REQ-v3-prix-recette-defaut** — Each recipe has a configurable default price per kg (CHF HT). A "Grille tarifaire" section in Paramètres lists the 3 seeded recipes with their current default prices, editable via a form. Migration sets all existing recipes to 25 CHF/kg (the previous flat rate).

- [ ] **REQ-v3-prix-client-override** — On a client's detail page, a "Tarifs spéciaux" section shows a table with one row per recipe: recipe name, default price (read-only), and an optional override price (CHF/kg HT). Empty or absent override means the client pays the recipe default. Changes are saved on form submit with a toast.

- [x] **REQ-v3-facture-prix-auto** — Auto-generated factures on delivery use the correct price per ligne: client's override for that recipe if set, otherwise the recipe's default price. The invoice line `prixUnitaireHT` reflects the actual agreed rate — no hardcoded 25 CHF/kg anywhere in `buildFacture`.

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

## Out of Scope (v0.3)

- Prix par livraison (override au moment de créer la livraison) — trop d'UX pour le gain
- Remises volumétriques / paliers de prix — hors POC
- Historique des changements de prix — hors POC
- Export CSV des factures pour comptabilité — déféré à v0.4
- Relance automatique pour factures en retard — déféré à v0.4

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| REQ-v3-prix-recette-defaut | Phase 14 | Complete |
| REQ-v3-prix-client-override | Phase 15 | Pending |
| REQ-v3-facture-prix-auto | Phase 14 | Complete |

**Coverage:**
- v0.3 requirements: 3 total
- Mapped to phases: 3
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-05*
*Milestone: v0.3 grille-tarifaire*

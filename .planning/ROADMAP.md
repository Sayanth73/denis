# Roadmap: TraceKebab

**Milestone:** v0.4 — usabilite-et-exports
**Granularity:** standard (4 focused usability phases)
**Coverage:** 12/12 v0.4 requirements mapped.

## Overview

v0.4 makes the app usable day-to-day by correcting the date format throughout (Swiss DD.MM.YYYY), adding safety nets before destructive deletions, and introducing client-side search on the three main list views. Phase 17 completes the recipe lifecycle — seeded recipes were read-only through v0.3; the operator can now create, rename, reprice, and delete recipes, with a guard preventing deletion of recipes used in production. Phase 18 closes the invoice workflow by letting the operator print a formatted PDF directly from the facture detail page, reusing the react-to-print infrastructure already in place for traçabilité. Phase 19 adds a safety net for the entire dataset: a one-click JSON backup download and a matching import/restore flow in Paramètres, both guarded by confirmation dialogs.

Phases execute strictly in numeric order. Phases 17–19 are independent of each other and could run in any order, but are sequenced 17 → 18 → 19 to deliver highest-value store changes first.

## Phases

**Phase Numbering:**
- Phases 16-19 continue the v0.3 numbering sequence (1-15 are complete).

- [x] **Phase 16: UX Polish — Dates suisses, confirmations, recherche** — Replace ISO dates with DD.MM.YYYY throughout; add AlertDialog before deleting a client or a matière première; add search/filter inputs above the livraisons, clients, and matières premières tables.
- [ ] **Phase 17: CRUD Recettes** — Add create, edit, and delete to the recipes screen; guard deletion when the recipe is referenced by a production order; persist changes immediately to the store.
- [ ] **Phase 18: Export PDF Facture** — Add an "Exporter PDF" button to the facture detail page using react-to-print (already installed); output covers client details, line items, totals HT/TTC, and payment deadline.
- [ ] **Phase 19: Sauvegarde et restauration JSON** — Add export (download full store as JSON) and import (file picker + confirmation → replace store) to Paramètres.

## Phase Details

### Phase 16: UX Polish — Dates suisses, confirmations, recherche
**Goal**: Every date visible to the user appears in DD.MM.YYYY Swiss format, destructive deletions require an explicit confirmation, and every main list view can be narrowed by a text filter.
**Depends on**: Phase 15 (v0.3 complete)
**Requirements**: REQ-v4-dates-suisses, REQ-v4-delete-confirmation-client, REQ-v4-delete-confirmation-mp, REQ-v4-search-livraisons, REQ-v4-search-clients, REQ-v4-search-matieres
**Success Criteria** (what must be TRUE):
  1. No ISO-8601 date string (e.g. "2026-05-05") is visible anywhere in the UI — all dates render as "05.05.2026" using the updated `formatDate` helper.
  2. Clicking "Supprimer" on a client opens an AlertDialog naming the client and warning of data loss; clicking "Annuler" leaves the client untouched.
  3. Clicking "Supprimer" on a matière première opens an AlertDialog naming the item; clicking "Annuler" leaves the row untouched.
  4. Typing part of a client name in the livraisons search input instantly narrows the deliveries table; clearing the input restores all rows.
  5. Typing in the search inputs on the clients page and the matières premières page each independently filter their tables by name and by name/supplier respectively.
**Plans**: 1 plan
Plans:
- [x] 16-01-PLAN.md — Date audit + matières premières delete confirmation + search on all three list pages

**UI hint**: yes

### Phase 17: CRUD Recettes
**Goal**: The operator can create new recipes, rename and reprice existing ones, and delete unused recipes — the recipe list is no longer limited to the 3 seeded read-only entries.
**Depends on**: Phase 16
**Requirements**: REQ-v4-recettes-create, REQ-v4-recettes-edit, REQ-v4-recettes-delete
**Success Criteria** (what must be TRUE):
  1. A "Nouvelle recette" button on the /production recipes tab opens a dialog; filling in a name and default price and confirming adds the recipe to the store and makes it immediately selectable in the production wizard and the tarif grids.
  2. Each recipe row has an "Éditer" action; saving changes to name or price updates the store immediately and is confirmed by a toast.
  3. Attempting to delete a recipe referenced by at least one production order shows a blocking message (no confirmation dialog, no deletion).
  4. Attempting to delete an unreferenced recipe opens an AlertDialog for confirmation; cancelling leaves the recipe untouched; confirming removes it from the store and from all tarif grids.
**Plans**: 1 plan
Plans:
- [ ] 17-01-PLAN.md — Rewrite RecettesTab: create/edit dialogs + delete guard with cascade

**UI hint**: yes

### Phase 18: Export PDF Facture
**Goal**: The operator can generate and download a formatted PDF of any invoice directly from the facture detail page, without leaving the app.
**Depends on**: Phase 17
**Requirements**: REQ-v4-facture-pdf
**Success Criteria** (what must be TRUE):
  1. The facture detail page (/factures/[id]) shows an "Exporter PDF" button.
  2. Clicking the button triggers a browser print/save dialog with a printable facture layout that includes: client name and address, invoice number and date, a line-item table (recipe, quantity, unit price HT, line total HT), total HT, TVA rate, total TTC, and payment deadline.
  3. The generated PDF contains no raw JSON, no debug output, and no UI navigation elements.
**Plans**: TBD
**UI hint**: yes

### Phase 19: Sauvegarde et restauration JSON
**Goal**: The operator can download a complete backup of all application data as a JSON file and restore it later, giving a safety net before any destructive operation.
**Depends on**: Phase 18
**Requirements**: REQ-v4-export-json, REQ-v4-import-json
**Success Criteria** (what must be TRUE):
  1. In Paramètres, an "Exporter les données" button triggers a download of a JSON file named `tracekebab-backup-YYYY-MM-DD.json` containing the full Zustand store state.
  2. In Paramètres, an "Importer des données" button opens a file picker accepting .json files; after selecting a file, a confirmation dialog warns that all current data will be replaced.
  3. Cancelling the import confirmation leaves the store unchanged.
  4. Confirming the import replaces the store state with the imported data; the UI immediately reflects the restored data without a manual page reload.
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 16 → 17 → 18 → 19

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 16. UX Polish — Dates suisses, confirmations, recherche | 1/1 | Complete | 2026-05-05 |
| 17. CRUD Recettes | 0/1 | Not started | - |
| 18. Export PDF Facture | 0/? | Not started | - |
| 19. Sauvegarde et restauration JSON | 0/? | Not started | - |

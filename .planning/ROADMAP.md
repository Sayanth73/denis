# Roadmap: TraceKebab

**Milestone:** v0.3 — grille-tarifaire
**Granularity:** standard (2 focused enhancement phases)
**Coverage:** 3/3 v0.3 requirements mapped.

## Overview

v0.3 introduces a full pricing layer that eliminates the hardcoded 25 CHF/kg rate in the invoice generation logic. Two phases split along the classic data/UI boundary. Phase 14 adds `prixParDefautHT` to the Recipe type, adds `tarifs` overrides to the Customer type, bumps the store to version 4 with a migration, and updates `buildFacture` so that invoice line prices are resolved dynamically (client override → recipe default). Phase 15 surfaces both of those data structures in the UI: a "Grille tarifaire" section in `/parametres` where the operator edits recipe default prices, and a "Tarifs spéciaux" section on each client detail page for per-recipe overrides. The two phases execute strictly in sequence: the UI in Phase 15 is meaningless until the data schema from Phase 14 is in place.

## Phases

**Phase Numbering:**
- Phases 14-15 continue the v0.2 numbering sequence (1-13 are complete).

- [x] **Phase 14: Data Layer — Tarification** — Extend types (`prixParDefautHT` on Recipe, `tarifs` on Customer), bump store to v4 with migration (recipes default to 25 CHF/kg, customers get empty tarifs array), update `buildFacture` to resolve price via client override then recipe default. (completed 2026-05-05)
- [x] **Phase 15: UI Layer — Grille tarifaire & Tarifs spéciaux** — "Grille tarifaire" section in `/parametres` (editable default price per recipe), "Tarifs spéciaux" section on `/clients/[id]` (per-recipe override table with inline editing), all wired to the store actions from Phase 14. (completed 2026-05-05)

## Phase Details

### Phase 14: Data Layer — Tarification
**Goal**: The domain model and invoice builder correctly represent and resolve per-recipe, per-client pricing so that no hardcoded rate can appear on any future invoice.
**Depends on**: Phase 13 (v0.2 complete)
**Requirements**: REQ-v3-prix-recette-defaut, REQ-v3-facture-prix-auto
**Success Criteria** (what must be TRUE):
  1. `lib/types.ts` declares `prixParDefautHT: number` on the `Recipe` type and `tarifs: { recetteId: string; prixHT: number }[]` on the `Customer` type; TypeScript strict compilation passes with no errors.
  2. The Zustand store version is bumped to 4; on first load after the update, existing recipes are migrated to `prixParDefautHT: 25` and existing customers are migrated to `tarifs: []` without data loss on other fields.
  3. `lib/facture-builder.ts` resolves each invoice line price as `customer.tarifs.find(t => t.recetteId === ligne.recetteId)?.prixHT ?? recipe.prixParDefautHT` — the literal constant `25` no longer appears anywhere in the file.
  4. Creating a new delivery for a client with no tarif overrides generates a facture whose line `prixUnitaireHT` equals the recipe's `prixParDefautHT`.
  5. Creating a new delivery for a client whose `tarifs` array contains an override for the delivered recipe generates a facture whose line `prixUnitaireHT` equals the override value.
**Plans**: TBD
**UI hint**: no

### Phase 15: UI Layer — Grille tarifaire & Tarifs spéciaux
**Goal**: The operator can view and edit default prices per recipe in Paramètres, and can set per-client price overrides on each client detail page, with changes persisting immediately and confirmed by a toast.
**Depends on**: Phase 14
**Requirements**: REQ-v3-prix-client-override
**Success Criteria** (what must be TRUE):
  1. Navigating to `/parametres` shows a "Grille tarifaire" section listing the 3 seeded recipes with their current `prixParDefautHT`; each row has an editable CHF/kg input and a save button (or a single save for the section); a successful save shows a toast "Grille tarifaire mise à jour".
  2. Navigating to `/clients/[id]` shows a "Tarifs spéciaux" section with a table of 3 rows (one per recipe) showing recipe name, default price (read-only), and an optional override price input; an empty override field means the client pays the recipe default.
  3. Saving a non-empty override on the client detail persists the value to `customer.tarifs` in the store and shows a toast "Tarifs mis à jour".
  4. Clearing a previously set override (submitting an empty field) removes the entry from `customer.tarifs` and restores the recipe default on any subsequent invoice.
  5. All labels, column headers, toast messages, and placeholder text are in French.
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 14 → 15

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 14. Data Layer — Tarification | 1/1 | Complete    | 2026-05-05 |
| 15. UI Layer — Grille tarifaire & Tarifs spéciaux | 1/1 | Complete    | 2026-05-05 |

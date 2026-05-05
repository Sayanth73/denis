---
phase: 15-ui-layer-grille-tarifaire-tarifs-speciaux
verified: 2026-05-05T13:28:51Z
status: human_needed
score: 6/7 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Navigate to /parametres, change a price, click Enregistrer — confirm toast 'Grille tarifaire mise à jour' appears and the value persists after page reload"
    expected: "Toast fires; on reload the input is pre-filled with the saved value from the store"
    why_human: "Cannot verify toast rendering or localStorage persistence without a running browser session"
  - test: "Navigate to /clients/[id], enter an override, save, reload — confirm override value reappears; then clear it, save, reload — confirm input is empty"
    expected: "Override round-trips through the store; clearing removes entry from customer.tarifs"
    why_human: "Cannot verify store persistence or toast rendering without a running browser session"
  - test: "Verify the third column header label in Tarifs spéciaux — it reads 'Prix spécial client (CHF/kg HT)' in the codebase but the PLAN spec said 'Override client (CHF/kg)'"
    expected: "Column is in French and meaningfully describes the editable override field (both variants satisfy the French requirement)"
    why_human: "Minor wording deviation from plan spec; operator must confirm the label is acceptable in production context"
---

# Phase 15: UI Layer — Grille tarifaire & Tarifs spéciaux Verification Report

**Phase Goal:** The operator can view and edit default prices per recipe in Paramètres, and can set per-client price overrides on each client detail page, with changes persisting immediately and confirmed by a toast.
**Verified:** 2026-05-05T13:28:51Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `/parametres` shows a 'Grille tarifaire' section with 3 editable CHF/kg inputs, one per seeded recipe | VERIFIED | `app/parametres/page.tsx` line 219: h2 "Grille tarifaire"; `recipes.map(...)` at line 239 renders one Input per recipe seeded from `localPrices[recipe.id]` |
| 2 | Saving Grille tarifaire writes prixParDefautHT to each recipe in the store and shows toast 'Grille tarifaire mise à jour' | VERIFIED | `handleSaveGrille` (line 79–93): iterates recipes, calls `updateRecipe(r.id, { prixParDefautHT: Number(localPrices[r.id]) })` (line 90), then `toast.success("Grille tarifaire mise à jour")` (line 92) |
| 3 | Attempting to save an empty or negative Grille tarifaire input shows an inline error and does not write to the store | VERIFIED | Line 83: `if (val === "" \|\| isNaN(Number(val)) \|\| Number(val) < 0)` calls `setPrixError(...)` and returns before the updateRecipe loop; error rendered at line 261 |
| 4 | `/clients/[id]` shows a 'Tarifs spéciaux' section with a 3-column table — recipe name, read-only default price, editable override input | VERIFIED | `app/clients/[id]/page.tsx` lines 137–194: h3 "Tarifs spéciaux", 3-column TableHeader (Recette / Prix par défaut / Prix spécial client), `recipes.map(...)` renders read-only `{recipe.prixParDefautHT.toFixed(2)} CHF/kg` and editable Input per recipe |
| 5 | Saving a non-empty override in Tarifs spéciaux writes the value to customer.tarifs and shows toast 'Tarifs mis à jour' | VERIFIED | `handleSaveTarifs` (line 70–89): builds `newTarifs` (lines 83–85) filtering non-empty overrides, calls `updateCustomer(customer.id, { tarifs: newTarifs })` (line 87), then `toast.success("Tarifs mis à jour")` (line 88) |
| 6 | Clearing a previously set override (empty field on save) removes the entry from customer.tarifs entirely | VERIFIED | Line 84: `.filter((r) => (overrides[r.id] ?? "") !== "")` excludes empty fields from `newTarifs`; the subsequent `updateCustomer` call replaces the whole `tarifs` array, removing the cleared entry |
| 7 | All labels, column headers, toast messages, and button text are in French | UNCERTAIN | All verified labels are French: "Grille tarifaire", "Recette", "Prix par défaut (CHF/kg HT)", "Enregistrer", "Grille tarifaire mise à jour", "Tarifs spéciaux", "Laissez vide pour utiliser le prix par défaut de la recette.", "Tarifs mis à jour". Third column header is "Prix spécial client (CHF/kg HT)" — different from PLAN spec "Override client (CHF/kg)" but still French and descriptive. Human confirmation requested. |

**Score:** 6/7 truths verified (1 uncertain — human confirmation requested)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/parametres/page.tsx` | Grille tarifaire section — 3 editable rows + Enregistrer button | VERIFIED | Contains `handleSaveGrille` (line 79), `localPrices` state (line 53), `prixError` state (line 54), Table with `recipes.map(...)`, Button onClick={handleSaveGrille} at line 265 |
| `app/clients/[id]/page.tsx` | Tarifs spéciaux section — 3-row override table + Enregistrer button | VERIFIED | Contains `handleSaveTarifs` (line 70), `overrides` state (line 51), `tarifsError` state (line 52), Table with 3 columns, Button onClick={handleSaveTarifs} at line 191 |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `app/parametres/page.tsx` | `useTraceabilityStore.getState().updateRecipe` | `handleSaveGrille` iterating recipes | WIRED | Line 88–90: `const { updateRecipe } = useTraceabilityStore.getState(); for (const r of recipes) { updateRecipe(r.id, { prixParDefautHT: Number(localPrices[r.id]) }); }` |
| `app/clients/[id]/page.tsx` | `useTraceabilityStore.getState().updateCustomer` | `handleSaveTarifs` building newTarifs array | WIRED | Lines 83–87: `newTarifs` built via filter+map, then `updateCustomer(customer.id, { tarifs: newTarifs })` |
| `overrides state` | `customer.tarifs` | `newTarifs = recipes.filter(non-empty).map to {recetteId, prixHT}` | WIRED | Lines 83–85 exactly match the plan pattern; empty fields excluded via `.filter((r) => (overrides[r.id] ?? "") !== "")` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `app/parametres/page.tsx` | `localPrices` | `useEffect` on `hasHydrated` reads `recipes` from Zustand store (line 71–73) | Yes — seeded from `recipe.prixParDefautHT` per recipe | FLOWING |
| `app/clients/[id]/page.tsx` | `overrides` | `useEffect` on `hasHydrated` reads `customer.tarifs` from Zustand store (lines 60–64) | Yes — seeded from `customer.tarifs` per recipe; empty string for unset overrides | FLOWING |

### Behavioral Spot-Checks

Step 7b: SKIPPED for toast and persistence behaviors — requires a running browser session. TypeScript compilation verified instead.

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| TypeScript compiles with no errors | `npx tsc --noEmit` | Exit: 0 | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| REQ-v3-prix-client-override | 15-01-PLAN.md | Per-client recipe price overrides on client detail page, persisted to store | SATISFIED | `handleSaveTarifs` writes to `customer.tarifs`; empty fields remove entries; toast confirms success |

### Anti-Patterns Found

No blockers or warnings found.

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| None | — | — | — |

All TODO/FIXME/placeholder scans returned no matches. No empty returns or stub handlers found in the pricing sections.

### Human Verification Required

#### 1. Grille tarifaire end-to-end persistence

**Test:** Start dev server (`npm run dev`), navigate to `http://localhost:3000/parametres`. Confirm "Grille tarifaire" section appears with 3 rows. Change a price, click "Enregistrer".
**Expected:** Toast "Grille tarifaire mise à jour" appears; hard-reload the page and the input shows the saved value.
**Why human:** Toast rendering and localStorage/Zustand persist round-trip cannot be verified without a running browser.

#### 2. Tarifs spéciaux save and clear round-trip

**Test:** Navigate to any client detail page. Enter an override price for one recipe, click "Enregistrer". Reload. Then clear the field, click "Enregistrer". Reload again.
**Expected:** After first save: toast "Tarifs mis à jour" fires and the override value reappears on reload. After clear+save: toast fires and the input is empty on reload (entry removed from customer.tarifs).
**Why human:** Store persistence and toast rendering require a live browser session.

#### 3. Third column header label acceptability

**Test:** On the client detail page, observe the third column header of the Tarifs spéciaux table.
**Expected:** Header reads "Prix spécial client (CHF/kg HT)" — confirm this label is clear and appropriate for the operator audience. (PLAN spec said "Override client (CHF/kg)" but the implementation used a French-only label.)
**Why human:** Minor wording deviation from plan spec; operator must confirm the label is acceptable.

### Gaps Summary

No blockers found. All automated checks pass. Three items are routed to human verification: two are standard browser-only behaviors (toasts and localStorage persistence), and one is a minor label wording deviation that needs operator confirmation. The deviation — "Prix spécial client (CHF/kg HT)" instead of "Override client (CHF/kg)" — is more French-idiomatic and arguably an improvement, but requires human sign-off.

---

_Verified: 2026-05-05T13:28:51Z_
_Verifier: Claude (gsd-verifier)_

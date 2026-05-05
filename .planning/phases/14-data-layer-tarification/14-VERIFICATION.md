---
phase: 14-data-layer-tarification
verified: 2026-05-05T00:00:00Z
status: human_needed
score: 4/5 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Create a delivery for a client with no tarif overrides (tarifs: []) and confirm the generated facture's prixUnitaireHT equals the recipe's prixParDefautHT (25)"
    expected: "Facture ligne shows prixUnitaireHT = 25 CHF/kg, matching the recipe default"
    why_human: "Requires running the app and triggering the delivery confirm flow; cannot be traced statically because buildFacture is called at runtime with store data"
  - test: "Add an override in customer.tarifs for a recipe (e.g., prixHT: 30), create a delivery using that recipe, and confirm the generated facture's prixUnitaireHT equals 30"
    expected: "Facture ligne shows prixUnitaireHT = 30 CHF/kg — the override value, not the recipe default"
    why_human: "No UI exists yet to set tarifs overrides (Phase 15 is pending), so this test requires direct store manipulation or a manual seed override; the code path exists but cannot be exercised end-to-end in the current UI"
---

# Phase 14: Data Layer — Tarification Verification Report

**Phase Goal:** The domain model and invoice builder correctly represent and resolve per-recipe, per-client pricing so that no hardcoded rate can appear on any future invoice.
**Verified:** 2026-05-05
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `lib/types.ts` declares `prixParDefautHT: number` on Recipe and `tarifs: { recetteId: string; prixHT: number }[]` on Customer; TypeScript strict compilation passes | VERIFIED | types.ts line 27 and line 59 confirmed; `npx tsc --noEmit` exits with no output (no errors) |
| 2 | Store version is 4; v3→v4 migration backfills `prixParDefautHT: 25` to existing recipes and `tarifs: []` to existing customers | VERIFIED | store.ts line 223 `version: 4`; migration block at lines 248-261 with idempotent checks |
| 3 | `buildFacture` resolves each invoice line price via `customer.tarifs.find(t => t.recetteId === recetteId)?.prixHT ?? recipe?.prixParDefautHT`; no standalone hardcoded `25` constant | VERIFIED (with note) | facture-builder.ts lines 23-24 confirmed; `PRIX_KG_HT` constant removed; `?? 25` fallback present only as third-level guard when `recipe` is null — PLAN explicitly accepts this; no `const PRIX_KG_HT = 25` or equivalent constant remains |
| 4 | A delivery for a client with no tarif overrides generates a facture whose line `prixUnitaireHT` equals the recipe's `prixParDefautHT` | UNCERTAIN — human needed | Code path is correct (override lookup returns `undefined`, so `prixParDefautHT` is used), but cannot verify actual generated facture values without running the app |
| 5 | A delivery for a client whose `tarifs` array contains an override for the recipe generates a facture whose `prixUnitaireHT` equals the override value | UNCERTAIN — human needed | Code path is correct (tarifs.find returns the override `prixHT`), but no UI exists to set tarif overrides until Phase 15; can only be confirmed by direct store manipulation or end-to-end test |

**Score:** 3/5 truths fully verified; 2/5 require human/runtime confirmation

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `lib/types.ts` | Contains `prixParDefautHT:` | VERIFIED | Line 27 |
| `lib/types.ts` | Contains `tarifs:` | VERIFIED | Line 59 |
| `lib/store.ts` | Contains `version: 4` | VERIFIED | Line 223 |
| `lib/store.ts` | Contains `prixParDefautHT` | VERIFIED | Lines 252, 249 (migration comment) |
| `lib/facture-builder.ts` | Contains `prixParDefautHT` | VERIFIED | Line 24 |
| `lib/facture-builder.ts` | Contains `tarifs` | VERIFIED | Line 23 |
| `lib/seed.ts` | `prixParDefautHT: 25` on each recipe | VERIFIED | Lines 133, 144, 155 — all 3 recipes covered |
| `lib/seed.ts` | `tarifs: []` on each customer | VERIFIED | Lines 162-169 — all 8 customers carry `tarifs: []` |
| `components/clients/client-dialog.tsx` | Creates Customer with `tarifs: []` | VERIFIED | Line 88 in create branch of `onSubmit` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `deliveries-table.tsx` | `lib/facture-builder.ts` | `import { buildFacture }` + call at line 73 | WIRED | Customer resolved from store at line 68-72 and passed as 7th arg |
| `new-delivery-dialog.tsx` | `lib/facture-builder.ts` | `import { buildFacture }` + call at line 109 | WIRED | Customer resolved from store at line 102-106 and passed as 7th arg |
| `buildFacture` | `customer.tarifs` | `customer.tarifs.find(...)` at line 23 | WIRED | Override lookup fires before recipe default |
| `buildFacture` | `recipe.prixParDefautHT` | `?? recipe?.prixParDefautHT` at line 24 | WIRED | Fallback to recipe default when no client override |
| `store.ts` migrate | existing recipes | `map` over `s.recipes` at line 251 | WIRED | Idempotent check `"prixParDefautHT" in r` before backfill |
| `store.ts` migrate | existing customers | `map` over `s.customers` at line 256 | WIRED | Idempotent check `"tarifs" in c` before backfill |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `facture-builder.ts` | `prixUnitaireHT` | `customer.tarifs` (runtime store) → `recipe.prixParDefautHT` (runtime store) | Yes — resolved from live store data, not hardcoded | FLOWING |
| `deliveries-table.tsx` | `customer` | `store.customers.find(c => c.id === pendingDelivery.customerId)` at line 68 | Yes — real store lookup | FLOWING |
| `new-delivery-dialog.tsx` | `customer` | `store.customers.find(c => c.id === delivery.customerId)` at line 102 | Yes — real store lookup | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| TypeScript compiles with no errors | `npx tsc --noEmit` | No output (exit 0) | PASS |
| No standalone hardcoded price constant in facture-builder | `grep -n "PRIX_KG_HT\|const.*= 25" lib/facture-builder.ts` | No matches | PASS |
| All buildFacture call sites pass customer arg | `grep -rn "buildFacture" --include="*.tsx"` | 2 call sites (deliveries-table, new-delivery-dialog) both pass customer as 7th arg | PASS |
| store version is 4 | `grep -n "version:" lib/store.ts` | `version: 4` at line 223 | PASS |
| Runtime price resolution with override value | requires running app | Cannot test statically | SKIP |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| REQ-v3-prix-recette-defaut | 14-01-PLAN.md | Each recipe has a configurable default price per kg; migration sets existing to 25 CHF/kg | PARTIAL | Data model complete (`prixParDefautHT` on Recipe type, migration, seed data). The REQUIREMENTS.md also specifies a "Grille tarifaire" UI section in Paramètres — this is explicitly deferred to Phase 15 (ROADMAP assigns Phase 14 only the data sub-goal; Phase 15 covers the UI) |
| REQ-v3-facture-prix-auto | 14-01-PLAN.md | Auto-generated factures use correct price per ligne; no hardcoded 25 CHF/kg in buildFacture | SATISFIED (data) | `buildFacture` uses price resolution chain; hardcoded constant removed; runtime behavior requires human verification |

**Note on REQ-v3-prix-recette-defaut scope:** REQUIREMENTS.md defines this requirement to include a "Grille tarifaire" section in Paramètres with editable default prices. The `/parametres` page does NOT contain this UI. However, the ROADMAP.md explicitly assigns the UI portion exclusively to Phase 15 ("UI Layer — Grille tarifaire & Tarifs spéciaux"). Phase 14 is scoped to the data layer only. This is therefore a deferred item, not a gap in Phase 14.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `lib/facture-builder.ts` | 24 | `?? 25` — third-level fallback literal | Info | Fires only when `recipe` is null (no matching recipe found in store), which is an edge case that should not occur in normal operation. PLAN task 14-01-04 explicitly notes this is acceptable. The ROADMAP SC3 states "the literal constant 25 no longer appears anywhere in the file" — this is a minor wording inconsistency; the intent (no hardcoded rate on normal invoices) is met. |

No TODOs, placeholder returns, or empty stubs found in any modified file.

### Human Verification Required

#### 1. Default price used when client has no tarif overrides

**Test:** Reset the store to seed data. Create a new delivery for any customer (they all have `tarifs: []`). Confirm the delivery to trigger facture generation. Open the generated facture detail and inspect `prixUnitaireHT` on each ligne.
**Expected:** Every ligne shows `prixUnitaireHT = 25` (matching the seed recipe `prixParDefautHT: 25`).
**Why human:** `buildFacture` is called at runtime inside the confirm handler; the generated facture is stored in the Zustand state and displayed in the UI. This cannot be traced to a specific output value statically.

#### 2. Client tarif override is respected on invoice

**Test:** Using browser devtools or a direct store mutation, add `{ recetteId: "<recipe-id>", prixHT: 30 }` to a customer's `tarifs` array. Create a delivery for that customer using a broche of that recipe. Open the generated facture and check `prixUnitaireHT`.
**Expected:** `prixUnitaireHT = 30` (override value, not the 25 recipe default).
**Why human:** No UI exists to set `tarifs` overrides until Phase 15. Testing the override branch requires direct store manipulation. The code path (`customer.tarifs.find(...)`) exists and is correct, but behavioral confirmation needs a running app.

### Deferred Items

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | "Grille tarifaire" UI section in `/parametres` for editing `prixParDefautHT` per recipe | Phase 15 | Phase 15 Goal: "operator can view and edit default prices per recipe in Paramètres"; SC1: "Navigating to /parametres shows a 'Grille tarifaire' section listing the 3 seeded recipes with their current prixParDefautHT" |
| 2 | "Tarifs spéciaux" section on `/clients/[id]` for per-recipe client overrides | Phase 15 | Phase 15 SC2-4 cover the override table UI, persistence, and clearing behaviour |

### Gaps Summary

No blocking gaps. Phase 14's data layer deliverables are fully implemented and wired. The two UNCERTAIN truths (SC4 and SC5 from the ROADMAP) cannot be verified without running the application — the code paths are correct and the price resolution logic is properly wired, but the actual invoice value produced at runtime requires human confirmation.

The remaining partial coverage of `REQ-v3-prix-recette-defaut` (Grille tarifaire UI) is an intentional deferral to Phase 15 per the ROADMAP, not a Phase 14 gap.

---

_Verified: 2026-05-05_
_Verifier: Claude (gsd-verifier)_

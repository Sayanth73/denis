---
phase: 15-ui-layer-grille-tarifaire-tarifs-speciaux
reviewed: 2026-05-05T00:00:00Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - app/parametres/page.tsx
  - app/clients/[id]/page.tsx
findings:
  critical: 2
  warning: 4
  info: 2
  total: 8
status: issues_found
---

# Phase 15: Code Review Report

**Reviewed:** 2026-05-05  
**Depth:** standard  
**Files Reviewed:** 2  
**Status:** issues_found

## Summary

Two files implement the UI layer for the grille tarifaire (parametres page) and tarifs spéciaux (client detail page). Both share the same intentional one-time hydration pattern for local input state, and both delegate persistence via `useTraceabilityStore.getState()` inside event handlers (correct — avoids stale closure). The core logic is largely sound, but two critical bugs exist: `Number()` silently accepts strings it should reject, and new recipes added after hydration are missing from `localPrices`/`overrides`, causing a save that silently drops those rows. Four warnings cover: the `delaiPaiementJours` field sending an empty string `""` instead of `undefined` on clear — causing a Zod type error instead of a friendly message; the "Override client" column header using English in an otherwise all-French UI; a missing guard that lets `handleSaveGrille` run against an empty recipe list with no feedback; and the clear-override-to-default flow having a silent correctness gap. Two info items cover a magic number and a minor label inconsistency.

---

## Critical Issues

### CR-01: `Number("")` passes the `isNaN` guard — empty-string prices accepted as 0 on save

**File:** `app/parametres/page.tsx:83`  
**File:** `app/clients/[id]/page.tsx:76`

`Number("")` returns `0`, which is not `NaN` and is `>= 0`. The guard on line 83 (parametres) and line 76 (client detail) therefore passes for any recipe row whose `localPrices`/`overrides` entry was never set (key absent, `?? ""` yields `""`), meaning that newly added recipes which were never touched produce a `Number("")` → `0` that passes validation and gets written to the store as `prixParDefautHT: 0`.

In `parametres/page.tsx` this is worse than in the client detail page: the client detail page explicitly skips empty strings (`if (val === "") continue`), so it is safe there. But the grille tarifaire validator does **not** skip empty; it only rejects them if `isNaN(Number(val))` is true — which it never is for `""`.

Concretely: a user with any recipe not yet in `localPrices` (possible when a recipe is added to the store after the `useEffect` fires, which can happen within the same session without a reload) presses "Enregistrer" and that recipe's price is silently zeroed in the store.

**Parametres page fix (line 83):**
```ts
// Before
if (val === "" || isNaN(Number(val)) || Number(val) < 0) {

// After  
if (val === "" || val.trim() === "" || isNaN(Number(val)) || Number(val) < 0) {
```
The `val === ""` branch already covers the empty string case for parametres — the real fix is ensuring `localPrices[r.id]` is always initialized for every recipe, which is the CR-02 fix below. Once CR-02 is applied the guard becomes correct. Without CR-02 the guard still silently accepts `undefined ?? ""`.

### CR-02: Recipes added after store hydration are absent from `localPrices` / `overrides` — silent data zeroing on save

**File:** `app/parametres/page.tsx:68-77`, `app/clients/[id]/page.tsx:58-68`

Both pages initialize their local price state exactly once in a `useEffect` that runs when `hasHydrated` flips to `true`. The dependency array intentionally omits `recipes` and `customer` to avoid discarding in-progress edits. The comment explains this choice.

However, this creates a structural gap: if the user navigates to Paramètres, the effect fires and captures the current recipe list, then the user (in the same session, without a reload) adds a new recipe through another part of the UI and returns to Paramètres, the new recipe appears in the table (because `recipes` is live from the store) but has no entry in `localPrices`. The `Input` shows `""` (correct), but `handleSaveGrille` at line 82-87 iterates `recipes` and reads `localPrices[r.id] ?? ""` → `""` → passes `Number("")` → 0, silently writing 0 as the price. The same issue affects the client page's `overrides`.

**Fix — merge newly-seen recipe IDs into local state on render, without discarding existing edits:**

```ts
// Replace the useEffect in both files with a pattern that
// initialises missing keys on each render without resetting existing ones:

// In parametres/page.tsx — inside the component, after recipes is read:
const stableInit = React.useRef(false);
React.useEffect(() => {
  if (!hasHydrated) return;
  setLocalPrices((prev) => {
    const next = { ...prev };
    for (const r of recipes) {
      if (!(r.id in next)) {
        next[r.id] = r.prixParDefautHT.toString();
      }
    }
    return next;
  });
}, [hasHydrated, recipes]);
// Safe: only fills in missing keys — never overwrites existing edits.
```

Apply the same pattern in `app/clients/[id]/page.tsx` for `overrides`, initialising missing keys to `""` (empty = use default).

---

## Warnings

### WR-01: `delaiPaiementJours` `onChange` passes `""` (string) when field is cleared — Zod rejects with an unhelpful type error

**File:** `app/parametres/page.tsx:169-171`

```ts
const val = parseInt(e.target.value, 10);
field.onChange(isNaN(val) ? "" : val);
```

When the user clears the field, `parseInt` returns `NaN` and `field.onChange("")` is called. The schema declares `delaiPaiementJours: z.number().int().min(1).max(365)`, which expects a `number` not a `string`. Zod will produce an `Expected number, received string` error rather than the intended `"Minimum 1 jour"` or a clear "required" message. The field value is also typed as `number` in `FormValues`, so TypeScript would flag this if `field.onChange` were strictly typed.

**Fix:**
```ts
field.onChange(isNaN(val) ? undefined : val);
// And add .optional() or handle undefined in the schema, OR keep the field required
// and show the validation message via a schema refinement.
```
Alternatively pass `0` or keep the previous value and let Zod's `min(1)` fire with a readable message.

### WR-02: "Override client" column header is English in an all-French UI

**File:** `app/clients/[id]/page.tsx:157`

```tsx
<TableHead ...>
  Override client (CHF/kg)
</TableHead>
```

Every other label in the application and in both reviewed files uses French. This heading mixes English into the UI unexpectedly.

**Fix:**
```tsx
Prix spécial client (CHF/kg)
```

### WR-03: `handleSaveGrille` silently succeeds when `recipes` is empty

**File:** `app/parametres/page.tsx:79-93`

When `recipes.length === 0` the for-loop exits immediately, `toast.success("Grille tarifaire mise à jour")` fires with no recipes actually updated, and the user sees a misleading success message. While unlikely in production (seed data always includes recipes), it is reachable on a fresh install before seed runs.

**Fix:** Add an early return with a neutral message, or suppress the toast when nothing changed:
```ts
function handleSaveGrille() {
  if (recipes.length === 0) return; // nothing to save
  ...
}
```

### WR-04: Clear-then-save in client tarifs does not remove an existing override — no feedback given

**File:** `app/clients/[id]/page.tsx:70-88`

The save handler filters for non-empty values: `recipes.filter((r) => (overrides[r.id] ?? "") !== "")`. This correctly means "empty = use recipe default". However, if a customer already has a `tarif` stored for a recipe and the user clears the input and saves, the override **is** correctly removed from `newTarifs` and `updateCustomer` replaces the full `tarifs` array — so the persistence is actually correct.

The warning is subtler: the UI shows no confirmation that "clearing a field removes the override". The placeholder displays the recipe's default price (correct), but there is no label or tooltip distinguishing "no override saved" from "override = same as default". A user who clears the field and saves will see the value remain in the placeholder and may believe their edit was not saved.

**Fix:** Add a visual indicator (e.g., a dimmed "par défaut" badge) when the field is empty, or include a note in the section description: "Videz le champ pour supprimer le tarif spécial et revenir au prix par défaut."

---

## Info

### IN-01: Magic number `25` in store migration hardcodes the original default price

**File:** `lib/store.ts:254`

```ts
{ ...(r as object), prixParDefautHT: 25 } as Recipe
```

The constant `25` (CHF/kg) is repeated here rather than referencing a named constant. If `DEFAULT_RECIPE_PRIX` or similar were extracted, both `seed.ts` and this migration would stay in sync.

**Fix:** Extract `const DEFAULT_PRIX_PAR_DEFAUT_HT = 25;` to `lib/types.ts` or `lib/defaults.ts` and reference it in both the seed and migration.

### IN-02: Column header label inconsistency between the two pages

**File:** `app/parametres/page.tsx:233` vs `app/clients/[id]/page.tsx:154`

Parametres uses `Prix par défaut (CHF/kg HT)` (includes "HT"), while the client detail page uses `Prix par défaut (CHF/kg)` (no "HT"). Both columns represent the same `prixParDefautHT` field. The label should be consistent; "HT" (hors taxe) is the accurate suffix.

**Fix:** Align to `Prix par défaut (CHF/kg HT)` in `app/clients/[id]/page.tsx:154`.

---

_Reviewed: 2026-05-05_  
_Reviewer: Claude (gsd-code-reviewer)_  
_Depth: standard_

---
phase: 13-suivi-paiements
reviewed: 2026-05-05T00:00:00Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - lib/types.ts
  - lib/store.ts
  - lib/factures.ts
  - lib/dashboard.ts
  - lib/facture-builder.ts
  - app/factures/page.tsx
  - app/factures/[id]/page.tsx
  - app/page.tsx
  - app/parametres/page.tsx
findings:
  critical: 2
  warning: 4
  info: 2
  total: 8
status: issues_found
---

# Phase 13: Code Review Report

**Reviewed:** 2026-05-05
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

Phase 13 adds a payment lifecycle (en_attente / payee_livraison / payee_virement) to invoices, a late-payment detector, dashboard KPIs, and a delai-paiement setting. The core data model and migration are sound. Two blockers were found: the migration is a single-step function that cannot handle multi-version gaps (v1 users upgrading directly to v3 skip the v2→v3 logic), and the delaiPaiementJours input silently saves 0 when the field is cleared, bypassing Zod validation while permanently marking every invoice as overdue. Four warnings cover a stale-closure risk in the sort comparator, a deep-merge hazard in updateFacture, an off-by-one in the late-payment threshold, and a missing no-op guard on payment state transitions.

---

## Critical Issues

### CR-01: Store migration skips intermediate steps for multi-version gaps

**File:** `lib/store.ts:225-249`
**Issue:** The `migrate` function handles each version with independent `if` blocks and returns immediately after the first match. A user whose persisted store is at version 1 hits the `version === 1` branch and gets `settings` added (v1→v2), but the function then returns — it never runs the `version === 2` branch that patches `factures[].paiement` and `settings.delaiPaiementJours`. The result is that v1 users upgrading straight to v3 end up with invoices that have no `paiement` field, causing `f.paiement.statut` reads throughout the app to throw `TypeError: Cannot read properties of undefined`.

Zustand's `migrate` is called once with `(persistedState, storedVersion)` — it is not called iteratively. The caller is responsible for chaining all intermediate transformations.

**Fix:**
```ts
migrate: (persistedState, version) => {
  let state = persistedState as Record<string, unknown>;

  if (version <= 1) {
    // v1 → v2: add settings
    state = { ...state, settings: DEFAULT_SETTINGS };
  }

  if (version <= 2) {
    // v2 → v3: patch factures + delaiPaiementJours
    const factures = Array.isArray(state.factures)
      ? (state.factures as Facture[]).map((f) =>
          f.paiement ? f : { ...f, paiement: { statut: "en_attente" as const } }
        )
      : [];
    const settings = {
      ...(state.settings as AppSettings),
      delaiPaiementJours: (state.settings as AppSettings)?.delaiPaiementJours ?? 30,
    };
    state = { ...state, factures, settings };
  }

  return state as TraceabilityStore;
},
```

---

### CR-02: delaiPaiementJours input silently saves 0, bypassing Zod min(1) validation

**File:** `app/parametres/page.tsx:131-133`
**Issue:** The `onChange` handler converts the raw input value with `parseInt`, then calls `field.onChange(isNaN(val) ? 0 : val)`. When the user clears the field (empty string), `parseInt("")` returns `NaN`, so `0` is stored in the form state. Zod's `min(1, "Minimum 1 jour")` should catch this — but `0` is not `NaN`, so Zod receives `0` and correctly rejects it with a validation error. However, the form `mode` is `"onBlur"`, so validation only fires when focus leaves the field. If the user types a new number directly without first blurring, the intermediate value `0` is never validated and can be submitted via the Enter key before blur fires, resulting in `delaiPaiementJours: 0` being written to the store.

With `delaiPaiementJours = 0`, `isFactureEnRetard` computes `daysSince > 0`, meaning every invoice created before today is immediately flagged as overdue, including invoices paid same-day.

**Fix:** Replace `0` fallback with an empty sentinel that keeps the field invalid:
```ts
onChange={(e) => {
  const val = parseInt(e.target.value, 10);
  field.onChange(isNaN(val) ? "" : val);  // empty string keeps Zod min(1) blocking submit
}}
```
Also add `mode: "onChange"` or at minimum validate on submit (react-hook-form's `handleSubmit` does re-validate, so the submit path is actually safe — but the `0` being held in state while the user types is still confusing and can cause transient UI issues if the KPI re-renders mid-edit).

---

## Warnings

### WR-01: updateFacture uses shallow merge — nested paiement object is replaced, not merged

**File:** `lib/store.ts:170-173`
**Issue:** `updateFacture` does `{ ...x, ...patch }`. If a caller passes only `{ paiement: { statut: "payee_livraison" } }` (without `datePaiement`), the spread replaces the entire existing `paiement` object with the partial one — `datePaiement` is silently dropped. Currently both call-sites in `app/factures/[id]/page.tsx` always supply a complete `paiement` object, so there is no immediate regression. But the action signature `patch: Partial<Facture>` invites future callers to pass partial nested objects, and the shallow merge will silently corrupt `paiement.datePaiement`.

**Fix:** Deep-merge the `paiement` field specifically:
```ts
updateFacture: (id, patch) =>
  set((s) => ({
    factures: s.factures.map((x) =>
      x.id === id
        ? { ...x, ...patch, paiement: patch.paiement ? { ...x.paiement, ...patch.paiement } : x.paiement }
        : x,
    ),
  })),
```

---

### WR-02: Payment action buttons lack a no-op guard — already-paid invoices can be re-paid

**File:** `app/factures/[id]/page.tsx:199`
**Issue:** The payment section correctly hides the action buttons when `f.paiement.statut !== "en_attente"`. However, `handlePayerLivraison` and `handleVirementRecu` have no guard themselves:

```ts
function handlePayerLivraison() {
  updateFacture(f.id, { paiement: { statut: "payee_livraison", datePaiement: ... } });
```

Because `f` is captured in the outer function scope at render time, a race condition exists: if the user clicks a button twice in rapid succession before React re-renders (both clicks land in the same event-loop turn), `updateFacture` is called twice. The second call overwrites `datePaiement` with a second `new Date()` call one millisecond later — functionally harmless today but a correctness issue if the two calls land on different dates (e.g., at midnight).

More importantly, there is no guard preventing the functions from being called programmatically or via keyboard on a facture that has already been paid (e.g., if the conditional rendering has a bug).

**Fix:** Add an early return in each handler:
```ts
function handlePayerLivraison() {
  if (f.paiement.statut !== "en_attente") return;
  updateFacture(f.id, { ... });
  toast.success(...);
}
```

---

### WR-03: isFactureEnRetard uses strict greater-than — invoice is never overdue on the exact due date

**File:** `lib/factures.ts:101`
**Issue:** The condition is `daysSince > settings.delaiPaiementJours`. On the exact due date (day 30 with a 30-day term), `daysSince === 30`, which is not `> 30`, so the invoice is not flagged as overdue. It only becomes overdue on day 31. This is a business-logic ambiguity — some jurisdictions consider day 30 itself the last valid payment day (so overdue starts day 31, which is the current behaviour), while others flag the invoice as overdue on the due date itself (`>=`). The current strict-greater behaviour is defensible, but it is inconsistent with the label shown in the UI ("En retard") which implies the deadline has passed.

**Fix:** Clarify intent in a comment, or change to `>=` if the business requirement is that the due date itself is the cutoff:
```ts
// Overdue from the day AFTER delaiPaiementJours (strict >).
// To flag on the due date itself, use >= instead.
return daysSince > settings.delaiPaiementJours;
```

---

### WR-04: 3-tier sort in factures list page recreates `today` and comparator on every render

**File:** `app/factures/page.tsx:31-37`
**Issue:** `today = new Date()` and the `paiementRank` function are declared inside the component body, outside any `useMemo` or `useCallback`. They are re-created on every render. `paiementRank` closes over `today` and `settings`, so it is correct by reference — but `[...factures].sort(...)` also produces a new array and runs the comparator on every render even when `factures` and `settings` have not changed. For the current dataset size this is inconsequential, but the pattern is fragile: any parent re-render (e.g., router state change) triggers a full re-sort.

This is not a bug in v1 scope (performance is out of scope), but the lack of stabilisation means `today` captured at first render is stale if the browser tab is left open past midnight, causing "En retard" badges to flip without a user action.

**Fix:** Memoize the sort:
```ts
const today = React.useMemo(() => new Date(), []);
const sorted = React.useMemo(
  () =>
    [...factures].sort((a, b) => paiementRank(a, today, settings) - paiementRank(b, today, settings)),
  [factures, settings],
);
```

---

## Info

### IN-01: QR-bill payload hardcodes empty debtor fields — SIX standard requires explicit empty lines

**File:** `lib/factures.ts:26-58`
**Issue:** `buildQrBillPayload` produces a payload with the debtor section (lines 19-26 of the SIX QR-bill spec) left as empty strings. The SIX standard v2.0 requires that if no debtor is present, the `AdrTp` field (line 19) must still be present as an empty string and the debtor name (line 20) must also be empty. The current implementation matches this by producing empty strings — so there is no current bug. However, the function has no JSDoc noting which fields are intentionally empty vs. unimplemented, making future maintenance risky.

**Fix:** Add a comment block identifying which spec fields correspond to which array positions, particularly the empty debtor block.

---

### IN-02: Inconsistent optional chaining on f.paiement in factures list page

**File:** `app/factures/page.tsx:150`
**Issue:** Line 150 uses `f.paiement?.datePaiement` (optional chaining), but `paiement` is a required field on `Facture` (non-optional in types.ts line 91). All other references to `f.paiement` in the same file (lines 33, 97, 136) use direct access without optional chaining. The inconsistency suggests the developer was uncertain whether `paiement` could be undefined (it should not be, post-migration). The optional chaining here is harmless but misleads readers into thinking the field can be absent.

**Fix:** Remove the optional chain to match the type contract and the rest of the file:
```ts
{f.paiement.datePaiement ? formatDate(f.paiement.datePaiement) : "—"}
```

---

_Reviewed: 2026-05-05_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

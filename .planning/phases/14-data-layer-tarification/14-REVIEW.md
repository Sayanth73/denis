---
phase: 14-data-layer-tarification
reviewed: 2026-05-05T00:00:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - lib/types.ts
  - lib/store.ts
  - lib/facture-builder.ts
  - lib/seed.ts
  - components/livraisons/deliveries-table.tsx
  - components/clients/client-dialog.tsx
findings:
  critical: 3
  warning: 3
  info: 1
  total: 7
status: issues_found
---

# Phase 14: Code Review Report

**Reviewed:** 2026-05-05T00:00:00Z
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

This phase introduces per-recipe pricing (`prixParDefautHT` on `Recipe`, `tarifs` on `Customer`) and wires it through `buildFacture`. The data model additions are sound. However, three critical defects were found: a migration guard that returns `undefined` (crashing Zustand's persist middleware for future schema versions), a duplicate-invoice number bug caused by reading `factures.length` before `addFacture` is committed to state, and a non-atomic confirmation flow that leaves data in a corrupted half-state if the store update for products succeeds but the facture creation fails. Three warnings cover the missing guard for a customer not found (non-null assertion crash), the seed returning zero factures for its one delivered livraison (demo inconsistency), and the `tva` field storing a rate rather than an amount (type contract mismatch).

---

## Critical Issues

### CR-01: `migrate()` returns `undefined` for future schema versions — crashes Zustand hydration

**File:** `lib/store.ts:226`
**Issue:** When a persisted store has `version > 4` (e.g., after a future schema bump raises the version to 5), `migrate()` returns `undefined`. Zustand's `persist` middleware types `migrate` as `(persistedState: unknown, version: number) => PersistedState | Promise<PersistedState>` — `undefined` is not a valid return value. In practice Zustand will attempt to spread `undefined` into state, throwing a runtime TypeError and breaking the entire application on every page load for any user who has cached data from a newer schema. The intent was presumably "do nothing / pass through", but `undefined` achieves the opposite.

**Fix:** Return the persisted state unchanged when the version is ahead of the current schema:
```ts
if (version > 4) return persistedState as TraceabilityStore;
```

---

### CR-02: Facture sequence number is not collision-safe — concurrent or rapid confirmations produce duplicate `numeroFacture`

**File:** `components/livraisons/deliveries-table.tsx:85`  
**File:** `components/livraisons/new-delivery-dialog.tsx:111`

**Issue:** Both call sites pass `factures.length` (snapshot before `addFacture`) to `buildFacture(... factureCount)`, which then computes `factureCount + 1` as the sequence number. Because each call reads the length of the array _before_ its own facture is added, two factures created in the same session will receive the same sequence number when the second one is created using a stale length. More concretely: if the store already has 2 factures and the user creates a delivery via `new-delivery-dialog` (reads `length=2`, generates `F-2026-0003`), then immediately confirms another via `deliveries-table` (also reads `length=2` from a snapshot taken before the first `addFacture` is reflected), it also generates `F-2026-0003`. In a single-tab synchronous JS environment this is less likely, but the pattern is fundamentally wrong: the sequence number must be derived after the store mutation commits.

**Fix:** Derive the next sequence inside the `addFacture` action (or read the live state immediately after `addFacture` to get the assigned number):
```ts
// In store.ts — derive a monotonic counter inside the action:
addFacture: (f) =>
  set((s) => {
    // Optionally re-sequence here to guarantee uniqueness
    return { factures: [...s.factures, f] };
  }),
```
Or, at call sites, snapshot state _after_ all prior mutations and use `get().factures.length`:
```ts
store.addDelivery(delivery);
// ... other mutations ...
const nextSeq = useTraceabilityStore.getState().factures.length; // post-mutation snapshot
const facture = buildFacture(..., nextSeq);
store.addFacture(facture);
```
The cleanest long-term fix is to generate the invoice number inside `addFacture` using the post-push array length.

---

### CR-03: Non-atomic confirmation — partial state corruption if `buildFacture` or `addFacture` throws

**File:** `components/livraisons/deliveries-table.tsx:66-87`

**Issue:** `handleConfirmLivree` performs three separate store mutations:
1. `updateFinishedProduct` for each broche (loop, lines 66-71)
2. `updateDelivery` (line 72)
3. `addFacture` (line 87)

If `buildFacture` throws (e.g., `customer` is undefined — see CR-03 note below — or `getRecipeForBroche` fails), operations 1 and 2 have already mutated the store: all broches are now permanently marked `"livree"` and the delivery is `"livree"`, but no facture exists. The UI will hide the "Marquer comme livrée" button (statut is now `"livree"`), making recovery impossible without a full reset.

**Fix:** Construct the facture object _before_ mutating the store, then apply all three mutations only if `buildFacture` succeeds:
```ts
function handleConfirmLivree() {
  if (!pendingDelivery) return;
  const store = useTraceabilityStore.getState();
  const customer = store.customers.find((c) => c.id === pendingDelivery.customerId);
  if (!customer) {
    toast.error("Client introuvable — livraison annulée.");
    return;
  }

  // Build first — throw before any mutation
  const facture = buildFacture(
    pendingDelivery.id,
    pendingDelivery.customerId,
    pendingDelivery.brochesLivrees,
    store.finishedProducts,
    store.productionOrders,
    store.recipes,
    customer,
    store.factures.length,
  );

  // Only mutate if buildFacture succeeded
  for (const fpId of pendingDelivery.brochesLivrees) {
    store.updateFinishedProduct(fpId, { statut: "livree", livraisonId: pendingDelivery.id });
  }
  store.updateDelivery(pendingDelivery.id, { statut: "livree" });
  store.addFacture(facture);
  toast.success(`Livraison confirmée — Facture ${facture.numeroFacture} générée`);
  setPendingDeliveryId(null);
}
```

---

## Warnings

### WR-01: Non-null assertion on `customer` will crash if customer is deleted between delivery creation and confirmation

**File:** `components/livraisons/deliveries-table.tsx:76`

**Issue:** `const customer = customers.find(...) !;` — the `!` asserts the customer will always be found. If the customer record was deleted from the store between when the delivery was created and when "Marquer comme livrée" is clicked, `customer` will be `undefined` and the `!` suppresses the TypeScript error. `buildFacture` will then receive `undefined` as its `customer` argument, causing `customer.tarifs.find(...)` to throw at line 23 of `facture-builder.ts`.

Note: This crash also causes the partial-state corruption described in CR-03. Both issues reinforce each other.

**Fix:** Add an explicit guard before the assertion (shown in the CR-03 fix above).

---

### WR-02: Migration v1→v2 block does not run when upgrading from v1 to v4 — settings field is absent

**File:** `lib/store.ts:229-232`

**Issue:** The migration blocks use `if (version <= N)` but they are independent `if` statements, not `else if`. This means a v1 user upgrading to v4 correctly runs all three blocks (v1→v2, v2→v3, v3→v4). However, the v1→v2 block at line 230-232 sets `s = { ...s, settings: DEFAULT_SETTINGS }`. Then the v2→v3 block at line 241-245 reads `s.settings as AppSettings` — which is the freshly-added DEFAULT_SETTINGS. This chain is actually correct. The real problem is at line 241-243:

```ts
const settings = {
  ...(s.settings as AppSettings ?? DEFAULT_SETTINGS),
  delaiPaiementJours: (s.settings as AppSettings)?.delaiPaiementJours ?? 30,
};
```

The outer `??` operator has lower precedence than `as`, so `(s.settings as AppSettings ?? DEFAULT_SETTINGS)` is parsed as `(s.settings as AppSettings) ?? DEFAULT_SETTINGS`. If `s.settings` is a truthy-but-empty object `{}`, the `??` short-circuits and the spread of `{}` produces `{ delaiPaiementJours: 30 }` — but `iban`, `nomCreancier`, `adresseLigne1`, `adresseLigne2` are all absent. For a v2 user who had a settings object that predates `delaiPaiementJours`, the four base fields are preserved by the spread. But for a v1 user whose `settings` was set to `DEFAULT_SETTINGS` in the v1→v2 block, this is correct. The actual failure mode: if `s.settings` is `null` or `undefined` (possible if the partialize function was changed), the `??` fallback to `DEFAULT_SETTINGS` never triggers because `s.settings as AppSettings` is typed, not runtime-checked — at runtime `null as AppSettings` is still `null`, so the spread throws `Cannot spread null`.

**Fix:** Use a runtime nullish check:
```ts
const existingSettings = (s.settings != null && typeof s.settings === "object")
  ? s.settings as AppSettings
  : DEFAULT_SETTINGS;
const settings = {
  ...existingSettings,
  delaiPaiementJours: existingSettings.delaiPaiementJours ?? 30,
};
```

---

### WR-03: Seed data produces a `"livree"` delivery with no corresponding facture — violates domain invariant

**File:** `lib/seed.ts:243-265`

**Issue:** The seed creates a delivery with `statut: "livree"` (line 249) and marks three broches as `"livree"` (lines 238-241), but returns `factures: [] as Facture[]` (line 264). This is inconsistent with the domain rule that every confirmed delivery must have an auto-generated facture. The application's KPI dashboard and factures list will show zero invoices despite one completed delivery. The "Suivi des paiements" screen will also show no receivables. Any feature that joins deliveries to factures by `livraisonId` will find no match for the seeded delivery.

**Fix:** Generate the seed facture in `buildSeed` using `buildFacture`. Since `buildFacture` takes a `Customer`, `recipes`, etc., these are all available in the seed function. Call `buildFacture` after constructing the delivery and include the result in the returned `factures` array:
```ts
import { buildFacture } from "./facture-builder";

// After constructing deliveries:
const seedCustomer = customers[0]; // customerKebabRoyalId
const seedFacture = buildFacture(
  deliveryId,
  customerKebabRoyalId,
  deliveredBrocheIds,
  finishedProducts,
  productionOrders,
  recipes,
  seedCustomer,
  0, // factureCount = 0, produces F-YYYY-0001
);

return {
  ...
  factures: [seedFacture],
};
```

---

## Info

### IN-01: `tva` field stores a rate (0.081) but `FactureLigne` and UI consumers may expect an amount

**File:** `lib/facture-builder.ts:43-44`  
**File:** `lib/types.ts:91`

**Issue:** `Facture.tva` is typed as `number` with no documentation of whether it represents a rate or a CHF amount. `buildFacture` stores `TVA = 0.081` (the rate) in `tva`, not `totalHT * 0.081` (the CHF amount). Any component rendering "TVA: {facture.tva} CHF" will display `0.081` — clearly wrong. Whether this is a display bug depends on how consumers use the field, but the ambiguity is a latent defect.

**Fix:** Clarify via the type or the field name. The most explicit option is to store the monetary amount:
```ts
// In facture-builder.ts
const tvaMontant = totalHT * TVA;
return {
  ...
  tva: tvaMontant,          // CHF amount, not a rate
  totalTTC: totalHT + tvaMontant,
};
```
And update `lib/types.ts` with an inline comment:
```ts
tva: number;  // CHF amount (not a rate); = totalHT * 0.081
```

---

_Reviewed: 2026-05-05T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

---
phase: 02-domain-model-zustand-store-seed-data
reviewed: 2026-05-04T00:00:00Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - lib/types.ts
  - lib/lot-number.ts
  - lib/dlc.ts
  - lib/seed.ts
  - lib/store.ts
  - app/providers.tsx
  - app/layout.tsx
  - components/ui/alert-dialog.tsx
  - components/layout/reset-button.tsx
findings:
  blocker: 0
  warning: 3
  total: 3
status: clean
resolved_at: 2026-05-04T00:00:00Z
---

# Phase 2: Code Review Report

**Reviewed:** 2026-05-04T00:00:00Z
**Depth:** standard
**Files Reviewed:** 9
**Status:** clean (resolved 2026-05-04)

## Summary

Phase 2 lays a clean and disciplined data substrate: domain types are verbatim from PRD §3, the lot-number generator is UTC-locked and range-checked, `dlcColor` boundary logic correctly maps PRD §6 thresholds (verified at 0/1/5/6/-1 days), and the seed's `quantiteRestante` = `quantiteRecue - sum(quantiteUtilisee)` arithmetic is internally consistent across all four consumed RM lots (epaule 80-45=35, gigot 40-18=22, epices 12-4=8, poulet 60-32=28). Recipe percentages each sum to 100 and the back-patching of three `order1` broches to `statut: "livree"` correctly relies on shared object references between `productionOrders[].brochesProduites[]` and the flat `finishedProducts[]` array (the noted-intentional duplicate references). No `any` casts, no hardcoded secrets, no debug artifacts, no dangerous DOM sinks, and `localStorage` is correctly accessed only via lazy `createJSONStorage` plus a `typeof window !== "undefined"` guard in `resetToSeed`.

Three warnings surface around persist/rehydration robustness and input validation in the helper layer. None are blockers for a POC, but each will compound if left unaddressed when later phases start trusting these primitives.

## Warnings

### WR-01: `onRehydrateStorage` swallows rehydration failures, leaving `hasHydrated` permanently `false` and the app empty

**File:** `lib/store.ts:194-197`
**Issue:** The rehydration callback ignores its `error` parameter. Zustand's `persist` middleware invokes the inner callback with signature `(state, error) => void`. If `localStorage` contains malformed JSON for `tracekebab-store-v1` (manual edit, half-written entry from a previous tab crash, schema drift across `v1`→`v2`, or a third-party storage clearer that left a truncated value), `state` is `undefined`, the optional chain `state?.setHasHydrated(true)` is a no-op, `hasHydrated` stays `false` forever, `<SeedProvider>`'s `useEffect` guard `if (hasHydrated)` never fires, and the user sees a permanently empty app with no way to recover except DevTools. This silently defeats the whole "seed on empty storage" acceptance criterion under the exact conditions where the user most needs the safety net.
**Fix:**
```ts
onRehydrateStorage: () => (state, error) => {
  if (error) {
    // Corrupted persisted data — wipe it so the next tick falls into seedIfEmpty.
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }
  // Always flip the flag so SeedProvider can run; on error the store holds
  // initialState (empty arrays), so seedIfEmpty() will repopulate cleanly.
  useTraceabilityStore.setState({ hasHydrated: true });
},
```

<resolution status="fixed" commit="b8585c3" resolved_at="2026-05-04T00:00:00Z">
The rehydration callback now binds the `error` parameter and, when truthy, logs a `console.warn` with the underlying error, removes `STORAGE_KEY` from `window.localStorage` (guarded by `typeof window !== "undefined"`), and forces `useTraceabilityStore.setState({ hasHydrated: true })` so `<SeedProvider>` falls through to `seedIfEmpty()` and repopulates from the empty initial state. Verified during `npm run build`: SSR static generation triggers the error branch (Next.js' SSR localStorage shim has no `getItem`), the warn fires, and all 10 pages still pre-render — proving the fallback path executes without blocking.
</resolution>

### WR-02: `persist` config has no `version` field — any future shape change silently corrupts state instead of triggering migration

**File:** `lib/store.ts:182-198`
**Issue:** The persist options omit `version` (and therefore also `migrate`). Today the storage key is hand-versioned via `STORAGE_KEY = "tracekebab-store-v1"`, but renaming the key on every breaking change forces every existing user to lose all their data with no path to migrate. More importantly: when phase 3+ inevitably extends a domain type (e.g. adds a field to `RawMaterial`), zustand will rehydrate old objects into the new schema with missing fields as `undefined`, and the type system will not catch it because `persist` returns `Partial<T>` shaped data merged into the initial state. Downstream `.map`/`.filter` calls that read the new field will see `undefined` and either crash or render blanks. Setting `version: 1` now is free; not setting it forecloses the option.
**Fix:**
```ts
persist(
  (set, get) => ({ ...initialState, /* actions */ }),
  {
    name: STORAGE_KEY,
    version: 1,
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({ /* … */ }),
    onRehydrateStorage: () => (state, error) => { /* … */ },
    migrate: (persistedState, version) => {
      // v1 is the baseline; future phases add cases here.
      return persistedState as TraceabilityStore;
    },
  },
)
```

<resolution status="fixed" commit="d8387ce" resolved_at="2026-05-04T00:00:00Z">
Added `version: 1` to the persist config (with a one-line French comment documenting the bump-on-shape-change contract) and a `migrate(persistedState, version)` stub that returns `persistedState as TraceabilityStore` when `version === 1` and `undefined` otherwise. Returning `undefined` causes zustand persist to fall back to the initial empty state, which re-fires `seedIfEmpty()` on the next mount — exactly the recovery path the reviewer asked for. `npx tsc --noEmit` exits 0.
</resolution>

### WR-03: `generateLotNumber` does not validate the `Date` argument — invalid dates produce `TK-NaN-NaNNaN-001` lot numbers silently

**File:** `lib/lot-number.ts:7-18`
**Issue:** The function only validates `sequence`. If a caller passes an `Invalid Date` (e.g. `new Date("2026-13-45")`, `new Date(undefined)`, or a `Date` parsed from user-entered text in phase 4's wizard), `getUTCFullYear()`, `getUTCMonth()`, and `getUTCDate()` all return `NaN`. `NaN.toString()` is `"NaN"` and `"NaN".padStart(2, "0")` is `"NaN"`, producing the lot number `TK-NaN-NaNNaN-001` with no error thrown. This silently writes garbage into `numeroLotInterne` — a field that is later embedded in QR codes and traceability lookups (Phase 7). Range-checking `sequence` while leaving `date` un-validated is asymmetric and surprising.
**Fix:**
```ts
export function generateLotNumber(date: Date, sequence: number): string {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new RangeError(`generateLotNumber: invalid date argument`);
  }
  if (!Number.isInteger(sequence) || sequence < 1 || sequence > 999) {
    throw new RangeError(
      `generateLotNumber: sequence must be an integer in [1, 999], got ${sequence}`,
    );
  }
  // … unchanged
}
```

<resolution status="fixed" commit="ad6f9d9" resolved_at="2026-05-04T00:00:00Z">
Added a Date validation guard at the top of `generateLotNumber` that throws `new Error("Date invalide pour le numéro de lot")` when the argument is not a `Date` instance or `Number.isNaN(date.getTime())` is true. Used a plain `Error` with the French-language message exactly as specified in the finding's fix guidance (rather than the `RangeError` shown in the example block). The existing sequence range check is preserved unchanged. `npx tsc --noEmit` exits 0; build pipeline still produces all 10 static pages.
</resolution>

---

_Reviewed: 2026-05-04T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

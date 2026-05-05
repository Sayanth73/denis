---
phase: 20-mobile-ux
reviewed: 2026-05-05T00:00:00Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - components/ui/sheet.tsx
  - components/layout/mobile-nav.tsx
  - components/layout/sidebar.tsx
  - components/layout/header.tsx
  - app/layout.tsx
  - components/clients/clients-table.tsx
  - components/production/ordre-fabrication-table.tsx
  - components/livraisons/deliveries-table.tsx
  - components/matieres/raw-materials-table.tsx
  - app/factures/page.tsx
  - components/clients/client-dialog.tsx
  - components/production/recette-dialog.tsx
  - components/production/production-wizard.tsx
  - components/livraisons/new-delivery-dialog.tsx
  - components/matieres/reception-dialog.tsx
findings:
  critical: 3
  warning: 4
  info: 0
  total: 7
status: issues_found
---

# Phase 20: Code Review Report

**Reviewed:** 2026-05-05
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

This phase introduces mobile UX improvements: a Sheet-based mobile nav drawer, responsive dialog sizing (`mx-4 w-[calc(100%-2rem)]`), and horizontal scroll on all data tables. The structural changes are largely sound. However, three pre-existing bugs surfaced in the files under review — two are data-correctness blockers not introduced by this phase but now visible through wider code coverage. One timezone bug is specific to the DLC date-picker disabled logic introduced or stabilised in this phase's scope.

---

## Critical Issues

### CR-01: Double Facture Created Per Delivery

**File:** `components/livraisons/new-delivery-dialog.tsx:109-119` and `components/livraisons/deliveries-table.tsx:73-91`

**Issue:** A facture is created at two points in the delivery lifecycle:
1. `new-delivery-dialog.tsx` calls `buildFacture` + `store.addFacture` when creating a delivery with `statut: "preparee"` (line 109-119).
2. `deliveries-table.tsx` `handleConfirmLivree` calls `buildFacture` + `store.addFacture` a second time when the user clicks "Marquer comme livrée" (lines 73-91).

The store's `addFacture` performs no deduplication check (it simply appends). The result is two factures for every delivery: one at preparation, one at confirmation. The factures page will list both, with potentially different `numeroFacture` values and different `totalHT` (if stock data changes between the two calls).

**Fix:** Pick one authoritative point to create the facture. The most consistent choice is at "Marquer comme livrée" (the `deliveries-table.tsx` confirm action), since that is when delivery is irrevocable. Remove the `buildFacture`/`addFacture` call entirely from `new-delivery-dialog.tsx` `onSubmit`:

```typescript
// new-delivery-dialog.tsx onSubmit — remove these lines:
// const factureCount = useTraceabilityStore.getState().factures.length;
// const facture = buildFacture(...);
// store.addFacture(facture);
// toast.success(`... Facture ${facture.numeroFacture} générée`);

// Replace toast with:
toast.success(`Livraison préparée — confirmez la livraison pour générer la facture`);
```

---

### CR-02: Customer Name Collision Silently Assigns Wrong Customer ID

**File:** `components/livraisons/new-delivery-dialog.tsx:152-153`

**Issue:** The `customerId` field uses a `Combobox` that works with customer names as string values. The `onChange` callback resolves a name back to an ID using:

```typescript
const found = customers.find((c) => c.nom === name);
field.onChange(found?.id ?? "");
```

`Array.find` returns the first match. If two customers share the same `nom`, the delivery is silently assigned to the first customer in store order, not the one the user selected. There is no uniqueness enforcement on `Customer.nom` in the schema or in `client-dialog.tsx`. The form validation only checks `customerId.min(1)` — it cannot detect the wrong-ID scenario.

**Fix:** Replace the name-based `Combobox` with one that operates on IDs and renders names as labels, or enforce unique names at creation time. Minimum viable fix:

```typescript
// In client-dialog.tsx onSubmit (create mode), check for name collision before adding:
const existing = store.customers.find((c) => c.nom.trim() === values.nom.trim());
if (existing) {
  form.setError("nom", { message: "Un client avec ce nom existe déjà." });
  return;
}
```

---

### CR-03: DLC DatePicker Disabled Logic Uses UTC Midnight vs. Local Midnight — Blocks Valid Dates for UTC+ Users

**File:** `components/matieres/reception-dialog.tsx:207-210`

**Issue:** The DLC calendar's `disabled` function compares dates using mismatched time representations:

```typescript
disabled={(d) => {
  if (!dateReceptionValue) return false;
  const recep = new Date(`${dateReceptionValue}T00:00:00.000Z`); // UTC midnight
  return d.getTime() <= recep.getTime();
}}
```

`react-day-picker` (used inside `Calendar`) passes `Date` objects at **local midnight** when checking disabled dates. For a user in UTC+2 on a day where `dateReceptionValue = "2026-05-05"`:

- `recep` = `2026-05-05T00:00:00Z` = timestamp 1746403200000
- The day `2026-05-06` local midnight = `2026-05-05T22:00:00Z` = timestamp 1746475200000 - ... actually the next valid date `2026-05-06` in local time midnight = `2026-05-05T22:00:00Z`

Wait — more precisely: in UTC+2, `2026-05-06T00:00:00` local = `2026-05-05T22:00:00Z`. The check `d.getTime() <= recep.getTime()` evaluates `2026-05-05T22:00:00Z <= 2026-05-05T00:00:00Z` which is false, so May 6 is correctly enabled.

However for UTC-2 (behind UTC): `2026-05-06T00:00:00` local = `2026-05-06T02:00:00Z`. The check becomes `2026-05-06T02:00:00Z <= 2026-05-05T00:00:00Z` — false, so May 6 is enabled. The issue occurs differently: `2026-05-05` local midnight = `2026-05-05T02:00:00Z`. Check: `2026-05-05T02:00:00Z <= 2026-05-05T00:00:00Z` = false, so May 5 (same day as reception) would NOT be disabled — but it should be (DLC must be strictly after reception).

The `isoToDate` helper in `date-picker.tsx` line 21 also uses `T00:00:00.000Z` (UTC) for the selected value display, creating a further inconsistency with react-day-picker's local-time Date objects.

**Fix:** Normalise `d` to UTC midnight before comparing:

```typescript
disabled={(d) => {
  if (!dateReceptionValue) return false;
  const recep = new Date(`${dateReceptionValue}T00:00:00.000Z`);
  const dUtc = new Date(`${d.toISOString().slice(0, 10)}T00:00:00.000Z`);
  return dUtc.getTime() <= recep.getTime();
}}
```

---

## Warnings

### WR-01: `today` Memoized at Mount — Stale Status After Midnight

**File:** `components/matieres/raw-materials-table.tsx:88`

**Issue:**

```typescript
const today = React.useMemo(() => new Date(), []);
```

`today` is computed once when the component mounts and never updated. The empty dependency array is intentional but means `deriveStatut(rm, today)` uses a stale date if the app remains open past midnight. A batch of raw materials whose DLC is today will show "Actif" the morning after they should have shown "DLC dépassée".

**Fix:** Remove the memo and let `today` recompute on each render (it is cheap), or use a clock-tick context. Simplest fix:

```typescript
const today = new Date();
```

---

### WR-02: `overflow-x-auto overflow-hidden` on the Same Element Is Contradictory

**File:** `components/clients/clients-table.tsx:49`, `components/production/ordre-fabrication-table.tsx:44`, `components/livraisons/deliveries-table.tsx:100`, `components/matieres/raw-materials-table.tsx:135`, `app/factures/page.tsx:50`

**Issue:** All five table containers apply both `overflow-x-auto` and `overflow-hidden` to the same `<div>`. These classes are contradictory: `overflow-hidden` sets the CSS shorthand `overflow: hidden` (both axes), while `overflow-x-auto` sets `overflow-x: auto`. The effective behaviour depends entirely on the order Tailwind generates these utilities in the output stylesheet. Currently Tailwind v3 places axis-specific utilities after shorthand utilities in its generated CSS, so `overflow-x-auto` wins — but this is fragile and relies on undocumented ordering. A Tailwind upgrade or config change could silently break horizontal scrolling on all tables.

**Fix:** Replace `overflow-x-auto overflow-hidden` with `overflow-x-auto overflow-y-hidden` to be explicit about both axes:

```html
<div class="rounded-md border bg-background overflow-x-auto overflow-y-hidden">
```

---

### WR-03: `void values` Dead Parameter in `handleStep1Next`

**File:** `components/production/production-wizard.tsx:68`

**Issue:**

```typescript
function handleStep1Next(values: Step1Values) { void values; setStep(2); }
```

The `values` parameter is passed by `react-hook-form`'s `handleSubmit` and intentionally discarded — the wizard reads live values via `form.watch()` instead. The `void values` expression suppresses a TypeScript/ESLint unused-variable warning. This is a code smell: it hides the design decision and may confuse future maintainers into thinking `values` is used.

**Fix:** Name the parameter with a leading underscore (conventional for intentionally unused parameters):

```typescript
function handleStep1Next(_values: Step1Values) { setStep(2); }
```

---

### WR-04: Mobile Nav Closes on Any Click Inside the Nav Element, Not Just Link Clicks

**File:** `components/layout/mobile-nav.tsx:37`

**Issue:**

```tsx
<nav
  className="flex flex-col gap-1 px-2 py-4"
  onClick={() => setOpen(false)}
>
```

A click handler on the `<nav>` wrapper fires for any bubbling click event within it, not only clicks on `<NavItem>` links. If future items (e.g. an accordion section, a badge, or a non-link button) are added to the nav, clicking them will also dismiss the sheet. This creates a maintenance trap: adding non-navigation elements to the mobile nav will introduce a subtle UX regression.

**Fix:** Move the close logic into `NavItem` itself (via an `onNavigate` prop), or use Next.js router events to detect actual navigation and close on route change:

```typescript
// In mobile-nav.tsx, replace onClick on <nav> with nothing.
// In nav-item.tsx, accept an optional onClick and forward it through <Link>:
<Link href={route} onClick={onNavigate} ...>
```

---

_Reviewed: 2026-05-05_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

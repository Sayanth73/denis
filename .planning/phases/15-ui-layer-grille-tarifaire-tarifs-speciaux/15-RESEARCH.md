# Phase 15: UI Layer — Grille tarifaire & Tarifs spéciaux - Research

**Researched:** 2026-05-05
**Domain:** Next.js 14 App Router — React state + shadcn/ui table editing patterns
**Confidence:** HIGH

---

## Summary

Phase 15 adds two inline-edit sections to existing pages. Both sections follow the same pattern already established in `app/parametres/page.tsx`: initialize local `useState` from the Zustand store after `hasHydrated`, validate on save, call a store action, show a sonner toast. No new files are needed; the only changes are appending/inserting JSX blocks into two files that already import everything required.

The data layer (Phase 14) is confirmed complete: `Recipe.prixParDefautHT: number` and `Customer.tarifs: { recetteId: string; prixHT: number }[]` exist in `lib/types.ts`, and `updateRecipe` / `updateCustomer` are both exposed by the store. Store version is at 4 with migration in place.

The `shadcn/ui` component set is fully installed: `Input`, `Button`, `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` are all present in `components/ui/`. The `Table` wrapper adds a `relative w-full overflow-auto` div — for these small fixed tables (3 rows) the plain `<table>` pattern used in the UI-SPEC is equivalent and avoids that extra wrapper div.

**Primary recommendation:** Inline both sections directly into the two existing page files. Use the shadcn `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` primitives (consistent with `app/factures/page.tsx`) rather than a raw `<table>`. State is `Record<string, string>` keyed by recipe ID; initialize inside a `useEffect` that fires when `hasHydrated` becomes true.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Grille tarifaire: section below existing Paramètres form, heading "Grille tarifaire"
- Grille tarifaire: one row per recipe, number input per row, single "Enregistrer" for section
- Grille tarifaire: on save call `updateRecipe(id, { prixParDefautHT: value })`, toast "Grille tarifaire mise à jour"
- Grille tarifaire: validation — number ≥ 0, required; error shown inline (not per-field, beneath button)
- Grille tarifaire: local useState per recipe price; initialize from `recipe.prixParDefautHT` after hasHydrated
- Tarifs spéciaux: section between client info card and "Historique des livraisons" heading
- Tarifs spéciaux: 3-column table — Recette | Prix défaut (read-only) | Override CHF/kg (editable)
- Tarifs spéciaux: empty field = no override = valid; value = stored in `customer.tarifs`
- Tarifs spéciaux: single "Enregistrer"; toast "Tarifs mis à jour"
- Tarifs spéciaux: on save compute newTarifs from non-empty valid inputs; call `updateCustomer(id, { tarifs: newTarifs })`
- Clearing a previously set override (empty field) removes entry from tarifs array
- No react-hook-form — plain useState for both sections
- shadcn/ui Input (type="number"), Button
- All text in French
- TypeScript strict, Next.js 14 App Router
- No new files unless absolutely necessary — edit existing page files only

### Claude's Discretion
- Exact Tailwind classes for table row/cell spacing (follow existing table style)
- Whether to extract a shared PricingTable component — prefer inline (premature abstraction for 2 tables)

### Deferred Ideas (OUT OF SCOPE)
- Shared PricingTable component
- Per-row save buttons
- Sorting or filtering recipes
</user_constraints>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Grille tarifaire editing | Frontend Server (SSR page, client component) | — | Client component reads/writes localStorage-backed Zustand store; no server involvement |
| Tarifs spéciaux editing | Frontend Server (SSR page, client component) | — | Same pattern; `[id]` is a dynamic route, already a client component |
| State persistence | Browser (localStorage via Zustand persist) | — | Store already handles persistence; UI just calls actions |
| Validation | Browser | — | Synchronous parse at button click; no async or server validation needed |

---

## Standard Stack

### Core (already installed — no new installs needed)

| Library | Confirmed Version | Purpose | Source |
|---------|-------------------|---------|--------|
| Next.js | 14.2.35 | App router, `"use client"` pages | [VERIFIED: package.json] |
| React | ^18 | Hooks — useState, useEffect | [VERIFIED: package.json] |
| zustand | ^5.0.12 | Global store, `useTraceabilityStore` | [VERIFIED: package.json] |
| sonner | ^2.0.7 | `toast.success(...)` confirmations | [VERIFIED: package.json] |
| shadcn/ui Input | installed | Controlled number input | [VERIFIED: components/ui/input.tsx] |
| shadcn/ui Button | installed | "Enregistrer" trigger | [VERIFIED: components/ui/button.tsx] |
| shadcn/ui Table primitives | installed | TableHeader, TableBody, TableRow, TableHead, TableCell | [VERIFIED: components/ui/table.tsx] |

**Installation:** None required — all dependencies are already present.

---

## Architecture Patterns

### System Architecture Diagram

```
User edits input
      |
      v
localPrices / overrides (useState, Record<string, string>)
      |
 [Enregistrer click]
      |
      v
validate() — parseFloat each value, check >= 0, not NaN
      |
   invalid? --> set error string --> render beneath button --> abort
      |
   valid
      |
      v
store action (updateRecipe / updateCustomer)  <-- Zustand (in-memory + localStorage)
      |
      v
toast.success(...)
```

### Recommended Project Structure

No new files. Changes confined to:
```
app/
├── parametres/page.tsx    # append Grille tarifaire section after </Form>
└── clients/[id]/page.tsx  # insert Tarifs spéciaux section before "Historique des livraisons" h3
```

---

## Pattern 1: State Initialization After Hydration

**What:** Both pages already guard on `hasHydrated`. The price state must be initialized from the store AFTER hydration, not at render time (store values are empty before hydration).

**When to use:** Any time local controlled state must mirror a Zustand-persisted value.

**Pattern — parametres page (Grille tarifaire):**

```typescript
// Source: existing app/parametres/page.tsx hasHydrated pattern + Phase 14 data
const recipes = useTraceabilityStore((s) => s.recipes);
const hasHydrated = useTraceabilityStore((s) => s.hasHydrated);

const [localPrices, setLocalPrices] = React.useState<Record<string, string>>({});
const [prixError, setPrixError] = React.useState<string | null>(null);

React.useEffect(() => {
  if (!hasHydrated) return;
  const init: Record<string, string> = {};
  for (const r of recipes) {
    init[r.id] = r.prixParDefautHT.toString();
  }
  setLocalPrices(init);
}, [hasHydrated]); // intentionally omit `recipes` — only re-init on hydration
```

**Pattern — client detail page (Tarifs spéciaux):**

```typescript
// Source: existing app/clients/[id]/page.tsx hasHydrated pattern + Phase 14 data
const [overrides, setOverrides] = React.useState<Record<string, string>>({});
const [tarifsError, setTarifsError] = React.useState<string | null>(null);

React.useEffect(() => {
  if (!hasHydrated || !customer) return;
  const init: Record<string, string> = {};
  for (const r of recipes) {
    const found = customer.tarifs.find((t) => t.recetteId === r.id);
    init[r.id] = found ? found.prixHT.toString() : "";
  }
  setOverrides(init);
}, [hasHydrated]); // intentionally omit customer/recipes — only re-init on hydration
```

---

## Pattern 2: Save Handler — Grille tarifaire

**What:** Validate all 3 inputs, call updateRecipe for each, show toast. The `updateRecipe` action signature is `(id: string, patch: Partial<Recipe>) => void`. [VERIFIED: lib/store.ts line 49]

```typescript
// Source: lib/store.ts updateRecipe action
function handleSaveGrille() {
  setPrixError(null);
  for (const r of recipes) {
    const val = localPrices[r.id] ?? "";
    const parsed = parseFloat(val);
    if (val === "" || isNaN(parsed) || parsed < 0) {
      setPrixError(`Prix invalide pour ${r.nom}. Saisissez un nombre ≥ 0.`);
      return;
    }
  }
  const { updateRecipe } = useTraceabilityStore.getState();
  for (const r of recipes) {
    updateRecipe(r.id, { prixParDefautHT: parseFloat(localPrices[r.id]) });
  }
  toast.success("Grille tarifaire mise à jour");
}
```

Note: `useTraceabilityStore.getState()` is the established write pattern in event handlers (confirmed in CONTEXT.md code_context). Reads use reactive subscription; writes in handlers use `.getState()`.

---

## Pattern 3: Save Handler — Tarifs spéciaux (with clear-override edge case)

**What:** Empty string = valid, means "remove override". Non-empty must be a valid number >= 0. Build newTarifs by filtering out empty entries. [VERIFIED: CONTEXT.md decisions + lib/types.ts Customer.tarifs]

```typescript
// Source: lib/types.ts Customer.tarifs type, lib/store.ts updateCustomer
function handleSaveTarifs() {
  setTarifsError(null);
  for (const r of recipes) {
    const val = overrides[r.id] ?? "";
    if (val === "") continue; // empty = valid, means no override
    const parsed = parseFloat(val);
    if (isNaN(parsed) || parsed < 0) {
      setTarifsError(`Override invalide pour ${r.nom}. Saisissez un nombre ≥ 0 ou laissez vide.`);
      return;
    }
  }
  const newTarifs: { recetteId: string; prixHT: number }[] = [];
  for (const r of recipes) {
    const val = overrides[r.id] ?? "";
    if (val !== "") {
      newTarifs.push({ recetteId: r.id, prixHT: parseFloat(val) });
    }
    // empty string → entry intentionally excluded → clears prior override
  }
  const { updateCustomer } = useTraceabilityStore.getState();
  updateCustomer(customer.id, { tarifs: newTarifs });
  toast.success("Tarifs mis à jour");
}
```

---

## Pattern 4: Table Structure (shadcn primitives, matching factures/page.tsx)

**What:** Use the shadcn `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` components. This matches `app/factures/page.tsx` exactly. [VERIFIED: app/factures/page.tsx lines 8-15, 51-157]

```typescript
// Source: app/factures/page.tsx table pattern
import {
  Table, TableBody, TableHeader, TableRow, TableHead, TableCell,
} from "@/components/ui/table";

// Wrapper (both sections):
<div className="rounded-md border bg-background overflow-hidden">
  <Table>
    <TableHeader className="bg-zinc-50">
      <TableRow>
        <TableHead className="text-sm font-medium text-muted-foreground py-3 px-3 border-b border-border text-left">
          Recette
        </TableHead>
        <TableHead className="text-sm font-medium text-muted-foreground py-3 px-3 border-b border-border text-right">
          Prix par défaut (CHF/kg HT)
        </TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {recipes.map((recipe) => (
        <TableRow key={recipe.id} className="border-b border-border">
          <TableCell className="py-2 px-3 text-sm">{recipe.nom}</TableCell>
          <TableCell className="py-2 px-3 text-right">
            <Input
              type="number"
              min={0}
              step={0.01}
              placeholder="25.00"
              className="w-24 text-right tabular-nums"
              value={localPrices[recipe.id] ?? ""}
              onChange={(e) =>
                setLocalPrices((prev) => ({ ...prev, [recipe.id]: e.target.value }))
              }
            />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</div>
```

**Important caveat on TableRow border:** The shadcn `TableBody` already applies `[&_tr:last-child]:border-0` and `TableRow` applies `border-b`. Adding `className="border-b border-border"` on `TableRow` is redundant but harmless; it matches the explicit style in `app/factures/page.tsx` (line 100-102) and is the safe choice for consistency.

---

## Exact Insertion Points

### app/parametres/page.tsx

**Current last line of JSX:** line 177 `</Form>`, line 178 `</div>` (closes `max-w-lg space-y-6`), line 179 closes the component.

**Insertion:** The Grille tarifaire `<div className="space-y-4">` block goes between line 177 (`</Form>`) and line 178 (closing `</div>`), as a sibling inside the `max-w-lg space-y-6` container.

**New imports needed in parametres/page.tsx:**
- `Table, TableBody, TableHeader, TableRow, TableHead, TableCell` from `@/components/ui/table`
- These are NOT currently imported — must be added to the import block.
- `Input` and `Button` are already imported (lines 17-18). [VERIFIED: parametres/page.tsx lines 17-18]

### app/clients/[id]/page.tsx

**Current structure around insertion point:**
- Line 88: `</div>` — closes the client info card (`rounded-md border bg-background p-5 mb-6`)
- Line 91: `<h3 className="text-base font-semibold mb-4">Historique des livraisons</h3>`

**Insertion:** The Tarifs spéciaux `<div className="mb-6 space-y-4">` block goes between line 88 and line 91.

**New imports needed in clients/[id]/page.tsx:**
- `Table, TableBody, TableHeader, TableRow, TableHead, TableCell` from `@/components/ui/table`
- `Input` from `@/components/ui/input`
- `Button` from `@/components/ui/button`
- `{ toast }` from `"sonner"`
- None of these are currently imported. [VERIFIED: clients/[id]/page.tsx import block lines 1-17]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Number input | Custom input component | shadcn `<Input type="number">` | Already installed, handles focus ring, border, disabled states |
| Toast notifications | Custom notification | `toast.success()` from sonner | Already wired in app layout |
| Store persistence | Manual localStorage | Zustand persist middleware | Already configured at store version 4 |
| Table layout | Raw `<table>` with custom CSS | shadcn Table primitives | Consistent with factures/page.tsx, avoids class drift |

---

## Common Pitfalls

### Pitfall 1: Initializing state at render time (before hydration)

**What goes wrong:** `useState<Record<string, string>>({})` initialized with `recipes.reduce(...)` at render time produces empty strings because `recipes` is `[]` before the store hydrates from localStorage. The inputs appear blank on first load even when data exists.

**Why it happens:** The Zustand persist middleware rehydrates asynchronously after mount. At SSR/first render, `recipes` is the initial empty array.

**How to avoid:** Initialize to `{}` and use `useEffect(() => { if (!hasHydrated) return; /* ... */ }, [hasHydrated])` to populate after hydration. Both existing pages already use this pattern.

**Warning signs:** Inputs always blank on page load; data appears only after a hot reload.

---

### Pitfall 2: Including `recipes` or `customer` in the useEffect dependency array

**What goes wrong:** If `recipes` is included in `[hasHydrated, recipes]`, the effect re-fires every time a recipe is updated, resetting the user's in-progress edits.

**Why it happens:** `updateRecipe` causes the `recipes` array reference to change, which triggers the effect, which reinitializes `localPrices` from the store, discarding any unsaved edits.

**How to avoid:** Dependency array is `[hasHydrated]` only. The intent is one-time initialization after store is ready.

**Warning signs:** Typing in an input snaps back to the stored value immediately.

---

### Pitfall 3: Treating empty override string as invalid in Tarifs spéciaux

**What goes wrong:** Applying the same "required" validation from Grille tarifaire to Tarifs spéciaux. An empty override is intentional — it means "use recipe default" and is the mechanism for the clear-override edge case (ROADMAP SC4).

**Why it happens:** Copy-paste of the validation block from the Grille tarifaire handler.

**How to avoid:** In `handleSaveTarifs`, skip validation for empty strings (`if (val === "") continue`). Only validate non-empty values. Empty → excluded from `newTarifs` → removes prior override.

**Warning signs:** Users cannot clear an override they previously set.

---

### Pitfall 4: Using `parseFloat` on a string that looks valid but isn't

**What goes wrong:** `parseFloat("25abc")` returns `25` (not NaN). A user typing "25abc" would pass `isNaN` check.

**Why it happens:** `parseFloat` stops at the first non-numeric character.

**How to avoid:** After `parseFloat`, also verify the original string converts cleanly: check `String(parsed) !== val.trim()` OR use `Number(val)` which returns NaN for "25abc". The simplest safe pattern:
```typescript
const parsed = Number(val); // NaN for "25abc", 25 for "25", 25.5 for "25.5"
if (isNaN(parsed) || parsed < 0) { /* error */ }
```
Note: `Number("")` returns `0`, so for Grille tarifaire (empty = invalid) check `val === ""` first, then `Number(val)`.

---

### Pitfall 5: shadcn TableRow default hover style conflicts with input focus

**What goes wrong:** `TableRow` applies `hover:bg-muted/50` by default. When the user clicks into an input inside a row, the row hover color may flash unexpectedly.

**Why it happens:** shadcn TableRow includes `hover:bg-muted/50` in its base className.

**How to avoid:** These are read tables with inputs, not clickable rows. Override with `className="border-b border-border hover:bg-transparent"` on each data `TableRow`. The header row does not need this since it's inside `TableHeader`.

---

## Code Examples

### Complete Grille tarifaire section (ready to splice in)

```typescript
// Source: synthesized from app/parametres/page.tsx + app/factures/page.tsx patterns
// NEW HOOKS — add above the existing `form = useForm(...)` call:
const recipes = useTraceabilityStore((s) => s.recipes);
const [localPrices, setLocalPrices] = React.useState<Record<string, string>>({});
const [prixError, setPrixError] = React.useState<string | null>(null);

React.useEffect(() => {
  if (!hasHydrated) return;
  const init: Record<string, string> = {};
  for (const r of recipes) {
    init[r.id] = r.prixParDefautHT.toString();
  }
  setLocalPrices(init);
}, [hasHydrated]); // eslint-disable-line react-hooks/exhaustive-deps

function handleSaveGrille() {
  setPrixError(null);
  for (const r of recipes) {
    const val = localPrices[r.id] ?? "";
    if (val === "" || isNaN(Number(val)) || Number(val) < 0) {
      setPrixError(`Prix invalide pour ${r.nom}. Saisissez un nombre ≥ 0.`);
      return;
    }
  }
  const { updateRecipe } = useTraceabilityStore.getState();
  for (const r of recipes) {
    updateRecipe(r.id, { prixParDefautHT: Number(localPrices[r.id]) });
  }
  toast.success("Grille tarifaire mise à jour");
}

// JSX — insert after </Form>, before closing </div>:
<div className="space-y-4">
  <div>
    <h2 className="text-base font-semibold">Grille tarifaire</h2>
    <p className="text-sm text-muted-foreground mt-1">
      Prix par défaut au kg HT pour chaque recette. Utilisé lors de la
      génération automatique des factures.
    </p>
  </div>

  <div className="rounded-md border bg-background overflow-hidden">
    <Table>
      <TableHeader className="bg-zinc-50">
        <TableRow className="hover:bg-transparent">
          <TableHead className="text-sm font-medium text-muted-foreground py-3 px-3 border-b border-border text-left">
            Recette
          </TableHead>
          <TableHead className="text-sm font-medium text-muted-foreground py-3 px-3 border-b border-border text-right">
            Prix par défaut (CHF/kg HT)
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {recipes.map((recipe) => (
          <TableRow key={recipe.id} className="border-b border-border hover:bg-transparent">
            <TableCell className="py-2 px-3 text-sm">{recipe.nom}</TableCell>
            <TableCell className="py-2 px-3 text-right">
              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder="25.00"
                className="w-24 text-right tabular-nums"
                value={localPrices[recipe.id] ?? ""}
                onChange={(e) =>
                  setLocalPrices((prev) => ({ ...prev, [recipe.id]: e.target.value }))
                }
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>

  {prixError && (
    <p className="text-sm text-destructive">{prixError}</p>
  )}

  <Button type="button" onClick={handleSaveGrille}>
    Enregistrer
  </Button>
</div>
```

---

### Complete Tarifs spéciaux section (ready to splice in)

```typescript
// Source: synthesized from app/clients/[id]/page.tsx + lib/types.ts Customer.tarifs

// NEW HOOKS — add alongside existing useState for expandedDeliveryId:
const [overrides, setOverrides] = React.useState<Record<string, string>>({});
const [tarifsError, setTarifsError] = React.useState<string | null>(null);

React.useEffect(() => {
  if (!hasHydrated || !customer) return;
  const init: Record<string, string> = {};
  for (const r of recipes) {
    const found = customer.tarifs.find((t) => t.recetteId === r.id);
    init[r.id] = found ? found.prixHT.toString() : "";
  }
  setOverrides(init);
}, [hasHydrated]); // eslint-disable-line react-hooks/exhaustive-deps

function handleSaveTarifs() {
  setTarifsError(null);
  for (const r of recipes) {
    const val = overrides[r.id] ?? "";
    if (val === "") continue; // empty = valid, remove override
    if (isNaN(Number(val)) || Number(val) < 0) {
      setTarifsError(
        `Override invalide pour ${r.nom}. Saisissez un nombre ≥ 0 ou laissez vide.`,
      );
      return;
    }
  }
  const newTarifs: { recetteId: string; prixHT: number }[] = recipes
    .filter((r) => (overrides[r.id] ?? "") !== "")
    .map((r) => ({ recetteId: r.id, prixHT: Number(overrides[r.id]) }));
  const { updateCustomer } = useTraceabilityStore.getState();
  updateCustomer(customer.id, { tarifs: newTarifs });
  toast.success("Tarifs mis à jour");
}

// JSX — insert between client info card </div> and <h3>Historique des livraisons</h3>:
<div className="mb-6 space-y-4">
  <div>
    <h3 className="text-base font-semibold">Tarifs spéciaux</h3>
    <p className="text-sm text-muted-foreground mt-1">
      Laissez vide pour utiliser le prix par défaut de la recette.
    </p>
  </div>

  <div className="rounded-md border bg-background overflow-hidden">
    <Table>
      <TableHeader className="bg-zinc-50">
        <TableRow className="hover:bg-transparent">
          <TableHead className="text-sm font-medium text-muted-foreground py-3 px-3 border-b border-border text-left">
            Recette
          </TableHead>
          <TableHead className="text-sm font-medium text-muted-foreground py-3 px-3 border-b border-border text-right">
            Prix par défaut (CHF/kg)
          </TableHead>
          <TableHead className="text-sm font-medium text-muted-foreground py-3 px-3 border-b border-border text-right">
            Override client (CHF/kg)
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {recipes.map((recipe) => (
          <TableRow key={recipe.id} className="border-b border-border hover:bg-transparent">
            <TableCell className="py-2 px-3 text-sm">{recipe.nom}</TableCell>
            <TableCell className="py-2 px-3 text-sm text-right tabular-nums text-muted-foreground">
              {recipe.prixParDefautHT.toFixed(2)} CHF/kg
            </TableCell>
            <TableCell className="py-2 px-3 text-right">
              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder={recipe.prixParDefautHT.toFixed(2)}
                className="w-24 text-right tabular-nums"
                value={overrides[recipe.id] ?? ""}
                onChange={(e) =>
                  setOverrides((prev) => ({ ...prev, [recipe.id]: e.target.value }))
                }
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>

  {tarifsError && (
    <p className="text-sm text-destructive">{tarifsError}</p>
  )}

  <Button type="button" onClick={handleSaveTarifs}>
    Enregistrer
  </Button>
</div>
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `react-hook-form` for all inputs | Plain `useState` for simple 3-input sections | Less boilerplate, no schema overhead |
| `useTraceabilityStore((s) => s.updateRecipe)` in handlers | `useTraceabilityStore.getState().updateRecipe` in handlers | Avoids re-subscribing component to action reference |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `useTraceabilityStore.getState()` is the established write pattern in event handlers | Pattern 2, Pattern 3 | LOW — confirmed in CONTEXT.md code_context; store is Zustand which always supports `.getState()` |

**All other claims verified from source files in this session.**

---

## Open Questions

1. **`recipes` subscription in parametres/page.tsx**
   - What we know: `parametres/page.tsx` currently only subscribes to `settings`, `updateSettings`, `hasHydrated` (lines 41-43). The Grille tarifaire section needs `recipes`.
   - What's clear: Add `const recipes = useTraceabilityStore((s) => s.recipes);` at the top of the component — no ambiguity.
   - Recommendation: Add it; it is a simple reactive subscription.

2. **eslint-disable comment for exhaustive-deps**
   - What we know: The `useEffect([hasHydrated])` intentionally omits `recipes`/`customer` from deps. ESLint's `react-hooks/exhaustive-deps` rule will warn.
   - What's unclear: Whether the project enforces no-disable-comments in CI.
   - Recommendation: Add `// eslint-disable-line react-hooks/exhaustive-deps` inline on the effect's dep array line. If CI blocks it, restructure to capture a snapshot: `const recipesSnapshot = recipes` inside the effect (reads from Zustand directly via `.getState()` instead of closure).

---

## Environment Availability

Step 2.6: SKIPPED — phase is purely UI code changes to existing page files. No external CLI tools, databases, or services required beyond the already-running Next.js dev server.

---

## Validation Architecture

> `workflow.nyquist_validation` not set in `.planning/config.json` — treated as enabled.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Not detected — no test config files found in project root |
| Config file | None — Wave 0 gap |
| Quick run command | TBD (framework not installed) |
| Full suite command | TBD |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Notes |
|--------|----------|-----------|-------|
| SC1 | /parametres shows Grille tarifaire with 3 recipe rows and editable inputs | manual / e2e | No test framework detected |
| SC2 | /clients/[id] shows Tarifs spéciaux table with 3 rows | manual / e2e | No test framework detected |
| SC3 | Saving non-empty override persists to customer.tarifs | manual | Verify via store devtools or page reload |
| SC4 | Clearing override (empty field → save) removes entry from customer.tarifs | manual | Critical edge case — test explicitly |
| SC5 | All labels in French | manual | Visual inspection |

### Wave 0 Gaps

- No test framework installed. If tests are required, install and configure before implementation.
- For this project pattern (localStorage Zustand, no backend), integration tests would need jsdom + Zustand test utilities.
- Current practice appears to be manual verification — acceptable given no test infrastructure in repo.

---

## Security Domain

> `security_enforcement` not set — treated as enabled.

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Not applicable — local app, no auth layer |
| V3 Session Management | No | Not applicable |
| V4 Access Control | No | Not applicable — single-user local app |
| V5 Input Validation | Yes | `Number(val)` check + `>= 0` guard before store write |
| V6 Cryptography | No | Not applicable |

| Threat Pattern | STRIDE | Mitigation |
|----------------|--------|------------|
| Negative price stored | Tampering | `Number(val) < 0` check in save handler; aborts with error |
| NaN stored as price | Tampering | `isNaN(Number(val))` check; "25abc" → NaN via `Number()` |
| Empty price stored in recipe | Tampering | Explicit `val === ""` check (required for Grille tarifaire) |

No XSS risk: values are controlled inputs rendered as `value={}` props, not dangerouslySetInnerHTML.

---

## Sources

### Primary (HIGH confidence — verified from codebase)
- `lib/types.ts` — Recipe.prixParDefautHT, Customer.tarifs type shapes
- `lib/store.ts` — updateRecipe, updateCustomer signatures; store version 4; .getState() pattern confirmed
- `app/parametres/page.tsx` — exact import list, existing hook pattern, container className, insertion point
- `app/clients/[id]/page.tsx` — exact import list, existing state, insertion point line numbers
- `app/factures/page.tsx` — table structure, cell padding classes, TableHead/TableCell className patterns
- `components/ui/table.tsx` — shadcn Table primitives and their base classNames
- `components/ui/input.tsx` — Input component API
- `package.json` — confirmed versions: Next.js 14.2.35, React ^18, zustand ^5.0.12, sonner ^2.0.7

### Secondary (MEDIUM confidence)
- `.planning/phases/15-ui-layer-grille-tarifaire-tarifs-speciaux/15-CONTEXT.md` — locked decisions
- `.planning/phases/15-ui-layer-grille-tarifaire-tarifs-speciaux/15-UI-SPEC.md` — visual contract, copywriting

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified from package.json and components/ui/
- Architecture: HIGH — insertion points verified from reading both target files line by line
- Pitfalls: HIGH — derived from reading actual shadcn component source and existing page patterns
- Validation: LOW — no test infrastructure detected; validation strategy is manual

**Research date:** 2026-05-05
**Valid until:** 2026-06-05 (stable stack; shadcn/ui and Zustand APIs are stable)

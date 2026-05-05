# Phase 15: UI Layer — Grille tarifaire & Tarifs spéciaux - Context

**Gathered:** 2026-05-05
**Status:** Ready for planning
**Mode:** Auto-generated (autonomous smart discuss)

<domain>
## Phase Boundary

Phase 15 adds two UI sections that expose the data layer built in Phase 14. The parametres page gets a "Grille tarifaire" section for editing default CHF/kg prices per recipe. Each client detail page gets a "Tarifs spéciaux" section for per-recipe overrides. All labels are in French; changes persist immediately via the Zustand store with a toast confirmation. No backend, no PDF changes, no facture logic changes — those are complete.

</domain>

<decisions>
## Implementation Decisions

### Grille tarifaire (Paramètres)
- Section placed below the existing Paramètres form, separated by a visible heading "Grille tarifaire"
- Renders a table with 3 rows (one per seeded recipe): recipe name column + editable CHF/kg number input column
- Single "Enregistrer" button for the whole section (not per-row) — consistent with the page's existing save pattern
- On save: call `updateRecipe(id, { prixParDefautHT: value })` for each recipe; show toast "Grille tarifaire mise à jour"
- Input validation: number ≥ 0, required (cannot be empty or negative); error shown inline
- Local controlled state per recipe price (no react-hook-form for this section — 3 inputs, simpler with useState)
- Initialize inputs from `recipe.prixParDefautHT` on mount (re-initialize on store hydration)

### Tarifs spéciaux (Client detail)
- Section placed after client header info, before delivery history — higher hierarchy than delivery history
- Renders a table with 3 rows (one per recipe): Recette | Prix défaut (read-only) | Override CHF/kg (editable input)
- "Prix défaut" column shows `recipe.prixParDefautHT` formatted as "25.00 CHF/kg", read-only
- Override input: empty = no override (client pays recipe default); a value = override stored in `customer.tarifs`
- Single "Enregistrer" button for the section; toast "Tarifs mis à jour" on success
- On save: compute new tarifs array from non-empty, valid inputs; call `updateCustomer(id, { tarifs: newTarifs })`
- Clearing a previously set override (empty field on save) removes the entry from tarifs
- Local controlled state per recipe override (useState, not react-hook-form)
- Initialize: for each recipe, check `customer.tarifs.find(t => t.recetteId === recipe.id)?.prixHT ?? ""`

### Shared UI patterns
- Use shadcn/ui `Input` (type="number"), `Button`, table primitives consistent with existing pages
- Table structure: plain `<table>` with Tailwind classes matching other tables in the app (border, bg-background, rounded)
- Currency formatting: display "CHF/kg" suffix on readonly cells, placeholder "25.00" on inputs
- No pagination, no sorting — 3 rows max, always show all

### Claude's Discretion
- Exact Tailwind classes for table row/cell spacing — follow existing table style in the codebase
- Whether to extract a shared "PricingTable" component or inline both tables — prefer inline (two tables in two different pages, premature abstraction)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useTraceabilityStore` — `recipes`, `customers`, `updateRecipe`, `updateCustomer` actions already exist
- `shadcn/ui` Input, Button, Form* components in `components/ui/`
- `toast` from sonner — pattern: `toast.success("...")`
- Table markup pattern from `app/factures/page.tsx` or `components/livraisons/deliveries-table.tsx`
- `hasHydrated` guard pattern from `app/parametres/page.tsx` and `app/clients/[id]/page.tsx`

### Established Patterns
- Local `useState` for form state; initialize from store; save via store action + toast
- `useTraceabilityStore((s) => s.field)` reactive subscription for display
- `useTraceabilityStore.getState()` for writes inside event handlers
- Page layout: `<div className="space-y-6">` with `<h1>` heading and `<p>` description

### Integration Points
- `app/parametres/page.tsx` — append "Grille tarifaire" section below existing form
- `app/clients/[id]/page.tsx` — insert "Tarifs spéciaux" section before delivery history
- Both pages already import `useTraceabilityStore` — no new provider needed

</code_context>

<specifics>
## Specific Ideas

- All text labels must be French: "Grille tarifaire", "Tarifs spéciaux", "Recette", "Prix par défaut", "Override client", "Enregistrer", toast messages as specified in ROADMAP success criteria
- The "Tarifs spéciaux" table must always show all 3 recipes even if none have overrides — the user needs to see defaults to understand what they're overriding
- Success criteria SC5 from ROADMAP: clearing an override (empty field) must remove the entry from `customer.tarifs` — important edge case to test

</specifics>

<deferred>
## Deferred Ideas

- Shared `PricingTable` component — premature for 2 tables in 2 different pages
- Per-row save buttons — simpler to use a single section save
- Sorting or filtering recipes — only 3 recipes, no need

</deferred>

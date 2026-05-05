# Phase 17: CRUD Recettes - Research

**Researched:** 2026-05-05
**Domain:** React component CRUD — Dialog/AlertDialog forms, Zustand store mutations, cascade delete
**Confidence:** HIGH

---

## Summary

Phase 17 rewrites `components/production/recettes-tab.tsx` from a 39-line read-only card list into a fully interactive CRUD component. The scope is tightly bounded: one file changes significantly, the host page (`app/production/page.tsx`) changes minimally or not at all if RecettesTab reads from the store directly.

All required building blocks are already present in the codebase. Store actions (`addRecipe`, `updateRecipe`, `deleteRecipe`, `updateCustomer`) are implemented and tested at the type level in `lib/store.ts`. Dialog patterns (`react-hook-form` + `zod` + shadcn `Dialog`) are established in `components/clients/client-dialog.tsx`. AlertDialog delete patterns with `pendingDeleteId` state are established in `components/clients/clients-table.tsx`. No new dependencies and no new shadcn components are needed.

The only non-trivial logic is the delete guard (check `productionOrders[].recipeId`) and the cascade (filter `customers[].tarifs` on confirm). Both are straightforward array operations documented verbatim in CONTEXT.md and the UI-SPEC. The estimated final file size is approximately 160–200 lines, safely under the 300-line cap, so no file split is needed.

**Primary recommendation:** Rewrite `recettes-tab.tsx` as a self-contained component that calls `useTraceabilityStore` directly, following the `client-dialog.tsx` form pattern and the `clients-table.tsx` delete pattern — no prop drilling, no new files unless line count approaches 250+.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Create Dialog**
- Fields: `nom` (text input) + `prixParDefautHT` (number input, CHF/kg) only
- New recipes default: `composition: []`, `poidsTotal: 0`
- "Nouvelle recette" button placed in the tab content header row (right side, above card list)
- Dialog confirmation button label: "Créer"

**Edit & Row Actions**
- Edit via Dialog — consistent with all other edit flows
- Editable fields: `nom` + `prixParDefautHT` only
- Per-row actions: two icon buttons (Edit2 + Trash2) in the top-right of each recipe card, same row as the recipe name
- Toast on successful save: "Recette mise à jour"

**Delete Behavior & Cascade**
- If `productionOrders` has any entry with `recipeId === id`: show `toast.error(...)`, no dialog
- If unreferenced: open AlertDialog — title "Supprimer la recette", description "Êtes-vous sûr de vouloir supprimer « {nom} » ? Cette action est irréversible."
- On confirm: cascade-remove from customer tarifs, then call `deleteRecipe(id)`

### Claude's Discretion
- Exact icon sizes and button variant (ghost icon-only, following Trash2 pattern from clients-table)
- Input widths inside the create/edit dialogs
- Whether to split RecettesTab into a smaller component or keep in one file (respect 300-line cap)

### Deferred Ideas (OUT OF SCOPE)
- Editing recipe composition (ingredients and percentages)
- Editing poidsTotal
- Reordering recipes
- Recipe duplication
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-v4-recettes-create | User can create a new recipe by specifying name and default price per kg HT; saved to store and immediately visible everywhere | `addRecipe` action confirmed in store.ts L121; Dialog+Form+zod pattern confirmed in client-dialog.tsx; `crypto.randomUUID()` for ID generation |
| REQ-v4-recettes-edit | User can edit an existing recipe's name and default price; changes persist immediately | `updateRecipe(id, patch)` action confirmed in store.ts L122–126; edit dialog pre-fill pattern confirmed in client-dialog.tsx L56–69 |
| REQ-v4-recettes-delete | Deletion blocked with toast if referenced by any production order; confirmation dialog otherwise | `deleteRecipe(id)` action confirmed in store.ts L127; `pendingDeleteId` AlertDialog pattern confirmed in clients-table.tsx; `productionOrder.recipeId` field confirmed in types.ts L34 |
</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| CRUD UI (forms, dialogs, button placement) | Frontend — RecettesTab component | — | All interaction is local to the recettes tab; no routing, no API |
| Store mutations (add/update/delete) | Frontend — Zustand store | — | `useTraceabilityStore` is the single data source; mutations are synchronous |
| Delete guard (production order check) | Frontend — RecettesTab component | — | Read `productionOrders` from store, derive guard condition locally |
| Cascade (customer tarifs cleanup) | Frontend — RecettesTab component | — | `updateCustomer` called per affected customer before `deleteRecipe` |
| Persistence | Zustand `persist` middleware | localStorage | Automatic on every `set()` call; no explicit save action required |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-hook-form | ^7.75.0 | Form state, validation integration | Already used in client-dialog.tsx — locked pattern [VERIFIED: package.json] |
| @hookform/resolvers | ^5.2.2 | Connects zod schema to react-hook-form | Required companion, already installed [VERIFIED: package.json] |
| zod | ^4.4.3 | Schema validation for form fields | Already used in client-dialog.tsx — locked pattern [VERIFIED: package.json] |
| sonner | ^2.0.7 | Toast notifications | Used throughout the app for mutation feedback [VERIFIED: package.json] |
| lucide-react | ^1.14.0 | Edit2, Trash2, Plus icons | Locked icon library (DEC-stack-icons) [VERIFIED: package.json] |
| zustand | (via store.ts) | Global state + store actions | Single store pattern locked from milestone 1 [VERIFIED: lib/store.ts] |

### Supporting (shadcn/ui — all already installed)
| Component | File | Purpose |
|-----------|------|---------|
| Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter | components/ui/dialog.tsx | Create and edit dialogs [VERIFIED: ls] |
| AlertDialog + sub-components | components/ui/alert-dialog.tsx | Delete confirmation [VERIFIED: ls] |
| Form, FormControl, FormField, FormItem, FormLabel, FormMessage | components/ui/form.tsx | Form wrapper in dialogs [VERIFIED: ls] |
| Input | components/ui/input.tsx | nom and prixParDefautHT fields [VERIFIED: ls] |
| Button | components/ui/button.tsx | CTA, icon actions, dialog footer [VERIFIED: ls] |

**No new installations required.** All dependencies and shadcn components are present.

---

## Architecture Patterns

### System Architecture Diagram

```
User action
    │
    ├─ "Nouvelle recette" click ──────► Create Dialog (react-hook-form + zod)
    │                                         │ onSubmit
    │                                         ▼
    │                                   addRecipe(Recipe)
    │                                         │
    ├─ Edit2 click on card ───────────► Edit Dialog (pre-filled, react-hook-form + zod)
    │                                         │ onSubmit
    │                                         ▼
    │                                   updateRecipe(id, patch)
    │                                         │
    └─ Trash2 click on card
             │
             ▼
       Check: productionOrders.some(o => o.recipeId === id)
             │
      ┌──────┴──────┐
   YES (blocked)  NO (allowed)
      │              │
   toast.error    setPendingDeleteId(id)
                     │
                  AlertDialog opens
                     │ onConfirm
                     ▼
             cascade: customers.filter(c =>
               c.tarifs.some(t => t.recetteId === id))
               .forEach(c => updateCustomer(c.id, {
                 tarifs: c.tarifs.filter(t => t.recetteId !== id)
               }))
                     │
                     ▼
             deleteRecipe(id)
                     │
                     ▼
             toast.success + setPendingDeleteId(null)
                     │
             All paths:
                     ▼
        useTraceabilityStore.persist ──► localStorage
```

### Recommended File Structure

No new files are needed unless the final rewrite of `recettes-tab.tsx` exceeds ~250 lines. At that point, extract the dialogs:

```
components/production/
├── recettes-tab.tsx          # Main component (rewrite target, all-in-one preferred)
├── recette-dialog.tsx        # ONLY IF line count forces extraction (create+edit dialog)
├── production-wizard.tsx     # Unchanged
├── ordre-fabrication-table.tsx  # Unchanged
└── allocation-step.tsx       # Unchanged
```

Estimated final size of the rewritten `recettes-tab.tsx`: ~160–200 lines (well under 300-line cap). Single file is the default plan.

### Pattern 1: Self-Contained Store Access (no prop drilling)

RecettesTab calls `useTraceabilityStore` directly — same model as `production-wizard.tsx` and `clients-table.tsx`. The host page does NOT need to pass `productionOrders`, `customers`, or mutation functions as props.

```typescript
// Source: Verified in components/clients/clients-table.tsx L26, components/production/production-wizard.tsx
"use client";
import { useTraceabilityStore } from "@/lib/store";

export function RecettesTab() {
  const recipes = useTraceabilityStore((s) => s.recipes);
  const productionOrders = useTraceabilityStore((s) => s.productionOrders);
  const customers = useTraceabilityStore((s) => s.customers);
  const addRecipe = useTraceabilityStore((s) => s.addRecipe);
  const updateRecipe = useTraceabilityStore((s) => s.updateRecipe);
  const deleteRecipe = useTraceabilityStore((s) => s.deleteRecipe);
  const updateCustomer = useTraceabilityStore((s) => s.updateCustomer);
  // ...
}
```

The component signature changes from `{ recipes: Recipe[] }` to no props (or empty props). The host page `app/production/page.tsx` can remove the `recipes` prop pass to `<RecettesTab>`.

### Pattern 2: Dialog with react-hook-form + zod (established)

```typescript
// Source: Verified in components/clients/client-dialog.tsx L29-68
const recipeSchema = z.object({
  nom: z.string().min(1, "Champ requis"),
  prixParDefautHT: z.number({ invalid_type_error: "Nombre requis" }).positive("Doit être positif"),
});
type FormValues = z.infer<typeof recipeSchema>;

// useEffect to reset/pre-fill on open
React.useEffect(() => {
  if (open) {
    form.reset(
      editRecipe
        ? { nom: editRecipe.nom, prixParDefautHT: editRecipe.prixParDefautHT }
        : { nom: "", prixParDefautHT: 0 },
    );
  }
}, [open, editRecipe, form]);
```

Note: `prixParDefautHT` is a `number` type in zod (not string), so use `valueAsNumber` on the Input to ensure correct parsing: `<Input type="number" step="0.01" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />`.

### Pattern 3: AlertDialog Delete with pendingDeleteId (established)

```typescript
// Source: Verified in components/clients/clients-table.tsx L35-45, L127-155
const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null);

function handleDeleteClick(id: string) {
  const isReferenced = productionOrders.some((o) => o.recipeId === id);
  if (isReferenced) {
    toast.error("Impossible de supprimer : cette recette est utilisée dans des ordres de fabrication.");
    return;
  }
  setPendingDeleteId(id);
}

function handleConfirmDelete() {
  if (!pendingDeleteId) return;
  // Cascade: remove recipe from all customer tarifs
  customers
    .filter((c) => c.tarifs.some((t) => t.recetteId === pendingDeleteId))
    .forEach((c) =>
      updateCustomer(c.id, { tarifs: c.tarifs.filter((t) => t.recetteId !== pendingDeleteId) })
    );
  deleteRecipe(pendingDeleteId);
  toast.success("Recette supprimée");
  setPendingDeleteId(null);
}
```

### Pattern 4: Tab Header Row with CTA

```typescript
// Source: Verified pattern from app/production/page.tsx header row (mb-6 flex justify-between)
// UI-SPEC specifies mb-4 for the tab content header row (inside RecettesTab, not page-level)
<div className="flex items-center justify-between mb-4">
  <div /> {/* left side empty — tab label provides context */}
  <Button variant="default" size="sm" onClick={() => setCreateOpen(true)}>
    <Plus size={14} className="mr-1.5" aria-hidden="true" />
    Nouvelle recette
  </Button>
</div>
```

### Anti-Patterns to Avoid

- **Prop drilling store data:** Do NOT pass `productionOrders` or `customers` from the host page. RecettesTab reads directly from store via `useTraceabilityStore`.
- **Separate create/edit dialog components in separate files:** Premature extraction. Keep dialogs inline in `recettes-tab.tsx` unless line count forces it.
- **String type for prixParDefautHT in zod:** The field is a number in `Recipe`. Use `z.number()` + `valueAsNumber` on the input — not `z.string().transform(Number)`.
- **Calling deleteRecipe without cascade first:** The cascade to customer tarifs MUST happen before `deleteRecipe`, otherwise orphaned `recetteId` references remain in `customer.tarifs` and could cause runtime errors in `facture-builder.ts` (which reads `customer.tarifs.find(t => t.recetteId === recetteId)`).
- **Opening AlertDialog for referenced recipes:** The delete guard must short-circuit with `toast.error` and NOT set `pendingDeleteId` when the recipe is in use.
- **Forgetting the empty state:** If all recipes are deleted, render `<p className="text-sm text-muted-foreground py-8 text-center">Aucune recette.</p>` instead of nothing.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation | Custom onChange validators | `react-hook-form` + `zod` | Already installed; established pattern in client-dialog.tsx; handles touched/dirty/error state automatically |
| Confirmation modal | Custom modal/overlay | `AlertDialog` from shadcn/ui | Already installed; established pattern in clients-table.tsx; handles accessibility (focus trap, Escape key) |
| UUID generation | Custom ID generator | `crypto.randomUUID()` | Native browser API; already used throughout codebase (e.g., client-dialog.tsx L83) |
| Toast notifications | Custom notification system | `sonner` `toast.success/toast.error` | Already installed; standard pattern throughout app |

---

## Common Pitfalls

### Pitfall 1: RecettesTab Props Not Updated When Removing recipes prop

**What goes wrong:** The host page (`app/production/page.tsx`) still passes `recipes={recipes}` to `<RecettesTab>`, but RecettesTab's signature has changed to no props (or empty). TypeScript will error.

**Why it happens:** After making RecettesTab self-contained, the calling site also needs updating.

**How to avoid:** Update the call in `app/production/page.tsx` from `<RecettesTab recipes={recipes} />` to `<RecettesTab />`. Also remove the `recipes` selector from the host page if it's no longer used elsewhere on that page (it is only used by RecettesTab).

**Warning signs:** TypeScript error: "Property 'recipes' does not exist on type 'RecettesTabProps'".

### Pitfall 2: Number Input Value Type Mismatch

**What goes wrong:** `<Input type="number" {...field} />` passes a string to the zod schema's `z.number()` field, causing validation to always fail silently or show a type error.

**Why it happens:** HTML inputs always return string values. Zod's `z.number()` expects a JavaScript number.

**How to avoid:** Use `onChange={e => field.onChange(e.target.valueAsNumber)}` on the price input, or coerce in zod: `z.coerce.number().positive()`. The `coerce` approach is simpler.

**Warning signs:** "Créer" button stays disabled even with a valid-looking number; zod error "Expected number, received string".

### Pitfall 3: AlertDialog Description as Plain `<p>` Wrapping a `<div>`

**What goes wrong:** Using `asChild` on `AlertDialogDescription` with a `<div>` inside a `<p>` causes a React hydration warning (invalid HTML: block element inside inline element).

**Why it happens:** `AlertDialogDescription` renders a `<p>` by default; wrapping it around a div is invalid HTML.

**How to avoid:** Either use `asChild` to replace the `<p>` with a `<div>`, or compose description text in a single `<p>` (multi-line text is fine with `<br/>` or `space-y-1` in a wrapping `<div asChild>`). See the established pattern in `clients-table.tsx L136–141` which uses `asChild`.

**Warning signs:** React `validateDOMNesting` warnings in the browser console.

### Pitfall 4: Cascade Before Delete Order

**What goes wrong:** Calling `deleteRecipe(id)` before `updateCustomer` cascade means that if any `updateCustomer` call throws, the recipe is already gone but orphaned tarif entries remain.

**Why it happens:** Developer reverses the order of operations for clarity.

**How to avoid:** Always cascade first, then delete. Zustand mutations are synchronous so there is no async race condition.

**Warning signs:** `customer.tarifs` still contains entries with `recetteId` pointing to a recipe that no longer exists.

### Pitfall 5: Edit Dialog Pre-Fill Uses Stale Snapshot

**What goes wrong:** Edit dialog opens pre-filled with stale data because `useEffect` for `form.reset` doesn't re-run when `editRecipe` changes.

**Why it happens:** Missing `editRecipe` in the `useEffect` dependency array.

**How to avoid:** Include `editRecipe` in the dependency array. See `client-dialog.tsx L56–69` for the correct pattern: `[open, mode, client, form]`.

**Warning signs:** Editing a second recipe shows the first recipe's values.

---

## Code Examples

### Zod Schema for Recipe Form
```typescript
// Based on: lib/types.ts Recipe type (verified) + client-dialog.tsx pattern (verified)
import { z } from "zod";

const recipeSchema = z.object({
  nom: z.string().min(1, "Le nom est requis."),
  prixParDefautHT: z.coerce.number().positive("Le prix doit être un nombre positif."),
});
type RecipeFormValues = z.infer<typeof recipeSchema>;
```

### Create Handler (onSubmit)
```typescript
// Based on: lib/store.ts addRecipe (verified) + client-dialog.tsx onSubmit pattern (verified)
function onSubmitCreate(values: RecipeFormValues) {
  addRecipe({
    id: crypto.randomUUID(),
    nom: values.nom.trim(),
    prixParDefautHT: values.prixParDefautHT,
    poidsTotal: 0,
    composition: [],
  });
  toast.success(`Recette créée — ${values.nom.trim()}`);
  setCreateOpen(false);
}
```

### Edit Handler (onSubmit)
```typescript
// Based on: lib/store.ts updateRecipe (verified)
function onSubmitEdit(values: RecipeFormValues) {
  if (!editRecipe) return;
  updateRecipe(editRecipe.id, {
    nom: values.nom.trim(),
    prixParDefautHT: values.prixParDefautHT,
  });
  toast.success("Recette mise à jour");
  setEditRecipe(null);
}
```

### Delete Guard + Cascade
```typescript
// Based on: CONTEXT.md §Delete Behavior (verified) + lib/types.ts (verified)
function handleDeleteClick(id: string) {
  const isReferenced = productionOrders.some((o) => o.recipeId === id);
  if (isReferenced) {
    toast.error("Impossible de supprimer : cette recette est utilisée dans des ordres de fabrication.");
    return;
  }
  setPendingDeleteId(id);
}

function handleConfirmDelete() {
  if (!pendingDeleteId) return;
  customers
    .filter((c) => c.tarifs.some((t) => t.recetteId === pendingDeleteId))
    .forEach((c) =>
      updateCustomer(c.id, { tarifs: c.tarifs.filter((t) => t.recetteId !== pendingDeleteId) })
    );
  deleteRecipe(pendingDeleteId);
  toast.success("Recette supprimée");
  setPendingDeleteId(null);
}
```

### Recipe Card Header Row (updated layout)
```typescript
// Based on: 17-UI-SPEC.md Interaction Contracts §2 (verified) + recettes-tab.tsx existing structure
<div className="flex items-center justify-between">
  <span className="text-sm font-semibold text-foreground">{recipe.nom}</span>
  <div className="flex items-center gap-2">
    <span className="text-sm text-muted-foreground tabular-nums">
      {recipe.prixParDefautHT.toFixed(2)} CHF/kg HT
    </span>
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        type="button"
        aria-label="Modifier"
        onClick={() => { form.reset({ nom: recipe.nom, prixParDefautHT: recipe.prixParDefautHT }); setEditRecipe(recipe); }}
      >
        <Edit2 size={14} aria-hidden="true" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        type="button"
        aria-label="Supprimer"
        className="text-destructive hover:text-destructive"
        onClick={() => handleDeleteClick(recipe.id)}
      >
        <Trash2 size={14} aria-hidden="true" />
      </Button>
    </div>
  </div>
</div>
```

---

## State of the Art

| Old Approach | Current Approach | Status |
|--------------|------------------|--------|
| RecettesTab read-only, `recipes` passed as prop | RecettesTab CRUD, reads from store directly | This phase implements the change |
| DEC-recipe-readonly | SUPERSEDED in v0.4 — full CRUD required | State.md L93 confirms supersession |
| Store version 3 (no `prixParDefautHT` on recipes) | Store version 4 — `prixParDefautHT` migrated | lib/store.ts L248–260 confirms migration already done |

---

## Environment Availability

Step 2.6: SKIPPED — this phase is entirely code changes to existing components; no external tools, services, CLIs, databases, or package managers beyond the project's existing Node.js environment are required.

---

## Validation Architecture

`workflow.nyquist_validation` is not set in `.planning/config.json` (key absent) — treat as enabled.

### Test Framework

No test framework is configured in this project. There is no `jest.config.*`, `vitest.config.*`, `pytest.ini`, or `tests/` directory.

| Property | Value |
|----------|-------|
| Framework | None detected |
| Config file | None |
| Quick run | Manual browser verification |
| Full suite | `npx tsc --noEmit` (TypeScript type-check) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-v4-recettes-create | "Nouvelle recette" dialog creates recipe, appears in list | Manual + type-check | `npx tsc --noEmit` | ❌ Wave 0 (no test file) |
| REQ-v4-recettes-edit | Edit dialog pre-fills, saves changes | Manual + type-check | `npx tsc --noEmit` | ❌ Wave 0 (no test file) |
| REQ-v4-recettes-delete | Delete blocked by toast for used recipes; AlertDialog + cascade for unused | Manual + type-check | `npx tsc --noEmit` | ❌ Wave 0 (no test file) |

### Sampling Rate

- **Per task commit:** `npx tsc --noEmit` (type-check only, <5s)
- **Per wave merge:** `npx tsc --noEmit` + manual browser smoke test
- **Phase gate:** TypeScript clean + manual verification of all 3 flows before `/gsd-verify-work`

### Wave 0 Gaps

No test framework is installed. Given the project has never had tests, Wave 0 should not introduce a test framework — that is out of scope. The validation strategy for this phase is:

1. TypeScript type-check: `npx tsc --noEmit`
2. Manual browser smoke test of all 3 CRUD flows

*(No Wave 0 test files to create — project uses manual testing only)*

---

## Open Questions

1. **Should the host page (`app/production/page.tsx`) remove its `recipes` selector?**
   - What we know: `recipes` is currently passed as a prop to `<RecettesTab recipes={recipes} />`. After RecettesTab becomes self-contained, this prop pass is removed.
   - What's unclear: Whether `recipes` is used anywhere else on the production page (it is not — confirmed by reading the file; it is only passed to RecettesTab).
   - Recommendation: Remove the `recipes` selector and prop from the host page in the same commit as the RecettesTab rewrite.

2. **Single dialog vs two separate dialogs?**
   - What we know: client-dialog.tsx uses a `mode: "create" | "edit"` pattern with one shared Dialog component. The UI-SPEC specifies separate state variables (`createOpen` boolean + `editRecipe: Recipe | null`) which imply two separate Dialog render blocks.
   - What's unclear: Whether to use one Dialog with mode switching or two Dialog elements.
   - Recommendation: Use two Dialog elements (one for create, one for edit) as implied by the UI-SPEC. Simpler to reason about; state reset is independent. Total line count remains well under 300.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Final rewritten recettes-tab.tsx will be ~160–200 lines (under 300-line cap, no split needed) | Summary, Architecture | If actual implementation exceeds 250 lines, the planner should extract dialogs into a separate file; the plan should mention this threshold explicitly |

---

## Sources

### Primary (HIGH confidence — verified directly from codebase)
- `lib/store.ts` — `addRecipe`, `updateRecipe`, `deleteRecipe`, `updateCustomer` actions confirmed at lines 121–127, 152–157
- `lib/types.ts` — `Recipe` type (id, nom, poidsTotal, composition, prixParDefautHT) and `Customer.tarifs` shape confirmed
- `components/clients/clients-table.tsx` — `pendingDeleteId` AlertDialog delete pattern verified
- `components/clients/client-dialog.tsx` — react-hook-form + zod Dialog pattern, `useEffect` pre-fill, form reset on close verified
- `components/production/recettes-tab.tsx` — current 39-line read-only implementation confirmed; existing card structure and CSS classes
- `app/production/page.tsx` — host page confirmed; `<RecettesTab recipes={recipes} />` call at line 49
- `package.json` — react-hook-form ^7.75.0, @hookform/resolvers ^5.2.2, zod ^4.4.3, sonner ^2.0.7, lucide-react ^1.14.0 all confirmed
- `components/ui/` — dialog.tsx, alert-dialog.tsx, form.tsx, input.tsx, button.tsx all confirmed present
- `.planning/phases/17-crud-recettes/17-CONTEXT.md` — locked decisions and patterns
- `.planning/phases/17-crud-recettes/17-UI-SPEC.md` — component inventory, interaction contracts, copywriting contract

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` — DEC-file-size-cap (300 lines), DEC-recipe-readonly superseded, DEC-stack-* constraints

### Tertiary (LOW confidence)
- Line count estimate for rewritten component (~160–200 lines) — derived by summing structural blocks; actual may vary

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified in package.json
- Architecture: HIGH — all patterns verified in existing codebase files
- Pitfalls: HIGH — all pitfalls derived from verified code patterns in the codebase
- Line count estimate: LOW — approximation only

**Research date:** 2026-05-05
**Valid until:** 2026-06-05 (stable stack, no fast-moving dependencies)

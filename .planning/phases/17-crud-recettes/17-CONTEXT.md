# Phase 17: CRUD Recettes - Context

**Gathered:** 2026-05-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 17 adds full CRUD to the Recettes tab on /production. The existing tab is read-only (3 seeded recipes). After this phase the operator can:
- Create new recipes (name + default price only)
- Edit the name or price of any existing recipe
- Delete unreferenced recipes (with AlertDialog confirmation)
- Be blocked from deleting recipes used in any production order (toast, no dialog)

No new routes, no changes to the production wizard, no changes to tarif grid pages — only the RecettesTab component and its host page change. Store actions `addRecipe`, `updateRecipe`, `deleteRecipe` already exist.

</domain>

<decisions>
## Implementation Decisions

### Create Dialog
- Fields in "Nouvelle recette" dialog: `nom` (text input) + `prixParDefautHT` (number input, CHF/kg) only — matches SC1
- New recipes default: `composition: []`, `poidsTotal: 0` — minimal valid state; no composition UI needed
- "Nouvelle recette" button placed in the tab content header row (right side, above the recipe cards list)
- Dialog confirmation button label: "Créer"

### Edit & Row Actions
- Edit via Dialog — consistent with all other edit flows in the app
- Editable fields: `nom` + `prixParDefautHT` only — matches SC2 ("name or price")
- Per-row actions: two icon buttons (Edit2 + Trash2) in the top-right of each recipe card, same row as the recipe name
- Toast on successful save: "Recette mise à jour"

### Delete Behavior & Cascade
- On delete, cascade-remove the recipe from all customer `tarifs` arrays (update each affected customer in the component before calling `deleteRecipe`) — SC4 says "from all tarif grids"
- If the recipe is referenced by any `productionOrder.recipeId`: show toast "Impossible de supprimer : cette recette est utilisée dans des ordres de fabrication." — no dialog, no deletion
- If unreferenced: open AlertDialog title "Supprimer la recette", description "Êtes-vous sûr de vouloir supprimer « {nom} » ? Cette action est irréversible."
- On confirm: cascade-remove from customer tarifs, then call `deleteRecipe(id)`

### Claude's Discretion
- Exact icon sizes and button variant (ghost icon-only, following Trash2 pattern from clients-table)
- Input widths inside the create/edit dialogs
- Whether to split RecettesTab into a smaller component or keep in one file (respect 300-line cap)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `addRecipe`, `updateRecipe`, `deleteRecipe` store actions — already in `lib/store.ts`
- `updateCustomer(id, patch)` store action — use to cascade-remove recipe from `customer.tarifs`
- `Recipe` type: `{id, nom, poidsTotal, composition, prixParDefautHT}` — `lib/types.ts`
- AlertDialog pattern from `components/clients/clients-table.tsx` — `pendingDeleteId` state, exact copy for recipe delete
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter` from shadcn/ui — use for create/edit dialogs
- `Button`, `Input` from shadcn/ui
- `toast` from sonner — used throughout for success/error feedback
- `Edit2`, `Trash2`, `Plus` from lucide-react

### Established Patterns
- Delete confirmation: `pendingDeleteId` state → set on Trash2 click → `AlertDialog open={pendingDeleteId !== null}` → on confirm call store action + toast
- Dialog open state: `useState<boolean>` for create dialog; for edit, `useState<Recipe | null>` for the recipe being edited
- Header bar: `<div className="flex items-center justify-between mb-4">` with CTA on the right
- Toast pattern: `toast.success("...")` / `toast.error("...")`
- Production orders reference: `productionOrder.recipeId` (string) — compare against `recipe.id`
- Customer tarifs: `customer.tarifs: { recetteId: string; prixHT: number }[]` — filter out matching recetteId on delete

### Integration Points
- `components/production/recettes-tab.tsx` — rewrite to add CRUD UI (currently ~40 lines, will expand)
- `app/production/page.tsx` — passes `recipes` to RecettesTab; may need to also pass `productionOrders` and `customers` for delete guard + cascade, or use store inside the tab component directly
- Store selectors needed in RecettesTab: `recipes`, `productionOrders`, `customers`, `addRecipe`, `updateRecipe`, `deleteRecipe`, `updateCustomer`

</code_context>

<specifics>
## Specific Ideas

- Use `useTraceabilityStore` directly inside RecettesTab (same as how production page does it) to avoid prop drilling `productionOrders` and `customers`
- The create dialog should validate that `nom` is non-empty and `prixParDefautHT` is a positive number before enabling the "Créer" button
- Edit dialog should pre-fill with current recipe values on open
- The cascade removal from customer tarifs: `customers.filter(c => c.tarifs.some(t => t.recetteId === id)).forEach(c => updateCustomer(c.id, { tarifs: c.tarifs.filter(t => t.recetteId !== id) }))`

</specifics>

<deferred>
## Deferred Ideas

- Editing recipe composition (ingredients and percentages) — too complex for this phase, not in success criteria
- Editing poidsTotal — not mentioned in success criteria
- Reordering recipes — not needed
- Recipe duplication — not in scope

</deferred>

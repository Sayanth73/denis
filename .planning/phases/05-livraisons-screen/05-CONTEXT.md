# Phase 5: Livraisons Screen - Context

**Gathered:** 2026-05-05
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

The user can view all deliveries and create a new delivery by selecting in-stock broches for a customer through a two-state "préparer → marquer livrée" flow.

**Requirements covered:** REQ-deliveries-list, REQ-delivery-create

**Success criteria (from ROADMAP §Phase 5):**
1. `/livraisons` shows a table: Date, Client, Nombre de broches, Poids total, Statut.
2. "+ Nouvelle livraison" opens a Dialog with: Client (searchable select), Date de livraison, Broches en stock multi-select (checkbox list showing n° lot interne / poids / DLC), Notes (optional textarea).
3. Two-state action: "Préparer la livraison" creates `Delivery` with `statut: "preparee"`; then "Marquer comme livrée" transitions broches `en_stock`→`livree` AND delivery `preparee`→`livree`, requiring explicit user click.
4. On "Marquer comme livrée": each broche gets `livraisonId`, table updates, toast confirms.
5. Refresh preserves new delivery and broche references.

</domain>

<decisions>
## Implementation Decisions

### Locked from earlier phases / PRD
- Stack: Next.js + Tailwind + shadcn/ui + Zustand + react-hook-form + zod (already installed).
- Locale: French only.
- File-size cap: 300 lines.
- Customers: seeded in Phase 2 (`useTraceabilityStore.customers`) — read directly via store.
- Broches en stock: `useTraceabilityStore.finishedProducts.filter(fp => fp.statut === "en_stock")`.
- Delivery ID: `crypto.randomUUID()`.
- Toast convention from Phase 3/4: `sonner` `toast.success(...)` with French messages.
- Hydration guard pattern from Phase 3.
- Confirmation pattern: "Marquer comme livrée" requires AlertDialog confirmation per REQ-confirmations-on-critical-actions.
- Dialog dimensions: ~640px width to accommodate the broches multi-select list.

### Claude's Discretion
- Two-state flow implementation: same Dialog re-renders with different footer based on `delivery.statut`. After "Préparer", the dialog stays open showing the prepared delivery summary + "Marquer comme livrée" button + AlertDialog confirmation.
- Alternative: dialog closes after "Préparer", and the table row exposes a "Marquer comme livrée" action button. This is simpler — choose this. Delivery rows with `statut: preparee` show an inline action button "Marquer comme livrée" that triggers AlertDialog confirmation, then mutates store.
- Searchable customer select: reuse `<Combobox>` component from Phase 3.
- Date picker: reuse `<DatePicker>` from Phase 3.
- Multi-select broches: shadcn `Checkbox` primitive (install if needed) + `ScrollArea` for the list. Each row shows: checkbox + n° lot interne (mono) + poids (kg) + `<DlcBadge>`.

</decisions>

<code_context>
## Existing Code Insights

- `lib/store.ts` actions: `addDelivery(d)`, `updateDelivery(id, patch)`, `updateFinishedProduct(id, patch)`. Use these.
- `lib/types.ts` `Delivery` type: `{ id, date, customerId, brochesLivrees: string[], statut: "preparee" | "livree", notes? }`.
- `lib/types.ts` `FinishedProduct` type includes `livraisonId?` and `statut: "en_stock" | "livree"`.
- shadcn primitives installed: Tabs (Phase 4), Dialog, Combobox, DatePicker, Form, Input, Select, Table, Button (Phase 3). Need to install: AlertDialog, Checkbox, Textarea, ScrollArea (some may not exist yet).
- Zod v4 quirk from Phase 3: avoid `z.coerce.number()`; use `z.string().refine()` + `parseFloat()` in submit.

</code_context>

<specifics>
## Specific Ideas

- Page layout mirrors `/matieres-premieres` and `/production`: header CTA on right, table or empty state below, dialog mounted unconditionally.
- Empty state: `<EmptyState icon={Truck} heading="Aucune livraison" body="Préparez votre première livraison pour commencer le suivi." cta={...} />`.
- Toasts:
  - Préparer: `Livraison préparée — {N} broche(s) pour {clientName}`
  - Livrée: `Livraison confirmée — {N} broche(s) livrée(s) à {clientName}`
- Statut column rendered as colored badge: `preparee` → orange/amber; `livree` → emerald/green.
- Lot counts: `delivery.brochesLivrees.length`. Poids total: sum of `finishedProducts.find(fp => fp.id === id).poids` for each broche id in `brochesLivrees`.
- `New delivery` form validation: client required, date required (default today), at least 1 broche selected.

</specifics>

<deferred>
## Deferred Ideas

- Delivery PDF export → Phase 7 (traçabilité).
- Customer creation from within the dialog → not needed; customers are seeded and Phase 6 owns CRUD.

</deferred>

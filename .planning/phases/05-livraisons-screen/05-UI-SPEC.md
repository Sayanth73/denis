---
phase: 5
slug: livraisons-screen
status: draft
shadcn_initialized: true
preset: inherits 01-UI-SPEC.md + 03-UI-SPEC.md + 04-UI-SPEC.md (New York, neutral, CSS variables)
created: 2026-05-05
inherits: 01-UI-SPEC.md, 03-UI-SPEC.md, 04-UI-SPEC.md
---

# Phase 5 — UI Design Contract: Livraisons Screen

> Phase 5 inherits **every token, color, type role, spacing token, and copy convention from `01-UI-SPEC.md`, `03-UI-SPEC.md`, and `04-UI-SPEC.md`**. This file declares only the net-new contract for `/livraisons`: the page layout, deliveries table, status badge map, New Delivery dialog (two-state "préparer → marquer livrée"), and the AlertDialog confirmation on "Marquer comme livrée".

---

## Phase 5 — Components Installed

shadcn components added in this phase:
- `checkbox` — for the broches multi-select list in the New Delivery dialog
- `textarea` — for the optional notes field
- `scroll-area` — for the broches checkbox list (contains overflow when many en_stock broches)

Already installed and reused from prior phases:
- `alert-dialog` (Phase 0 / pre-installed), `dialog`, `button`, `form`, `input`, `select`, `table`, `badge`, `combobox`, `date-picker`, `calendar`, `popover`, `command`

No other new shadcn primitives.

---

## Page Layout — `/livraisons`

Replaces the Phase 1 placeholder. Single-column layout inside the inherited shell main content area (`px-6 py-6`).

```
┌─────────────────────────────────────────────────────────────────────┐
│ (header: "Livraisons" — owned by global Phase 1 header)             │
├─────────────────────────────────────────────────────────────────────┤
│  Page-header row (flex justify-between, mb-6, h-9)                  │
│                               ┌──────────────────────────────────┐  │
│  (no subtitle)                │ + Nouvelle livraison             │  │
│                               └──────────────────────────────────┘  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Deliveries table (rounded-md border bg-background)          │   │
│  │ — OR —                                                      │   │
│  │ <EmptyState> (dashed border, centered)                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  <NewDeliveryDialog open={dialogOpen} onOpenChange={setDialogOpen}> │
└─────────────────────────────────────────────────────────────────────┘
```

- Page-header row: `flex items-center justify-between mb-6`. The global `<Header />` from Phase 1 owns the `<h1>`; no subtitle.
- Below the header row: either the table OR the empty state, never both.
- `<NewDeliveryDialog>` is mounted unconditionally (same pattern as `<ReceptionDialog>` in Phase 3).

### Page-header CTA — "+ Nouvelle livraison"

Variant `default` (primary, accent blue), size `default` (`h-9 px-4 text-sm font-medium`), lucide `Plus` (`size=16 mr-2`), label `+ Nouvelle livraison`. The `+` glyph matches Phase 1 / Phase 3 / Phase 4 CTA convention.

---

## Deliveries Table

**Container:** `<div className="rounded-md border bg-background overflow-hidden">` wrapping `<Table>`. Same surface rule as Phase 3 and Phase 4 (no shadow, dense).

### Columns (exact order)

| # | Header (FR) | Field | Width | Align | Cell content |
|---|-------------|-------|-------|-------|--------------|
| 1 | Date | `date` | 13 % | left | `JJ.MM.AAAA` via `formatDate(date)`, `text-sm` |
| 2 | Client | `customerId` → customer name | 24 % | left | `text-sm truncate` |
| 3 | Nb broches | `brochesLivrees.length` | 11 % | right | `text-sm tabular-nums` |
| 4 | Poids total | computed from sum of `finishedProducts.find(id).poids` | 14 % | right | `text-sm tabular-nums`, `{value} kg` |
| 5 | Statut | `statut` | 14 % | left | Status badge (see §Statut Badge) |
| 6 | Actions | inline action button (conditional) | 24 % | right | "Marquer comme livrée" button when `statut === "preparee"`; empty cell otherwise |

- `colgroup` widths: 13/24/11/14/14/24 sum to 100 %.
- Header row: `bg-zinc-50`, `text-sm font-medium text-muted-foreground py-3 px-3 border-b border-border`. Columns are **not sortable** (deliveries are shown in insertion order; most recent first via `[...deliveries].reverse()`).
- Data rows: `border-b border-border hover:bg-zinc-50 min-h-9`. Cells: `py-2 px-3 text-sm`. `whitespace-nowrap` on columns 1, 3, 4. `truncate` on column 2.
- **No row click.** Phase 6 adds client detail; Phase 7 adds traçabilité links.
- Poids total: sum of `finishedProducts.find(fp => fp.id === id)?.poids ?? 0` for each id in `brochesLivrees`. Result formatted as `{sum} kg`.

### Statut Badge

Statut is rendered as an inline badge. Two values exist:

| Value | Label | Tailwind classes |
|-------|-------|-----------------|
| `preparee` | Préparée | `bg-amber-50 border-amber-200 text-amber-800` |
| `livree` | Livrée | `bg-emerald-50 border-emerald-200 text-emerald-800` |

Badge shape: `inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium`.

These classes are exported from `lib/deliveries.ts` as `STATUT_LIVRAISON_CLASSES` and `STATUT_LIVRAISON_LABELS` (mirrors the `STATUT_CLASSES` / `STATUT_LABELS` pattern in `lib/raw-materials.ts`).

### Inline Action — "Marquer comme livrée"

Rows with `statut === "preparee"` show an action button in column 6:

```
[ Marquer comme livrée ]
```

- Button: `variant="outline"`, `size="sm"` (`h-8 px-3 text-xs`), lucide `CheckCircle2` (`size=14 mr-1.5`).
- Clicking opens the `<MarkLivreeAlertDialog>` (see §AlertDialog).
- Rows with `statut === "livree"` show an empty cell in column 6 (no button).

### Empty State — Deliveries

| Slot | Value |
|------|-------|
| `icon` | lucide `Truck` |
| `heading` | `Aucune livraison` |
| `body` | `Préparez votre première livraison pour commencer le suivi.` |
| `cta.label` | `+ Nouvelle livraison` |
| `cta.icon` | lucide `Plus` |
| `cta.onClick` | Opens New Delivery dialog |

---

## New Delivery Dialog

**Trigger:** page-header CTA "+ Nouvelle livraison" (and empty-state CTA).
**Component:** `components/livraisons/new-delivery-dialog.tsx`, single `<Dialog>`.

### Dialog Dimensions

| Property | Value | Tailwind |
|----------|-------|----------|
| Width | 640 px | `sm:max-w-[640px]` |
| Max height | 90 vh | `max-h-[90vh]` |
| Body scroll | overflow-y auto | `overflow-y-auto` on `<DialogContent>` |
| Backdrop | shadcn default `bg-black/50` | inherited |

Why 640 px: the broches checkbox list (n° lot interne + poids + DLC per row) needs horizontal breathing room at the same width as the Phase 4 production wizard.

### DialogHeader

```
┌──────────────────────────────────────────────────────────────┐
│ Nouvelle livraison                                       ✕   │ ← DialogTitle
│ Sélectionnez les broches à livrer et confirmez.              │ ← DialogDescription
└──────────────────────────────────────────────────────────────┘
```

- Title: `Nouvelle livraison` (constant).
- Description: `Sélectionnez les broches à livrer et confirmez.`

### Dialog Form Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  Client *                                                        │
│  [ Rechercher un client...                        ▾ ]            │
│                                                                  │
│  Date de livraison *                                             │
│  [ 05.05.2026                                 📅 ]              │
│                                                                  │
│  Broches en stock *                                              │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ ScrollArea (max-h-[200px])                                 │  │
│  │  [✓] TK-2026-0505-001  25 kg  [DLC badge]                 │  │
│  │  [ ] TK-2026-0505-002  25 kg  [DLC badge]                 │  │
│  │  [ ] TK-2026-0504-001  20 kg  [DLC badge]                 │  │
│  └────────────────────────────────────────────────────────────┘  │
│  Sélectionnez au moins une broche.  ← FormMessage (on error)     │
│                                                                  │
│  Notes (optionnel)                                               │
│  [ ________________________________ ]                            │
│  [ ________________________________ ]  ← Textarea 3 rows        │
│                                                                  │
│                     [ Annuler ]  [ Préparer la livraison ]       │
└──────────────────────────────────────────────────────────────────┘
```

**Form body:** `space-y-4`.

### Field: Client

- `<FormLabel>Client *</FormLabel>`
- Component: adapted `<Combobox>` from Phase 3. The existing `<Combobox>` accepts `options: string[]` and calls `onChange(selectedValue: string)`. For customers we pass `options` as the list of customer names (display), but the form field value must be the customer `id`. Use a wrapper pattern:
  - Build two parallel arrays: `customerNames: string[]` and `customerIds: string[]` from `customers`.
  - Display the selected name in the Combobox trigger: resolve `customers.find(c => c.id === field.value)?.nom ?? ""`.
  - On `onChange(name)`: look up the matching `customerId` and call `field.onChange(customerId)`.
- Placeholder: `Rechercher un client...`
- Search placeholder: `Rechercher...`
- Empty message: `Aucun client.`
- Validation: `z.string().min(1, "Champ requis")` (zod, on `customerId`).

### Field: Date de livraison

- `<FormLabel>Date de livraison *</FormLabel>`
- Component: `<DatePicker>` from Phase 3.
- Default value: today (`todayIso()` at dialog mount time).
- `disabled` constraint: date > today + 30 days (block dates more than 30 days out; no lower bound — deliveries can be backdated for record-keeping).

  ```typescript
  disabled={(d) => {
    const max = new Date();
    max.setDate(max.getDate() + 30);
    return d > max;
  }}
  ```

- Validation: `z.string().min(1, "Champ requis")` — the DatePicker always returns a valid ISO string or `undefined`; treat `undefined` as empty string in the form default.

### Field: Broches en stock (multi-select)

- `<FormLabel>Broches en stock *</FormLabel>`
- Rendered as a bordered container wrapping a `<ScrollArea>` with `max-h-[200px]`. The container: `rounded-md border border-input bg-background`.
- Each broche = one checkbox row (shadcn `<Checkbox>`):

```
┌───────────────────────────────────────────────────────────┐
│  [ ] TK-2026-0505-001        25 kg     [DLC badge]        │
└───────────────────────────────────────────────────────────┘
```

  Row layout: `flex items-center gap-3 px-3 py-2 hover:bg-zinc-50 cursor-pointer`.
  - `<Checkbox id={fp.id} checked={...} onCheckedChange={...} />` (shadcn).
  - `<label htmlFor={fp.id} className="flex-1 flex items-center gap-3 cursor-pointer">`:
    - `<span className="font-mono text-sm">{fp.numeroLotInterne}</span>`
    - `<span className="text-sm text-muted-foreground tabular-nums">{fp.poids} kg</span>`
    - `<DlcBadge value={fp.dlc} />`
  - Last row has no bottom border; intermediate rows: `border-b border-border`.

- `getInStockBroches(finishedProducts)` from `lib/deliveries.ts` filters `statut === "en_stock"`, sorted by `dlc` ascending (FIFO visual order — consistent with Phase 3/4 principle).
- If no broches in stock: show a non-interactive message inside the scroll area: `<p className="px-3 py-4 text-sm text-muted-foreground text-center">Aucune broche en stock.</p>`.
- Form field value: `brochesLivrees: string[]` (array of `FinishedProduct.id`).
- Validation: `z.array(z.string()).min(1, "Sélectionnez au moins une broche.")`.

### Field: Notes (optionnel)

- `<FormLabel>Notes (optionnel)</FormLabel>`
- Component: shadcn `<Textarea>` with `rows={3}` and `placeholder="Remarques sur cette livraison..."` and `maxLength={500}`.
- Validation: `z.string().max(500, "Maximum 500 caractères.").optional().or(z.literal(""))`.

### DialogFooter

```
[ Annuler ]  [ Préparer la livraison ]
```

- `Annuler`: `variant="outline"`, closes dialog, resets form.
- `Préparer la livraison`: `type="submit"`, `variant="default"` (primary blue), default size.

### "Préparer la livraison" Behavior

Executed in one synchronous block on form submit:

1. Create `Delivery`:
   ```typescript
   const delivery: Delivery = {
     id: crypto.randomUUID(),
     date: values.dateLivraison,
     customerId: values.customerId,
     brochesLivrees: values.brochesLivrees,
     statut: "preparee",
     notes: values.notes?.trim() || undefined,
   };
   ```
2. Call `useTraceabilityStore.getState().addDelivery(delivery)`.
3. Do **not** update `FinishedProduct.statut` here — that happens on "Marquer comme livrée".
4. Resolve `clientName = customers.find(c => c.id === values.customerId)?.nom ?? ""`.
5. Fire `toast.success("Livraison préparée — {N} broche(s) pour {clientName}")`.
6. Close dialog, reset form.

Locked toast string:
```
Livraison préparée — {N} broche(s) pour {clientName}
```
(em-dash ` — ` with spaces, matching Phase 3/4 toast pattern.)

---

## AlertDialog — "Marquer comme livrée" Confirmation

**Trigger:** inline "Marquer comme livrée" button on a `preparee` table row.
**Component:** `components/livraisons/mark-livree-alert-dialog.tsx` or inlined in the table component (≤ 300-line cap applies — prefer inline as a separate `<AlertDialog>` rendered once per row or once for the whole table via lifted state).

Recommended pattern: maintain `pendingDeliveryId: string | null` in the table component. The button sets `pendingDeliveryId = delivery.id`. A single `<AlertDialog>` is rendered at the table level with `open={pendingDeliveryId !== null}`.

### AlertDialog Structure

```
┌──────────────────────────────────────────────────────────┐
│ Confirmer la livraison                              ✕    │ ← AlertDialogTitle
│                                                          │
│  Confirmez-vous la livraison de {N} broche(s) à          │
│  {clientName} ?                                          │
│                                                          │
│  Cette action est irréversible. Les broches seront        │
│  marquées comme livrées.                                 │
│                                                          │
│               [ Annuler ]  [ Confirmer ]                 │
└──────────────────────────────────────────────────────────┘
```

- `<AlertDialogTitle>`: `Confirmer la livraison`
- `<AlertDialogDescription>`: Two-sentence body (see Copywriting Contract below).
- `<AlertDialogCancel>`: `Annuler` — closes dialog, no mutation.
- `<AlertDialogAction>`: `Confirmer` — executes mutation (see below), closes dialog.
- `<AlertDialogAction>` classes: `bg-primary text-primary-foreground hover:bg-primary/90` (shadcn default action — same as a primary Button).

### "Confirmer" Behavior

Executed in one synchronous block:

1. Get the `Delivery` by `pendingDeliveryId` from the store.
2. For each `fpId` in `delivery.brochesLivrees`:
   call `useTraceabilityStore.getState().updateFinishedProduct(fpId, { statut: "livree", livraisonId: delivery.id })`.
3. Call `useTraceabilityStore.getState().updateDelivery(delivery.id, { statut: "livree" })`.
4. Resolve `clientName = customers.find(c => c.id === delivery.customerId)?.nom ?? ""`.
5. Fire `toast.success("Livraison confirmée — {N} broche(s) livrée(s) à {clientName}")`.
6. Set `pendingDeliveryId = null`.

Locked toast string:
```
Livraison confirmée — {N} broche(s) livrée(s) à {clientName}
```

---

## `lib/deliveries.ts` — Pure Helpers

No React. No side effects. All helpers operate on domain types.

```typescript
import type { Delivery, FinishedProduct, Customer } from "./types";

/** Badge classes for Delivery.statut — mirrors STATUT_CLASSES in lib/raw-materials.ts */
export const STATUT_LIVRAISON_LABELS: Record<Delivery["statut"], string> = {
  preparee: "Préparée",
  livree:   "Livrée",
};

export const STATUT_LIVRAISON_CLASSES: Record<Delivery["statut"], string> = {
  preparee: "bg-amber-50 border-amber-200 text-amber-800",
  livree:   "bg-emerald-50 border-emerald-200 text-emerald-800",
};

/**
 * Returns FinishedProducts with statut === "en_stock", sorted by dlc ascending.
 * Used to populate the broches checkbox list in the New Delivery dialog.
 */
export function getInStockBroches(fps: FinishedProduct[]): FinishedProduct[];

/**
 * Returns the total poids (kg) for a delivery by summing each broche's poids.
 * Safe: returns 0 if a broche ID is not found in fps (no crash).
 */
export function getDeliveryWeight(
  delivery: Delivery,
  fps: FinishedProduct[],
): number;

/**
 * Looks up a Customer by id. Returns undefined if not found.
 * Convenience wrapper used in table + toast formatting.
 */
export function getCustomerById(
  customerId: string,
  customers: Customer[],
): Customer | undefined;

/**
 * Returns a display-ready row object for the deliveries table.
 * Avoids inline computation in JSX.
 */
export function formatDeliveryRow(
  delivery: Delivery,
  fps: FinishedProduct[],
  customers: Customer[],
): {
  id: string;
  dateFormatted: string;       // JJ.MM.AAAA
  clientName: string;          // customer.nom or fallback
  nombreBroches: number;       // brochesLivrees.length
  poidsTotal: number;          // sum of poids
  statut: Delivery["statut"];
  notes?: string;
};
```

---

## Component Inventory (Phase 5 net-new)

| Component | Path | Type | Purpose |
|-----------|------|------|---------|
| `<LivraisonsPage />` | `app/livraisons/page.tsx` | Client | Route page; owns `dialogOpen` state; renders header CTA + table/empty-state + dialog |
| `<DeliveriesTable />` | `components/livraisons/deliveries-table.tsx` | Client | Deliveries table (5 data columns + actions column) with `preparee` inline action + AlertDialog |
| `<NewDeliveryDialog />` | `components/livraisons/new-delivery-dialog.tsx` | Client | Single-step Dialog; react-hook-form + zod; customer combobox + date picker + broches checkbox list + notes textarea |
| `lib/deliveries.ts` | `lib/deliveries.ts` | n/a | Pure helpers: `getInStockBroches`, `getDeliveryWeight`, `getCustomerById`, `formatDeliveryRow`, `STATUT_LIVRAISON_CLASSES`, `STATUT_LIVRAISON_LABELS` |
| `components/ui/checkbox.tsx` | `components/ui/checkbox.tsx` | n/a | shadcn Checkbox primitive |
| `components/ui/textarea.tsx` | `components/ui/textarea.tsx` | n/a | shadcn Textarea primitive |
| `components/ui/scroll-area.tsx` | `components/ui/scroll-area.tsx` | n/a | shadcn ScrollArea primitive |

**File-size discipline (DEC-file-size-cap, 300 lines):** The dialog is the largest component. Splits are permissible if needed (e.g., extract `BrochesCheckboxList` sub-component), but first attempt to stay within one 300-line file — the dialog is simpler than the Phase 4 wizard.

---

## Zod Schema for New Delivery Dialog

```typescript
const deliverySchema = z.object({
  customerId:    z.string().min(1, "Champ requis"),
  dateLivraison: z.string().min(1, "Champ requis"),
  brochesLivrees: z.array(z.string()).min(1, "Sélectionnez au moins une broche."),
  notes: z.string().max(500, "Maximum 500 caractères.").optional(),
});
```

**Zod v4 compliance (Phase 3/4 SUMMARY deviation):**
- Use `z.string()` for all fields (no `z.coerce`).
- `customerId`: `z.string().min(1)` — the combobox submits the customer UUID.
- `dateLivraison`: `z.string().min(1)` — the DatePicker returns a valid ISO string.
- `brochesLivrees`: `z.array(z.string()).min(1)` — array of FinishedProduct IDs.
- `notes`: `z.string().max(500).optional()` — or empty string (handle both in onSubmit).
- No cross-field refinements needed for Phase 5.

---

## Copywriting Contract (Phase 5 — net-new strings)

| Element | Copy |
|---------|------|
| Page CTA | + Nouvelle livraison |
| Dialog title | Nouvelle livraison |
| Dialog description | Sélectionnez les broches à livrer et confirmez. |
| Client label | Client |
| Client placeholder | Rechercher un client... |
| Client combobox search placeholder | Rechercher... |
| Client combobox empty | Aucun client. |
| Client validation error | Champ requis |
| Date de livraison label | Date de livraison |
| Date de livraison validation error | Champ requis |
| Broches label | Broches en stock |
| Broches validation error | Sélectionnez au moins une broche. |
| Broches empty message | Aucune broche en stock. |
| Notes label | Notes (optionnel) |
| Notes placeholder | Remarques sur cette livraison... |
| Notes validation error | Maximum 500 caractères. |
| Cancel button | Annuler |
| Submit button | Préparer la livraison |
| Toast — préparer | Livraison préparée — {N} broche(s) pour {clientName} |
| Table header — date | Date |
| Table header — client | Client |
| Table header — nb broches | Nb broches |
| Table header — poids | Poids total |
| Table header — statut | Statut |
| Table header — actions | (empty header — actions column has no label) |
| Statut badge — preparee | Préparée |
| Statut badge — livree | Livrée |
| Inline action button | Marquer comme livrée |
| AlertDialog title | Confirmer la livraison |
| AlertDialog body line 1 | Confirmez-vous la livraison de {N} broche(s) à {clientName} ? |
| AlertDialog body line 2 | Cette action est irréversible. Les broches seront marquées comme livrées. |
| AlertDialog cancel | Annuler |
| AlertDialog confirm | Confirmer |
| Toast — marquer livrée | Livraison confirmée — {N} broche(s) livrée(s) à {clientName} |
| Empty state heading | Aucune livraison |
| Empty state body | Préparez votre première livraison pour commencer le suivi. |
| Empty state CTA | + Nouvelle livraison |

---

## Density & Visual Rhythm (Phase 5 specifics)

- **Table (Deliveries)** uses the same `py-2 px-3 text-sm` density as Phase 3 raw materials table and Phase 4 orders table.
- **Dialog** uses `space-y-4` form body — same as Phase 3 reception dialog (single-step, not a wizard).
- **Broches checkbox list** uses `px-3 py-2` per row — slightly denser than dialog `space-y-4` because it is a list surface inside the dialog, not a form section.
- **ScrollArea** max height `200px` — fits approximately 4-5 broche rows comfortably without making the dialog taller than necessary on typical demo data sizes (10-20 broches).
- **Inline action button** uses `size="sm"` (`h-8 px-3 text-xs`) to fit neatly within a `py-2` table row.

---

## Inheritance Note for Later Phases

- Phase 6 (Clients): `<DeliveriesTable />` or its row data (`formatDeliveryRow`) may be referenced from the client detail view. The `Delivery.customerId` foreign key is the link.
- Phase 7 (Traçabilité): `Delivery.brochesLivrees[].livraisonId` is the downstream link. The `FinishedProduct.livraisonId` set on "Marquer comme livrée" is Phase 7's primary downstream connection.
- Phase 8 (Dashboard): The KPI "Livraisons cette semaine" reads `deliveries.filter(d => d.date >= weekStart)`.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS — formal French B2B, all phase-specific strings declared, no emojis, validation messages follow Phase 3 convention ("Champ requis", "Sélectionnez au moins une broche.").
- [ ] Dimension 2 Visuals: PASS — sober B2B SaaS, table uses same bordered surface as Phase 3/4, dialog matches Phase 3 dialog patterns.
- [ ] Dimension 3 Color: PASS — amber/emerald status badges are the operational-status budget (analogous to raw-materials STATUT_CLASSES); no decorative semantic colors.
- [ ] Dimension 4 Typography: PASS — only inherited 4 sizes × 2 weights; `font-mono` for lot numbers per Phase 1.
- [ ] Dimension 5 Spacing: PASS — `space-y-4` dialog form, `py-2 px-3` table density, `px-3 py-2` broches list rows, `mb-6` page-header gap.
- [ ] Dimension 6 Registry Safety: PASS — only shadcn official `checkbox`, `textarea`, `scroll-area`; no third-party.

**Approval:** pending

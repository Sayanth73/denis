---
phase: 6
slug: clients-screen
status: draft
shadcn_initialized: true
preset: inherits 01-UI-SPEC.md + 03-UI-SPEC.md + 04-UI-SPEC.md + 05-UI-SPEC.md (New York, neutral, CSS variables)
created: 2026-05-05
inherits: 01-UI-SPEC.md, 03-UI-SPEC.md, 04-UI-SPEC.md, 05-UI-SPEC.md
---

# Phase 6 — UI Design Contract: Clients Screen

> Phase 6 inherits **every token, color, type role, spacing token, and copy convention from `01-UI-SPEC.md`, `03-UI-SPEC.md`, `04-UI-SPEC.md`, and `05-UI-SPEC.md`**. This file declares only the net-new contract for `/clients` (list + CRUD) and `/clients/[id]` (detail with nested delivery → broche → upstream RM expansions).

---

## Phase 6 — Components Installed

No new shadcn primitives required. All needed primitives are already installed:

Already installed and reused:
- `table`, `dialog`, `form`, `input`, `button`, `alert-dialog` — core CRUD surface
- `combobox`, `date-picker`, `calendar`, `popover`, `command` — (not needed here; listed for reference)
- `checkbox`, `textarea`, `scroll-area`, `badge` — available if needed for inline expansions

No `npx shadcn add` step needed in any wave.

---

## Page Layout — `/clients`

Replaces the Phase 1 placeholder. Single-column layout inside the inherited shell main content area (`px-6 py-6`).

```
┌─────────────────────────────────────────────────────────────────────┐
│ (header: "Clients" — owned by global Phase 1 header)                │
├─────────────────────────────────────────────────────────────────────┤
│  Page-header row (flex justify-between, mb-6, h-9)                  │
│                               ┌──────────────────────────────────┐  │
│  (no subtitle)                │ + Nouveau client                 │  │
│                               └──────────────────────────────────┘  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Clients table (rounded-md border bg-background)             │   │
│  │ — OR —                                                      │   │
│  │ <EmptyState> (dashed border, centered)                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  <ClientDialog open={dialogOpen} onOpenChange={setDialogOpen}       │
│                mode={dialogMode} client={editTarget} />             │
└─────────────────────────────────────────────────────────────────────┘
```

- Page-header row: `flex items-center justify-between mb-6`. The global `<Header />` from Phase 1 owns the `<h1>`; no subtitle.
- Below the header row: either the table OR the empty state, never both.
- `<ClientDialog>` is mounted unconditionally (same pattern as `<ReceptionDialog>` in Phase 3 and `<NewDeliveryDialog>` in Phase 5).

### Page-header CTA — "+ Nouveau client"

Variant `default` (primary, accent blue), size `default` (`h-9 px-4 text-sm font-medium`), lucide `Plus` (`size=16 mr-2`), label `+ Nouveau client`. The `+` glyph matches Phase 1 / Phase 3 / Phase 4 / Phase 5 CTA convention.

---

## Clients Table

**Container:** `<div className="rounded-md border bg-background overflow-hidden">` wrapping `<Table>`. Same surface rule as Phase 3, 4, and 5 (no shadow, dense).

### Columns (exact order)

| # | Header (FR)  | Field                    | Width | Align | Cell content                                           |
|---|--------------|--------------------------|-------|-------|--------------------------------------------------------|
| 1 | Nom          | `nom`                    | 22 %  | left  | `<Link href="/clients/{id}">` wrapping text-sm; hover underline |
| 2 | Adresse      | `adresse`                | 28 %  | left  | `text-sm truncate`                                     |
| 3 | Téléphone    | `telephone`              | 18 %  | left  | `text-sm`                                              |
| 4 | Email        | `email`                  | 20 %  | left  | `text-sm truncate text-muted-foreground`; `—` if absent |
| 5 | Actions      | edit + delete buttons    | 12 %  | right | icon-only or labelled buttons (see §Actions Cell)      |

- `colgroup` widths: 22/28/18/20/12 sum to 100 %.
- Header row: `bg-zinc-50`, `text-sm font-medium text-muted-foreground py-3 px-3 border-b border-border`. Columns are **not sortable**.
- Data rows: `border-b border-border hover:bg-zinc-50`. Cells: `py-2 px-3 text-sm`. `truncate` on Adresse and Email columns.
- **Row click navigates to `/clients/{id}`**: The `Nom` cell wraps in a `<Link href="/clients/{customer.id}">`. Entire row does NOT use an `onClick` (only the Nom cell is the link) to avoid conflict with the edit/delete buttons.

### Actions Cell

Each row has two action buttons:

```
[ ✏ Modifier ] [ 🗑 Supprimer ]
```

- Edit button: `variant="ghost"`, `size="sm"` (`h-8 px-2`), lucide `Pencil` (`size=14`), no label text (icon only), `aria-label="Modifier"`. Clicking opens `<ClientDialog mode="edit" client={row} />`.
- Delete button: `variant="ghost"`, `size="sm"` (`h-8 px-2`), lucide `Trash2` (`size=14`), `className="text-destructive hover:text-destructive"`, no label text (icon only), `aria-label="Supprimer"`. Clicking opens the delete AlertDialog.
- Both buttons are `type="button"` to prevent form submission.
- Buttons are in a `<div className="flex items-center justify-end gap-1">`.

### Empty State — Clients list

| Slot        | Value                                                                   |
|-------------|-------------------------------------------------------------------------|
| `icon`      | lucide `Users`                                                          |
| `heading`   | `Aucun client`                                                          |
| `body`      | `Ajoutez votre premier client pour suivre les livraisons.`             |
| `cta.label` | `+ Nouveau client`                                                      |
| `cta.icon`  | lucide `Plus`                                                           |
| `cta.onClick` | Opens `<ClientDialog mode="create" />`                               |

---

## ClientDialog — Create & Edit

**Trigger:** page-header CTA (create) or Edit button on a table row (edit).
**Component:** `components/clients/client-dialog.tsx`, single `<Dialog>`.
**Single component handles both modes** via `mode` prop (locked decision).

### Dialog Dimensions

| Property   | Value     | Tailwind                                 |
|------------|-----------|------------------------------------------|
| Width      | 480 px    | `sm:max-w-[480px]`                       |
| Height     | auto      | no fixed height; grows with content      |
| Body scroll | none     | dialog is short (4 fields); no overflow  |
| Backdrop   | shadcn default `bg-black/50` | inherited          |

Why 480 px: client form has 4 text fields with no complex sub-surfaces (no date picker, no checkbox list); narrower than the Phase 5 delivery dialog (640 px) is appropriate.

### DialogHeader (conditional by mode)

```
Create mode:
┌──────────────────────────────────────────────────────────────┐
│ Nouveau client                                           ✕   │ ← DialogTitle
│ Renseignez les informations du client.                       │ ← DialogDescription
└──────────────────────────────────────────────────────────────┘

Edit mode:
┌──────────────────────────────────────────────────────────────┐
│ Modifier le client                                       ✕   │ ← DialogTitle
│ Mettez à jour les informations du client.                    │ ← DialogDescription
└──────────────────────────────────────────────────────────────┘
```

### Dialog Form Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  Nom *                                                           │
│  [ Kebab Royal Lausanne                                        ]  │
│                                                                  │
│  Adresse *                                                       │
│  [ Rue de Bourg 14, 1003 Lausanne                             ]  │
│                                                                  │
│  Téléphone *                                                     │
│  [ +41 21 312 45 67                                           ]  │
│                                                                  │
│  Email (optionnel)                                               │
│  [ contact@kebab-royal.ch                                     ]  │
│                                                                  │
│                             [ Annuler ]  [ Enregistrer ]         │
└──────────────────────────────────────────────────────────────────┘
```

**Form body:** `space-y-4`.

### Field: Nom

- `<FormLabel>Nom *</FormLabel>`
- Component: shadcn `<Input>` with `placeholder="Nom du client"`, `maxLength={120}`.
- Validation: `z.string().min(2, "Minimum 2 caractères.")`.

### Field: Adresse

- `<FormLabel>Adresse *</FormLabel>`
- Component: shadcn `<Input>` with `placeholder="Adresse complète"`, `maxLength={200}`.
- Validation: `z.string().min(5, "Minimum 5 caractères.")`.

### Field: Téléphone

- `<FormLabel>Téléphone *</FormLabel>`
- Component: shadcn `<Input>` with `placeholder="+41 XX XXX XX XX"`, `type="tel"`, `maxLength={30}`.
- Validation: `z.string().min(1, "Champ requis")` — simple non-empty check (locked decision). No regex formatting imposed.

### Field: Email (optionnel)

- `<FormLabel>Email (optionnel)</FormLabel>`
- Component: shadcn `<Input>` with `placeholder="contact@exemple.ch"`, `type="email"`, `maxLength={120}`.
- Validation: `z.string().email("Email invalide.").optional().or(z.literal(""))` — valid email format if present, absent is fine.

### DialogFooter

```
[ Annuler ]  [ Enregistrer ]
```

- `Annuler`: `variant="outline"`, closes dialog, resets form.
- `Enregistrer`: `type="submit"`, `variant="default"` (primary blue), default size.

### "Enregistrer" Behavior — Create mode

Executed in one synchronous block on form submit:

1. Build `Customer`:
   ```typescript
   const customer: Customer = {
     id:        crypto.randomUUID(),
     nom:       values.nom.trim(),
     adresse:   values.adresse.trim(),
     telephone: values.telephone.trim(),
     email:     values.email?.trim() || undefined,
   };
   ```
2. Call `useTraceabilityStore.getState().addCustomer(customer)`.
3. Fire `toast.success("Client ajouté — {nom}")`.
4. Close dialog, reset form.

Locked toast string (create):
```
Client ajouté — {nom}
```

### "Enregistrer" Behavior — Edit mode

Executed in one synchronous block on form submit:

1. Build patch:
   ```typescript
   const patch: Partial<Customer> = {
     nom:       values.nom.trim(),
     adresse:   values.adresse.trim(),
     telephone: values.telephone.trim(),
     email:     values.email?.trim() || undefined,
   };
   ```
2. Call `useTraceabilityStore.getState().updateCustomer(client.id, patch)`.
3. Fire `toast.success("Client mis à jour — {nom}")`.
4. Close dialog, reset form.

Locked toast string (edit):
```
Client mis à jour — {nom}
```

### Default Values on Open

- Create mode: all fields empty string `""`.
- Edit mode: fields pre-populated from the `client` prop passed to the dialog.
- On `onOpenChange(false)`: always reset form to create-mode defaults (avoids stale edit values leaking on next open).

---

## AlertDialog — Delete Client Confirmation

**Trigger:** Delete button (Trash2 icon) on a table row.
**Component:** inlined in `components/clients/clients-table.tsx` (same pattern as Phase 5 `<MarkLivreeAlertDialog>` inlined in `<DeliveriesTable>`).

Recommended pattern: maintain `pendingDeleteId: string | null` in the table component. The Trash2 button sets `pendingDeleteId = customer.id`. A single `<AlertDialog>` is rendered at the table level with `open={pendingDeleteId !== null}`.

### AlertDialog Structure

```
┌──────────────────────────────────────────────────────────┐
│ Supprimer le client                                 ✕    │ ← AlertDialogTitle
│                                                          │
│  Êtes-vous sûr de vouloir supprimer {nom} ?              │
│                                                          │
│  Cette action est irréversible.                          │
│                                                          │
│               [ Annuler ]  [ Supprimer ]                 │
└──────────────────────────────────────────────────────────┘
```

- `<AlertDialogTitle>`: `Supprimer le client`
- `<AlertDialogDescription>`: Two-sentence body (see Copywriting Contract).
- `<AlertDialogCancel>`: `Annuler` — closes dialog, no mutation.
- `<AlertDialogAction>`: `Supprimer` — executes mutation, closes dialog.
- `<AlertDialogAction>` classes: `bg-destructive text-destructive-foreground hover:bg-destructive/90` — destructive action styling differs from Phase 5's neutral confirm.

### "Supprimer" Behavior

Executed in one synchronous block:

1. Resolve `nom = customers.find(c => c.id === pendingDeleteId)?.nom ?? ""`.
2. Call `useTraceabilityStore.getState().deleteCustomer(pendingDeleteId)`.
3. Fire `toast.success("Client supprimé — {nom}")`.
4. Set `pendingDeleteId = null`.

Do **NOT** cascade to deliveries (deferred to Phase 9 polish — locked decision).

Locked toast string (delete):
```
Client supprimé — {nom}
```

---

## Page Layout — `/clients/[id]` (Detail)

Dynamic route. Component: `app/clients/[id]/page.tsx`.

**Must be `"use client"` with `useParams()`** — all data lives in Zustand; no server-side fetch possible (locked decision).

```
┌─────────────────────────────────────────────────────────────────────┐
│ (header: "Clients" — owned by global Phase 1 header)                │
├─────────────────────────────────────────────────────────────────────┤
│  ← Retour aux clients                         (link, mb-6)          │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Client Info Card (rounded-md border bg-background p-5 mb-6) │   │
│  │  Nom (h2 text-xl font-semibold)                             │   │
│  │  Adresse · Téléphone · Email (text-sm text-muted-foreground)│   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Section heading: "Historique des livraisons"  (text-base           │
│  font-semibold mb-4)                                               │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Deliveries expansion list (space-y-2)                       │   │
│  │  ┌────────────────────────────────────────────────────────┐ │   │
│  │  │ Delivery row (rounded-md border, px-4 py-3)            │ │   │
│  │  │  Date · Nb broches · Poids · Statut badge [chevron]    │ │   │
│  │  │  ↓ (expanded):                                         │ │   │
│  │  │  ┌──────────────────────────────────────────────────┐  │ │   │
│  │  │  │ BrochesTable (border-t, px-4 py-3 bg-zinc-50)    │  │ │   │
│  │  │  │ columns: N° lot, Poids, DLC, [Voir MP] btn        │  │ │   │
│  │  │  │  ↓ (broche expanded):                             │  │ │   │
│  │  │  │  UpstreamRMList (border-t bg-white px-4 py-3)     │  │ │   │
│  │  │  │  columns: Matière, Fournisseur, N° lot, Qté       │  │ │   │
│  │  │  └──────────────────────────────────────────────────┘  │ │   │
│  │  └────────────────────────────────────────────────────────┘ │   │
│  │  … (one row per delivery)                                   │   │
│  │  — OR —                                                     │   │
│  │  <EmptyState icon={Truck} ...> (no CTA)                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Back Link

```
← Retour aux clients
```

- `<Link href="/clients">` with lucide `ArrowLeft` (`size=16 mr-1.5`) and text `Retour aux clients`.
- Classes: `inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6`.

### Client Info Card

- Container: `rounded-md border bg-background p-5 mb-6`.
- `<h2 className="text-xl font-semibold mb-1">{customer.nom}</h2>`
- Metadata row: `<div className="flex items-center gap-4 text-sm text-muted-foreground">`:
  - Adresse: plain text.
  - Téléphone: plain text (or `<a href="tel:...">`).
  - Email: plain text (or `<a href="mailto:...">`), omitted entirely if `customer.email` is absent.
- Separator between metadata items: `·` (middle dot, `&middot;`) with `gap-4` for visual spacing.

### "Historique des livraisons" Section

- Section heading: `<h3 className="text-base font-semibold mb-4">Historique des livraisons</h3>`.
- If customer has no deliveries: render `<EmptyState icon={Truck} heading="Aucune livraison" body="Ce client n'a pas encore reçu de livraison." />` (no CTA — locked decision).
- If deliveries exist: render `<div className="space-y-2">` containing one card per delivery, ordered most-recent-first (`[...deliveries].reverse()`).

---

## Delivery Expansion Row (in `/clients/[id]`)

Each delivery in the list is an expansion card. State managed with `useState<string | null>(expandedDeliveryId)` in the detail page (one delivery expanded at a time).

### Collapsed (header) row

```
┌─────────────────────────────────────────────────────────────────┐
│  05.05.2026   3 broche(s)   75 kg   [Livrée badge]       [▾]   │
└─────────────────────────────────────────────────────────────────┘
```

Container: `rounded-md border bg-background`.
Header: `<button className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-50 text-left">`:
- Left group: `flex items-center gap-4 text-sm`:
  - Date: `formatDate(delivery.date)` (JJ.MM.AAAA), `font-medium`.
  - Nb broches: `{delivery.brochesLivrees.length} broche(s)`, `text-muted-foreground`.
  - Poids: `{getDeliveryWeight(delivery, finishedProducts)} kg`, `tabular-nums text-muted-foreground`.
  - Statut badge: inline `<span>` with `STATUT_LIVRAISON_CLASSES[delivery.statut]` + `STATUT_LIVRAISON_LABELS[delivery.statut]` (reused from `lib/deliveries.ts`).
- Right: lucide `ChevronDown` (`size=16 className={cn("transition-transform", expanded ? "rotate-180" : ""`)}) — rotates 180° when expanded.

### Expanded — BrochesTable

When a delivery row is expanded (`expandedDeliveryId === delivery.id`), render the broches inline below the header:

```
┌─────────────────────────────────────────────────────────────────┐
│  (header row above — always visible)                            │
├─────────────────────────────────────────────────────────────────┤
│  N° lot interne (mono)   Poids   DLC      [Voir mat. premières] │  ← header row
│  TK-2026-0505-001        25 kg   [badge]  [Voir mat. premières] │
│  TK-2026-0505-002        25 kg   [badge]  [Voir mat. premières] │
└─────────────────────────────────────────────────────────────────┘
```

BrochesTable sub-surface:
- Container: `border-t bg-zinc-50`.
- Inner `<Table>` with columns: N° lot interne (40 %), Poids (18 %), DLC (22 %), Actions (20 %).
- Header row: `text-xs font-medium text-muted-foreground py-2 px-4 border-b border-border bg-zinc-100`.
- Data rows: `py-2 px-4 text-sm border-b border-border last:border-b-0`.
- N° lot interne cell: `font-mono`.
- Poids cell: `tabular-nums`, `{fp.poids} kg`.
- DLC cell: `<DlcBadge value={fp.dlc} />`.
- Actions cell (right-aligned): `<Button variant="ghost" size="sm" onClick={() => toggleBrocheExpansion(fp.id)}>Voir matières premières</Button>`.

**getBrochesForDelivery:** resolved via `lib/clients.ts` helper.

### Expanded — Upstream RM list (nested under broche row)

When "Voir matières premières" is clicked on a broche row (state: `expandedBrocheId: string | null`), render the upstream RM list inline below that broche row:

```
┌─────────────────────────────────────────────────────────────────┐
│  (broche row above — always visible in the table)               │
├─────────────────────────────────────────────────────────────────┤
│  Matière          Fournisseur         N° lot fournisseur   Qté  │  ← header
│  Bœuf             Viandes Genoud      LOT-2026-001         15 kg│
│  Agneau           SIAL Viandes        AG-2025-0088         7 kg │
└─────────────────────────────────────────────────────────────────┘
```

UpstreamRMList sub-surface:
- Container: `border-t bg-white` (inside the BrochesTable row cell that spans all columns — use `<TableRow><TableCell colSpan={4}>…</TableCell></TableRow>`).
- Inner table columns: Matière (28 %), Fournisseur (30 %), N° lot fournisseur (28 %), Qté utilisée (14 %).
- Header row: `text-xs font-medium text-muted-foreground py-2 px-4 border-b border-border bg-zinc-50`.
- Data rows: `py-2 px-4 text-sm border-b border-border last:border-b-0`.
- Matière cell: `TYPE_LABELS[rm.type]` from `lib/raw-materials.ts`.
- N° lot cell: `font-mono text-xs`.
- Qté utilisée cell: `tabular-nums`, `{quantiteUtilisee} kg`.

**getRawMaterialsForBroche:** resolved via `lib/clients.ts` helper.

State: `expandedBrocheId: string | null` in the detail page. Only one broche expanded at a time (clicking a second broche collapses the first).

---

## `lib/clients.ts` — Pure Helpers

No React. No side effects. All helpers operate on domain types.

```typescript
import type { Delivery, FinishedProduct, ProductionOrder, RawMaterial } from "./types";

/**
 * Returns all deliveries for a given customer, most-recent-first.
 */
export function getDeliveriesForCustomer(
  customerId: string,
  deliveries: Delivery[],
): Delivery[];

/**
 * Returns the FinishedProducts (broches) included in a delivery.
 * Looks up each id in delivery.brochesLivrees from the fps array.
 * Safe: skips IDs not found.
 */
export function getBrochesForDelivery(
  delivery: Delivery,
  finishedProducts: FinishedProduct[],
): FinishedProduct[];

/**
 * Returns the upstream raw materials that contributed to a broche,
 * along with the quantity used from each lot.
 *
 * Trace path:
 *   broche.productionOrderId
 *   → productionOrder.matieresPremieresUtilisees[].rawMaterialId + quantiteUtilisee
 *   → rawMaterials.find(rm => rm.id === rawMaterialId)
 *
 * Returns [] if the production order or any RM is not found (safe fallback).
 */
export function getRawMaterialsForBroche(
  broche: FinishedProduct,
  productionOrders: ProductionOrder[],
  rawMaterials: RawMaterial[],
): { rm: RawMaterial; quantiteUtilisee: number }[];
```

---

## Component Inventory (Phase 6 net-new)

| Component | Path | Type | Purpose |
|-----------|------|------|---------|
| `<ClientsPage />` | `app/clients/page.tsx` | Client | Route page; owns `dialogOpen`, `dialogMode`, `editTarget`, `deleteId` state; renders header CTA + table/empty-state + dialog + AlertDialog |
| `<ClientsTable />` | `components/clients/clients-table.tsx` | Client | Clients table (5 columns: Nom link, Adresse, Téléphone, Email, Actions) + delete AlertDialog (inlined via `pendingDeleteId`) |
| `<ClientDialog />` | `components/clients/client-dialog.tsx` | Client | Single Dialog; react-hook-form + zod; `mode: "create" \| "edit"` + optional `client` prop for pre-population |
| `<ClientDetailPage />` | `app/clients/[id]/page.tsx` | Client | Detail page; `useParams()` for id; client info card + delivery expansion list + nested broche/RM expansions |
| `lib/clients.ts` | `lib/clients.ts` | n/a | Pure helpers: `getDeliveriesForCustomer`, `getBrochesForDelivery`, `getRawMaterialsForBroche` |

**File-size discipline (DEC-file-size-cap, 300 lines):** The detail page is the most complex component. Split `<BrochesExpansion>` and `<UpstreamRMList>` into separate files under `components/clients/` if needed to stay within 300 lines. Prefer `components/clients/broches-expansion.tsx` for the broche table + nested RM expansion.

---

## Zod Schema for ClientDialog

```typescript
const clientSchema = z.object({
  nom:       z.string().min(2, "Minimum 2 caractères."),
  adresse:   z.string().min(5, "Minimum 5 caractères."),
  telephone: z.string().min(1, "Champ requis"),
  email:     z.string().email("Email invalide.").optional().or(z.literal("")),
});
```

**Zod v4 compliance (Phase 3/4/5 SUMMARY deviation):**
- Use `z.string()` for all fields (no `z.coerce`).
- `nom`: `z.string().min(2)` — minimum 2 characters (locked).
- `adresse`: `z.string().min(5)` — minimum 5 characters (locked).
- `telephone`: `z.string().min(1)` — simple non-empty (locked; no regex beyond presence).
- `email`: `z.string().email().optional().or(z.literal(""))` — valid format if present, empty string or absent is allowed.

---

## Copywriting Contract (Phase 6 — net-new strings)

| Element | Copy |
|---------|------|
| Page CTA | + Nouveau client |
| Dialog title — create | Nouveau client |
| Dialog title — edit | Modifier le client |
| Dialog description — create | Renseignez les informations du client. |
| Dialog description — edit | Mettez à jour les informations du client. |
| Nom label | Nom |
| Nom placeholder | Nom du client |
| Nom validation error | Minimum 2 caractères. |
| Adresse label | Adresse |
| Adresse placeholder | Adresse complète |
| Adresse validation error | Minimum 5 caractères. |
| Téléphone label | Téléphone |
| Téléphone placeholder | +41 XX XXX XX XX |
| Téléphone validation error | Champ requis |
| Email label | Email (optionnel) |
| Email placeholder | contact@exemple.ch |
| Email validation error | Email invalide. |
| Cancel button | Annuler |
| Submit button | Enregistrer |
| Toast — create | Client ajouté — {nom} |
| Toast — edit | Client mis à jour — {nom} |
| Toast — delete | Client supprimé — {nom} |
| Delete AlertDialog title | Supprimer le client |
| Delete AlertDialog body line 1 | Êtes-vous sûr de vouloir supprimer {nom} ? |
| Delete AlertDialog body line 2 | Cette action est irréversible. |
| Delete AlertDialog cancel | Annuler |
| Delete AlertDialog confirm | Supprimer |
| Table header — nom | Nom |
| Table header — adresse | Adresse |
| Table header — telephone | Téléphone |
| Table header — email | Email |
| Table header — actions | (empty — no label) |
| Empty state heading (list) | Aucun client |
| Empty state body (list) | Ajoutez votre premier client pour suivre les livraisons. |
| Empty state CTA (list) | + Nouveau client |
| Detail back link | Retour aux clients |
| Detail section heading | Historique des livraisons |
| Delivery row — nb broches unit | broche(s) |
| Broche expand button | Voir matières premières |
| Empty state heading (detail — no deliveries) | Aucune livraison |
| Empty state body (detail — no deliveries) | Ce client n'a pas encore reçu de livraison. |

---

## Density & Visual Rhythm (Phase 6 specifics)

- **Clients table** uses the same `py-2 px-3 text-sm` density as Phases 3, 4, and 5.
- **ClientDialog** uses `space-y-4` form body — same as Phase 3 reception dialog and Phase 5 delivery dialog (single-step, not a wizard).
- **Client info card** uses `p-5` internal padding for a slightly airier feel appropriate to an information display (not an action surface).
- **Delivery expansion rows** use `px-4 py-3` for the header and inner sub-surfaces — slightly wider padding than the table cells to create visual hierarchy between the list and the table it contains.
- **BrochesTable inner** uses `py-2 px-4 text-sm` for rows; header uses `text-xs` for sub-hierarchy signaling.
- **UpstreamRMList inner** uses `py-2 px-4 text-sm` same density; slightly recessed visual level via `bg-white` on `bg-zinc-50` parent.

---

## Density — Colgroup Reference

### `/clients` — Clients Table

| Column | Width |
|--------|-------|
| Nom | 22 % |
| Adresse | 28 % |
| Téléphone | 18 % |
| Email | 20 % |
| Actions | 12 % |

### `/clients/[id]` — BrochesTable (nested)

| Column | Width |
|--------|-------|
| N° lot interne | 40 % |
| Poids | 18 % |
| DLC | 22 % |
| Actions | 20 % |

### `/clients/[id]` — UpstreamRMList (nested inside broche expansion)

| Column | Width |
|--------|-------|
| Matière | 28 % |
| Fournisseur | 30 % |
| N° lot fournisseur | 28 % |
| Qté utilisée | 14 % |

---

## Inheritance Note for Later Phases

- Phase 7 (Traçabilité): `FinishedProduct.livraisonId` and `ProductionOrder.matieresPremieresUtilisees` are the same upstream chain used here. Phase 7 search will follow the identical trace path.
- Phase 8 (Dashboard): "Livraisons cette semaine" KPI reads `deliveries.filter(d => d.date >= weekStart)` and may display client names using `getCustomerById` from `lib/deliveries.ts`.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS — formal French B2B, all phase-specific strings declared, no emojis, validation messages follow Phase 3/5 convention.
- [ ] Dimension 2 Visuals: PASS — sober B2B SaaS, tables use same bordered surface as Phases 3/4/5, dialog matches Phase 3/5 dialog patterns, detail page uses card + expansion pattern consistent with Linear-style B2B.
- [ ] Dimension 3 Color: PASS — delete AlertDialog action uses destructive semantic color (appropriate for delete, not decorative); statut badges reuse Phase 5 amber/emerald (not new budget); no decorative semantic colors.
- [ ] Dimension 4 Typography: PASS — only inherited 4 sizes × 2 weights; `font-mono` for lot numbers per Phase 1 convention; `text-xs` used for sub-table headers only.
- [ ] Dimension 5 Spacing: PASS — `space-y-4` dialog form, `py-2 px-3` table cells, `px-4 py-3` expansion rows, `mb-6` page-header gap.
- [ ] Dimension 6 Registry Safety: PASS — no new shadcn primitives; all used are installed in Phase 3/4/5.

**Approval:** pending

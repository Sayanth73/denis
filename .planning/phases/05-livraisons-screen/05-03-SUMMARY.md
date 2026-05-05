---
phase: 05-livraisons-screen
plan: "03"
subsystem: deliveries
tags: [dialog, form, react-hook-form, zod, combobox, date-picker, checkbox-list, toast]
dependency_graph:
  requires:
    - 05-01 (lib/deliveries.ts, shadcn checkbox/textarea/scroll-area)
    - 05-02 (app/livraisons/page.tsx with dialogOpen slot, DeliveriesTable)
  provides:
    - components/livraisons/new-delivery-dialog.tsx
    - app/livraisons/page.tsx (updated — NewDeliveryDialog mounted)
  affects:
    - Phase 6 (Clients): Delivery.customerId is the FK linking deliveries to client records
    - Phase 7 (Tracabilite): FinishedProduct.livraisonId set by Wave 2 confirm flow; Delivery.brochesLivrees is the inverse link
    - Phase 8 (Dashboard): deliveries array populated with statut "preparee"/"livree" entries
tech_stack:
  added: []
  patterns:
    - "react-hook-form + zodResolver — same form pattern as Phase 3/4"
    - "Combobox name→id mapping: options[] are customer names; onChange resolves name→id via customers.find"
    - "getInStockBroches() from lib/deliveries.ts filters+sorts en_stock broches for checkbox list"
    - "useTraceabilityStore.getState().addDelivery() for one-shot store mutation (same getState pattern as Phase 3/4)"
    - "crypto.randomUUID() for delivery id (locked per Phase 5 decisions)"
    - "form.reset(freshDefaults()) on cancel and on successful submit"
    - "Zod v4 compliance: z.string().min(1), z.array().min(1), z.string().max(500) — no z.coerce"
key_files:
  created:
    - components/livraisons/new-delivery-dialog.tsx
  modified:
    - app/livraisons/page.tsx
decisions:
  - "Dialog width sm:max-w-[640px] max-h-[90vh] overflow-y-auto — matches Phase 4 production wizard width"
  - "No lower bound on date picker — backdating allowed for record-keeping (per 05-UI-SPEC.md)"
  - "broches remain en_stock after Préparer — updateFinishedProduct NOT called in dialog; Wave 2 AlertDialog owns that transition"
  - "Whole row clickable to toggle checkbox — div onClick + label onClick preventDefault to avoid double-toggle"
  - "freshDefaults() factory function ensures form always resets to todayIso() (not stale date from mount)"
  - "Task 3 checkpoint auto-approved per milestone-wide policy — tsc + build both exit 0"
metrics:
  duration: "~10 minutes"
  completed: "2026-05-05"
  tasks_completed: 3
  tasks_total: 3
---

# Phase 05 Plan 03: New Delivery Dialog Summary

**One-liner:** `<NewDeliveryDialog>` single-step delivery creation form with customer combobox + date picker + broches en stock checkbox list + notes textarea, wired to `addDelivery` store action with `statut: "preparee"`.

## What Was Built

### Task 1: NewDeliveryDialog Component

Created `components/livraisons/new-delivery-dialog.tsx` (268 lines, client component).

**Component contract:**

```typescript
type NewDeliveryDialogProps = {
  open: boolean;
  onOpenChange: (next: boolean) => void;
};
export function NewDeliveryDialog(props: NewDeliveryDialogProps): JSX.Element;
```

**Zod v4 schema (locked per 05-UI-SPEC.md):**

```typescript
const deliverySchema = z.object({
  customerId:     z.string().min(1, "Champ requis"),
  dateLivraison:  z.string().min(1, "Champ requis"),
  brochesLivrees: z.array(z.string()).min(1, "Sélectionnez au moins une broche."),
  notes:          z.string().max(500, "Maximum 500 caractères.").optional(),
});
```

No `z.coerce` — Zod v4 compliance (inherited from Phase 3/4 deviation fix).

**Field details:**

| Field | Component | Behavior |
|-------|-----------|----------|
| Client | `<Combobox>` | `options[]` = customer names; `onChange` maps name → id via `customers.find`; trigger displays resolved name |
| Date de livraison | `<DatePicker>` | Default `todayIso()`; `disabled={(d) => d > today+30}`; no lower bound (backdating allowed) |
| Broches en stock | `<Checkbox>` rows in `<ScrollArea max-h-[200px]>` | `getInStockBroches(finishedProducts)` filtered/sorted; each row: `font-mono` lot number + poids kg + `<DlcBadge>`; whole row clickable |
| Notes | `<Textarea rows={3} maxLength={500}>` | Optional; zod max 500 chars |

**Customer combobox name→id mapping pattern:**

```typescript
// options[] = customer names
const customerNames = customers.map((c) => c.nom);
// onChange receives name → resolve to id
const found = customers.find((c) => c.nom === name);
field.onChange(found?.id ?? "");
// Display: resolve id back to name for trigger
const selectedName = customers.find((c) => c.id === field.value)?.nom ?? "";
```

**Submit handler mutation sequence:**

```
1. customers.find(id) → resolve clientName
2. Build Delivery { id: crypto.randomUUID(), date, customerId, brochesLivrees, statut: "preparee", notes? }
3. useTraceabilityStore.getState().addDelivery(delivery)
4. toast.success(`Livraison préparée — ${N} broche(s) pour ${clientName}`)
5. form.reset(freshDefaults())
6. onOpenChange(false)
```

Note: `updateFinishedProduct` is NOT called — broches stay `en_stock` until "Marquer comme livrée" (Wave 2 AlertDialog owns that transition).

**Locked toast string:**

```
Livraison préparée — {N} broche(s) pour {clientName}
```

(em-dash with spaces, matching Phase 3/4 convention)

**Dialog layout locked values:**
- Container: `sm:max-w-[640px] max-h-[90vh] overflow-y-auto`
- Title: `Nouvelle livraison`
- Description: `Sélectionnez les broches à livrer et confirmez.`
- Form body: `space-y-4`
- Broches container: `rounded-md border border-input bg-background`
- Row: `flex items-center gap-3 px-3 py-2 hover:bg-zinc-50`
- Cancel: `variant="outline"` `Annuler`; Submit: `Préparer la livraison`

### Task 2: /livraisons Page Update

Updated `app/livraisons/page.tsx` (66 lines — unchanged length). Three minimal changes:

1. Added import: `import { NewDeliveryDialog } from "@/components/livraisons/new-delivery-dialog";`
2. Replaced `{/* Wave 3 placeholder */}` comment + `{dialogOpen && null}` with `<NewDeliveryDialog open={dialogOpen} onOpenChange={setDialogOpen} />`
3. Removed Wave 3 placeholder comment

Page already owned `dialogOpen`/`setDialogOpen` state from Wave 2 — no structural changes needed.

### Task 3: Human-Verify Checkpoint (Auto-approved)

Auto-approved per milestone-wide policy (same as Phase 2 plan 03, Phase 3 plan 02, Phase 4 plan 03).

Criteria met:
- `npx tsc --noEmit` exits 0
- `npm run build` exits 0 (10/10 static pages generated)

## Phase Hand-off Notes

**For Phase 6 (Clients):**
- `Delivery.customerId` is the FK linking deliveries to client records
- `formatDeliveryRow` in `deliveries-table.tsx` resolves `clientName` from `customerId` — usable in client detail aggregations
- DeliveriesTable already renders customer names (not UUIDs) in the Client column

**For Phase 7 (Tracabilite):**
- `FinishedProduct.livraisonId` is set atomically by the Wave 2 "Marquer comme livrée" confirm handler — primary Phase 7 downstream link
- `Delivery.brochesLivrees` (string[] of FinishedProduct.id) is the inverse link
- Both links are set in a single synchronous event handler (no async, no partial mutation)

**For Phase 8 (Dashboard):**
- `deliveries` array now contains real data with two statut values: `"preparee"` and `"livree"`
- KPI pattern: `deliveries.filter(d => d.date >= weekStart && d.statut === "livree")`
- `Delivery.date` is ISO YYYY-MM-DD string (no timezone offset issues)

## Deviations from Plan

None — plan executed exactly as written. Implementation matches the locked code provided in the plan's `<action>` block byte-for-byte in all locked sections.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes introduced. All mutations are client-side store operations. Trust boundary posture identical to T-05-04/T-05-05/T-05-06 as documented in the plan threat register.

## Self-Check: PASSED

- `components/livraisons/new-delivery-dialog.tsx` — FOUND (268 lines, ≤ 300)
- `app/livraisons/page.tsx` — FOUND (66 lines, ≤ 300)
- `export function NewDeliveryDialog` — VERIFIED
- `addDelivery` call — VERIFIED
- `getInStockBroches` usage — VERIFIED
- `Combobox`, `DatePicker`, `Checkbox`, `Textarea`, `ScrollArea`, `DlcBadge` — all VERIFIED
- `Nouvelle livraison` title — VERIFIED
- `Préparer la livraison` submit — VERIFIED
- `Livraison préparée` toast prefix — VERIFIED
- `Sélectionnez au moins une broche.` validation — VERIFIED
- `Maximum 500 caractères.` validation — VERIFIED
- `crypto.randomUUID()` — VERIFIED
- `statut: "preparee"` — VERIFIED
- `font-mono` on lot number — VERIFIED
- No `updateFinishedProduct` in dialog — VERIFIED
- No `: any` in either file — VERIFIED
- No `TODO/FIXME/XXX` — VERIFIED
- `<NewDeliveryDialog open={dialogOpen} onOpenChange={setDialogOpen} />` in page — VERIFIED
- Task 1 commit `70e389b` — FOUND
- Task 2 commit `0b032ec` — FOUND
- `npx tsc --noEmit` — exit 0
- `npm run build` — exit 0 (10/10 pages)

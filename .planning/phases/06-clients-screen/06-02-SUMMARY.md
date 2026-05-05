---
phase: 06-clients-screen
plan: 02
subsystem: clients-ui
tags: [react, zustand, react-hook-form, zod, shadcn, next-link, alert-dialog]
dependency_graph:
  requires: [lib/clients.ts, lib/store.ts, lib/types.ts, components/ui/dialog.tsx, components/ui/alert-dialog.tsx, components/ui/form.tsx, components/ui/input.tsx, components/ui/button.tsx, components/ui/table.tsx, components/empty-state.tsx]
  provides: [components/clients/client-dialog.tsx, components/clients/clients-table.tsx, app/clients/page.tsx]
  affects: [/clients route]
tech_stack:
  added: []
  patterns: [react-hook-form+zod, zustand-getstate-mutation, inline-alertdialog, hydration-guard, useeffect-form-reset]
key_files:
  created:
    - components/clients/client-dialog.tsx
    - components/clients/clients-table.tsx
    - app/clients/page.tsx
  modified: []
decisions:
  - "useEffect form.reset deps exclude form object (react-hook-form stable ref) — adding form would trigger reset loop"
  - "AlertDialog asChild on AlertDialogDescription wrapping a div with two <p> tags matches Phase 5 pattern exactly"
  - "Phone placeholder '+41 XX XXX XX XX' triggers naive XXX grep — confirmed not a code-smell marker"
  - "rehydration failed warnings in build output are pre-existing SSG behaviour (localStorage unavailable at build time), not introduced by this plan"
metrics:
  duration: "~15 minutes"
  completed: "2026-05-05"
  tasks: 2
  files: 3
---

# Phase 6 Plan 2: Clients CRUD UI Summary

Full CRUD lifecycle for the `/clients` route — list, create, edit, delete — with locked French toasts, form validation, and inline confirmation dialogs.

## What Was Built

### `components/clients/client-dialog.tsx` (212 lines)

**Contract:**
```typescript
type ClientDialogProps = {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  mode: "create" | "edit";
  client?: Customer;  // required when mode === "edit"
};
export function ClientDialog(props: ClientDialogProps): JSX.Element;
```

**Zod Schema (locked):**
```typescript
const clientSchema = z.object({
  nom:       z.string().min(2, "Minimum 2 caractères."),
  adresse:   z.string().min(5, "Minimum 5 caractères."),
  telephone: z.string().min(1, "Champ requis"),
  email:     z.string().email("Email invalide.").optional().or(z.literal("")),
});
```

**Mode switching pattern:**
- Create: `DialogTitle = "Nouveau client"` — `addCustomer({ id: crypto.randomUUID(), ...trimmed })` → toast `"Client ajouté — {nom}"`
- Edit: `DialogTitle = "Modifier le client"` — `updateCustomer(client!.id, patch)` → toast `"Client mis à jour — {nom}"`
- `useEffect` resets form when `open`, `mode`, or `client` changes to prevent stale values
- `handleOpenChange(false)` resets form to empty defaults before closing

**Fields:** nom / adresse / telephone (tel) / email — all with `maxLength` caps and French validation messages.

---

### `components/clients/clients-table.tsx` (158 lines)

**Contract:**
```typescript
type ClientsTableProps = {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
};
export function ClientsTable(props: ClientsTableProps): JSX.Element;
```

**Table layout:**
- 5 columns: Nom (22%) | Adresse (28%) | Téléphone (18%) | Email (20%) | Actions (12%)
- Nom cell: `<Link href={/clients/${customer.id}}>` — enables detail navigation (Phase 7)
- Email cell: shows `"—"` when absent
- Actions: Pencil (ghost, calls `onEdit`) + Trash2 (ghost destructive, sets `pendingDeleteId`)

**Inline delete AlertDialog pattern:**
- State: `useState<string | null>(null)` for `pendingDeleteId`
- `pendingCustomer` resolved from `customers.find(c => c.id === pendingDeleteId)` for dialog body
- Confirm: `deleteCustomer(pendingDeleteId)` → toast `"Client supprimé — {nom}"` → close
- Title locked: `"Supprimer le client"`, body: client name + `"Cette action est irréversible."`
- Action button: `className="bg-destructive text-destructive-foreground hover:bg-destructive/90"`

---

### `app/clients/page.tsx` (75 lines)

**State:**
```typescript
const [dialogOpen, setDialogOpen]     = React.useState(false);
const [dialogMode, setDialogMode]     = React.useState<"create" | "edit">("create");
const [editTarget, setEditTarget]     = React.useState<Customer | undefined>(undefined);
```

**Hydration guard:** Returns disabled `"+ Nouveau client"` button while `!hasHydrated` — prevents empty-state flicker on page load.

**Empty state:** `<EmptyState icon={Users} heading="Aucun client" body="..." cta={{ label: "+ Nouveau client", onClick: openCreate, icon: Plus }} />`

**Helper functions:**
- `openCreate()`: sets mode=create, editTarget=undefined, opens dialog
- `openEdit(customer)`: sets mode=edit, editTarget=customer, opens dialog

---

## Commits

| Task | Commit | Files |
|------|--------|-------|
| 1 — Build ClientDialog | 62b5f13 | components/clients/client-dialog.tsx (created, 212 lines) |
| 2 — Build ClientsTable + /clients page | 09ea65a | components/clients/clients-table.tsx (created, 158 lines), app/clients/page.tsx (replaced placeholder, 75 lines) |

## Deviations from Plan

None — plan executed exactly as written. One note: the phone placeholder `+41 XX XXX XX XX` contains `XX` which triggers a naive `XXX` grep pattern in the verification script. Confirmed it is not a code-smell TODO marker.

## Phase 7/8 Hand-off Notes

**Phase 7 (traceability):** The Nom cell in `ClientsTable` already links to `/clients/{id}` via Next.js `<Link>`. Phase 7 needs to create `app/clients/[id]/page.tsx` — the route segment and link are ready. The `lib/clients.ts` helpers (`getDeliveriesForCustomer`, `getBrochesForDelivery`, `getRawMaterialsForBroche`) from Plan 1 provide the full traceability chain for the detail view.

**Phase 8 (dashboard):** The `customers` array from `useTraceabilityStore((s) => s.customers)` is available for aggregation. Customer count and recent additions can feed summary cards on the dashboard.

## Known Stubs

None. All three files are fully wired to the Zustand store with live data. No placeholder text or hardcoded empty values flow to UI rendering.

## Threat Flags

None. No new network endpoints, auth paths, file access patterns, or schema changes were introduced. All threat mitigations from the plan's STRIDE register (T-06-03, T-06-06) are implemented:
- T-06-03: Zod validates all four fields before any store write; Input `maxLength` caps provide DOM-level guardrail; all string values are `.trim()`-ed before persistence.
- T-06-06: `z.string().email()` validates email format; empty string maps to `undefined` before store write (no malformed email persisted); `type="email"` on Input provides browser-level hint.

## Self-Check: PASSED

- FOUND: components/clients/client-dialog.tsx (212 lines)
- FOUND: components/clients/clients-table.tsx (158 lines)
- FOUND: app/clients/page.tsx (75 lines)
- FOUND: commit 62b5f13
- FOUND: commit 09ea65a
- `npx tsc --noEmit` exits 0
- `npm run build` exits 0

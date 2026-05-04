---
phase: 3
phase_name: Matières Premières Screen
status: ready_for_planning
mode: auto-generated
gathered: 2026-05-04
---

# Phase 3: Matières Premières Screen - Context

**Mode:** Auto-generated (discuss skipped via `workflow.skip_discuss`)

<domain>
## Phase Boundary

Build the `/matieres-premieres` screen: a sortable table of raw material lots and a validated reception dialog.

In scope:
- Route page `app/matieres-premieres/page.tsx` replacing the Phase 1 placeholder.
- A sortable table component listing all `RawMaterial` entries from the store.
- Columns (in this exact order): Type, Nom, Fournisseur, N° lot fournisseur, Quantité (restante / reçue), DLC (color badge), Statut.
- Per-column sort by click-to-toggle (asc / desc), with a visible sort indicator.
- "Statut" column derived: `actif` (quantité > 0 AND dlc > today) | `épuisé` (quantité = 0) | `dlc dépassée` (dlc < today).
- "+ Réceptionner un lot" button opens a Dialog with the form below.
- Form fields (validation in parens):
  - Type — select with options `boeuf | agneau | poulet | epices | marinade | autre` (required)
  - Nom — text input (required, ≥3 chars)
  - Fournisseur — text input with auto-complete on existing supplier names from the store (required)
  - N° lot fournisseur — text input (required)
  - Quantité reçue (kg) — number input, > 0 (required)
  - Date de réception — date picker, defaults to today (required, ≤ today)
  - DLC — date picker (required, > Date de réception)
  - Température de réception (°C) — number input (required, can be 0 or negative — chilled meats)
  - Certificat sanitaire — text input (optional)
- On submit: create RawMaterial with `crypto.randomUUID()`, `quantiteRestante = quantiteRecue`, push to store, close dialog, toast "Lot réceptionné — {nom} ({fournisseur})."
- Empty state when no rows: `<EmptyState>` with icon, heading "Aucune matière première en stock", body "Réceptionnez votre premier lot pour démarrer." plus the same "+ Réceptionner un lot" CTA.
- DLC color badge component `<DlcBadge dlc={iso} />` — first usage of the green/orange/red/grey rules from `lib/dlc.ts`. This component should be reusable across phases (5 deliveries, 7 traceability).

Out of scope (deferred):
- Editing or deleting raw materials (PRD doesn't require it for the POC; not in success criteria).
- Filtering by type or supplier (sortable is enough).
- Pagination (PRD §6: "max 20-30 entries per table, no pagination").
- Bulk reception or CSV import.

</domain>

<decisions>
## Implementation Decisions

Inherits PROJECT.md locked decisions and Phase 1 UI-SPEC design system. Specifically:
- shadcn components needed (install in this phase): Table, Dialog, Input, Select, Label, Form (uses react-hook-form + zod), Badge, Calendar, Popover (for date picker), Command (for combobox auto-complete).
- Form library: `react-hook-form` + `zod` for validation (industry standard for Next.js, supported by shadcn `Form`).
- Date picker: shadcn `<Calendar>` inside `<Popover>` triggered by an `<Input>`-style button. ISO `YYYY-MM-DD` strings stored.
- Table: `<Table>` from shadcn, sorting handled with React `useState` (no TanStack Table needed for POC scale).
- Auto-complete: shadcn `<Command>` inside a `<Popover>` triggered by the supplier `<Input>`.

### Claude's Discretion
- File layout:
  - `app/matieres-premieres/page.tsx` — route, fetches store, renders table + dialog
  - `components/matieres/raw-materials-table.tsx` — sortable table
  - `components/matieres/reception-dialog.tsx` — dialog + form
  - `components/dlc-badge.tsx` — reusable DLC color badge
  - `components/empty-state.tsx` — reusable empty-state component
  - `lib/raw-materials.ts` — pure helpers (status derivation, supplier list extraction)
- Sort state: column + direction held in `useState` in the table component, not persisted.
- Form schema: in `components/matieres/reception-dialog.tsx` adjacent to the form, since it's not reused.
- The DlcBadge color tokens are already locked in Phase 1 UI-SPEC §Color §Semantic — green/orange/red/grey scoped variants.

</decisions>

<code_context>
## Existing Code Insights

After Phase 2:
- `lib/store.ts` exposes `useTraceabilityStore` with `rawMaterials: RawMaterial[]` + `addRawMaterial(rm)` action.
- `lib/types.ts` has `RawMaterial` type with PRD §3 fields verbatim.
- `lib/dlc.ts` has `dlcColor(dlcIso, today)` returning `green | orange | red | grey`.
- shadcn components installed: Button, Sonner, AlertDialog. This phase adds: Table, Dialog, Input, Select, Label, Form, Badge, Calendar, Popover, Command.
- Empty state pattern not yet established — Phase 3 sets the precedent for Phases 5/6.

</code_context>

<specifics>
## Specific Ideas from PRD §5.3, §6, §7

PRD §5.3 specifies the table columns and the reception form fields exactly. Preserve column order and field labels.

PRD §6 specifies the DLC color thresholds (also in `lib/dlc.ts`).

PRD §6: "Empty states soignés sur chaque tableau (Aucune matière première en stock — réceptionnez votre premier lot)" — use this exact French copy verbatim, but split into heading + body for visual hierarchy.

PRD §6: "Confirmations avant les actions importantes" — reception is a creation action; the toast confirms post-action. No pre-action confirmation needed (would be friction for a POC demo).

PRD §6: "Toasts sur chaque action de création/modification" — sonner toast on successful reception.

Form validation messages (formal French B2B):
- Required field: "Champ requis"
- Type select: "Sélectionnez un type"
- Quantité < 0: "La quantité doit être supérieure à zéro"
- DLC ≤ réception: "La DLC doit être postérieure à la date de réception"
- Date réception > today: "La date de réception ne peut pas être dans le futur"

Toast on success: `Lot réceptionné — {nom} ({fournisseur})`

</specifics>

<deferred>
## Deferred Ideas

- Edit / delete raw material rows — not in PRD §5.3 scope.
- Bulk operations — not in PRD scope.
- Multi-supplier pricing — not in PRD scope (PRD §8 explicitly excludes).
- Import from CSV / external systems — not in PRD scope.

</deferred>

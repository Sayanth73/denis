---
phase: 3
plan: 02
subsystem: matieres-premieres
tags: [react-hook-form, zod, sortable-table, dialog-form, zustand, wave2]
dependency_graph:
  requires:
    - lib/types.ts (RawMaterial type)
    - lib/store.ts (useTraceabilityStore, addRawMaterial)
    - lib/raw-materials.ts (deriveStatut, TYPE_LABELS, STATUT_LABELS, STATUT_CLASSES, getSupplierOptions)
    - components/dlc-badge.tsx (DlcBadge)
    - components/empty-state.tsx (EmptyState)
    - components/ui/date-picker.tsx (DatePicker)
    - components/ui/combobox.tsx (Combobox)
    - components/ui/table.tsx (Table primitives)
    - components/ui/dialog.tsx (Dialog primitives)
    - components/ui/form.tsx (Form/FormField/FormMessage)
    - components/ui/input.tsx (Input)
    - components/ui/select.tsx (Select primitives)
    - components/ui/button.tsx (Button)
  provides:
    - components/matieres/raw-materials-table.tsx (RawMaterialsTable)
    - components/matieres/reception-dialog.tsx (ReceptionDialog)
    - app/matieres-premieres/page.tsx (MatieresPremieresPage — replaces PlaceholderPage)
  affects:
    - REQ-raw-materials-list (complete — sortable 7-column table)
    - REQ-raw-material-receive (complete — 9-field validated reception dialog)
    - Phases 4–8 inherit the sortable-header chevron pattern, dialog 560px width, react-hook-form onBlur mode
tech_stack:
  added: []
  patterns:
    - Sortable table with useState (none→asc→desc→none cycle); no TanStack Table needed at POC scale
    - Controlled Dialog owned by parent page (open/onOpenChange pattern)
    - react-hook-form mode=onBlur, reValidateMode=onChange; zod v4 schema (string-based numerics, refine for gt/date)
    - Hydration guard via hasHydrated flag (prevents empty-state flicker on first paint)
    - Statut badge via STATUT_CLASSES[deriveStatut(rm, today)] — no inlined bucket classes
    - DLC cell via <DlcBadge> — no inlined bucket classes
    - Combobox free-text fallback: typed value propagated via onChange in CommandInput
key_files:
  created:
    - components/matieres/raw-materials-table.tsx
    - components/matieres/reception-dialog.tsx
  modified:
    - app/matieres-premieres/page.tsx (replaced PlaceholderPage with full client component)
decisions:
  - "Zod v4 string-based numeric schema: HTML inputs return strings; using z.string().refine(v => parseFloat(v) > 0) instead of z.coerce.number() avoids @hookform/resolvers type-parameter conflicts with Zod v4 coerce output type (unknown vs number)"
  - "No TanStack Table: 03-CONTEXT.md decision — useState-backed sort is sufficient for POC 5-30 rows"
  - "Dialog mounted unconditionally on page: stable open state across empty→populated transition when first reception closes the dialog"
  - "Two separate useTraceabilityStore selectors (rawMaterials, hasHydrated) avoid useShallow requirement noted in 02-01-SUMMARY"
metrics:
  duration: 50m 32s
  completed: 2026-05-05
  tasks: 4
  files_created: 2
  files_modified: 1
---

# Phase 3 Plan 02: Wave 2 — Matières Premières Screen (Table + Reception Dialog) Summary

Sortable 7-column raw materials table, 9-field zod-validated reception dialog, and wired `/matieres-premieres` page assembled from Wave 1 primitives — REQ-raw-materials-list and REQ-raw-material-receive both complete.

## What Was Built

### Task 1 — `<RawMaterialsTable />` (187 lines)

**Contract:** `RawMaterialsTable({ rows: RawMaterial[] }): JSX.Element`

7 columns in locked order per UI-SPEC §Raw Materials Table:

| Col | Key | Width | Notes |
|-----|-----|-------|-------|
| Type | type | 10% | `TYPE_LABELS[rm.type]` |
| Nom | nom | 22% | truncated |
| Fournisseur | fournisseur | 18% | truncated |
| N° lot fournisseur | numeroLotFournisseur | 16% | `font-mono` |
| Quantité | quantite | 12% | `{quantiteRestante} / {quantiteRecue} kg`, `tabular-nums`, right-aligned |
| DLC | dlc | 12% | `<DlcBadge value={rm.dlc} />` |
| Statut | statut | 10% | `STATUT_CLASSES[deriveStatut(rm, today)]` |

Sort cycle: none → asc → desc → none. Managed in `useState<SortKey | null>`. `compare()` function uses `localeCompare(a, b, "fr")` for all string columns (handles Bœuf, Épices, Épuisé correctly).

**Locked constraints honored:**
- `colgroup` widths 10/22/18/16/12/12/10 sum to 100%
- Header: `bg-zinc-50 + text-sm font-medium text-muted-foreground py-3 px-3 border-b border-border`
- Sort indicators: `ChevronsUpDown` (inactive, size=14, muted/60), `ChevronUp` (asc), `ChevronDown` (desc)
- No inlined DLC bucket classes (routes entirely through `<DlcBadge>` and `STATUT_CLASSES`)

**Commit:** `98ffe77`

---

### Task 2 — `<ReceptionDialog />` (247 lines)

**Contract:** `ReceptionDialog({ open: boolean; onOpenChange: (next: boolean) => void }): JSX.Element`

Controlled dialog; parent (page) owns the open state.

**Zod schema fields (9):**

| Field | Type | Validation |
|-------|------|-----------|
| type | z.enum(TYPE_KEYS) | "Sélectionnez un type" |
| nom | z.string() | min 1 "Champ requis"; min 3 "Le nom doit contenir au moins 3 caractères" |
| fournisseur | z.string().trim() | min 1 "Champ requis" |
| numeroLotFournisseur | z.string().trim() | min 1 "Champ requis" |
| quantiteRecue | z.string().refine | "Champ requis"; "La quantité doit être supérieure à zéro" |
| dateReception | z.string().refine | "Champ requis"; "La date de réception ne peut pas être dans le futur" |
| dlc | z.string() | min 1 "Champ requis" |
| temperatureReception | z.string().refine | "Champ requis" |
| certificatSanitaire | z.string().optional() | — |

Cross-field refinement: `dlc > dateReception` → "La DLC doit être postérieure à la date de réception." (path: ["dlc"])

**Locked details:**
- `sm:max-w-[560px] max-h-[90vh] overflow-y-auto`
- Date de réception + DLC in `grid grid-cols-2 gap-4`
- `mode: "onBlur"`, `reValidateMode: "onChange"`
- Form resets on close (to show placeholder on next open, `type` cast to `undefined`)
- Toast: `Lot réceptionné — {nom} ({fournisseur})`
- `quantiteRestante = parseFloat(quantiteRecue)` on submit

**Commit:** `d8ac319`

---

### Task 3 — `app/matieres-premieres/page.tsx` (61 lines)

Replaces Phase 1 `PlaceholderPage`. Client component owning `dialogOpen` state.

**Structure:**
1. `hasHydrated` guard: disabled skeleton header until store rehydrates (prevents empty-state flicker)
2. Page-header row: `flex items-center justify-between mb-6 h-9` — empty `<div/>` left, primary CTA right
3. Data area: `<EmptyState>` when `rawMaterials.length === 0`, `<RawMaterialsTable rows={rawMaterials} />` otherwise
4. `<ReceptionDialog>` mounted unconditionally at the bottom (stable open state)

**Commit:** `e822263`

---

### Task 4 — Human-verify checkpoint

AUTO-APPROVED per milestone policy (Phase 2 SUMMARY: "AUTO-APPROVED 2026-05-04 per milestone policy"):
- `npx tsc --noEmit` exits 0
- `npm run build` exits 0

---

## Locked Patterns for Phases 4–8

| Pattern | Contract | Source |
|---------|----------|--------|
| Sortable column header | `ChevronsUpDown` (inactive) / `ChevronUp` (asc) / `ChevronDown` (desc); size=14; cycle none→asc→desc→none | `raw-materials-table.tsx` |
| Dialog dimensions | `sm:max-w-[560px] max-h-[90vh] overflow-y-auto` | `reception-dialog.tsx` |
| Form mode | `mode: "onBlur"` + `reValidateMode: "onChange"` | `reception-dialog.tsx` |
| Zod v4 numeric fields | Use `z.string().refine()` + `parseFloat()` in submit (not `z.coerce`) to avoid hookform resolver type conflicts | `reception-dialog.tsx` |
| Combobox free-text | `onChange` on `CommandInput.onValueChange` propagates typed value immediately | `combobox.tsx` (Phase 3 Wave 1) |
| Statut badge | `STATUT_CLASSES[deriveStatut(rm, today)]` — never inline bucket classes | `raw-materials-table.tsx` + `lib/raw-materials.ts` |
| Hydration guard | `if (!hasHydrated) return <skeleton>` before data-dependent render | `page.tsx` |
| Dialog open-state ownership | Parent owns `dialogOpen` + `setDialogOpen`; child receives `open`/`onOpenChange` | `page.tsx` + `reception-dialog.tsx` |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Zod v3 errorMap/invalid_type_error API not available in Zod v4**
- **Found during:** Task 2 — `npx tsc --noEmit` after initial write
- **Issue:** Plan skeleton used `z.enum(keys, { errorMap: () => ... })` and `z.coerce.number({ invalid_type_error: ... })` — both are Zod v3 APIs. Installed version is Zod v4.4.3 (auto-installed by shadcn CLI in Wave 1). Zod v4 uses `error` instead of `errorMap`/`invalid_type_error`. Additionally, `z.coerce.number()` in Zod v4 infers `Input = unknown` which conflicts with `@hookform/resolvers@5.2.2` Resolver type parameter requiring `FieldValues` (string-keyed).
- **Fix:** Replaced `z.coerce.number()` with `z.string().refine(v => parseFloat(v) > 0, "La quantité...")`. Numeric values are parsed via `parseFloat()` in the `onSubmit` handler after zod validation. This keeps the form's `Input` type as all-strings (compatible with `FieldValues`) and produces correct numeric values for the `RawMaterial` domain type.
- **Files modified:** `components/matieres/reception-dialog.tsx`
- **Commit:** `d8ac319`

**2. [Rule 1 - Bug] Plan specified `quantiteRestante: values.quantiteRecue` but after string-based schema fix values.quantiteRecue is a string**
- **Found during:** Task 2 (same fix iteration as above)
- **Issue:** With string-based schema, `values.quantiteRecue` is a string, but `RawMaterial.quantiteRestante` is `number`.
- **Fix:** `quantiteRestante: parseFloat(values.quantiteRecue)` — consistent with the string-to-number approach.
- **Files modified:** `components/matieres/reception-dialog.tsx`
- **Commit:** `d8ac319`

## Authentication Gates

None.

## Known Stubs

None. All three files are fully implemented and wired to the Phase 2 store. The 5 seeded raw materials render immediately on page load from `localStorage`. New lots submitted via the dialog persist across refreshes.

## Threat Flags

None — this plan adds no network endpoints, auth paths, file access patterns, or schema changes at trust boundaries. All data flows through the existing Zustand persist store.

## Self-Check: PASSED

Files exist on disk:
- `components/matieres/raw-materials-table.tsx` — FOUND
- `components/matieres/reception-dialog.tsx` — FOUND
- `app/matieres-premieres/page.tsx` — FOUND
- `.planning/phases/03-matieres-premieres-screen/03-02-SUMMARY.md` — FOUND

Commits present in git log:
- `98ffe77` feat(03-02): build sortable RawMaterialsTable — FOUND
- `d8ac319` feat(03-02): build ReceptionDialog with 9-field zod schema — FOUND
- `e822263` feat(03-02): wire /matieres-premieres page — table, dialog, empty state — FOUND

Build checks:
- `npx tsc --noEmit` exits 0 — PASS
- `npm run build` exits 0 — PASS

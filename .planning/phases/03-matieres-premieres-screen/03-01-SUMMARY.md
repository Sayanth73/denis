---
phase: 3
plan: 01
subsystem: matieres-premieres
tags: [shadcn, primitives, reusable-components, helpers]
dependency_graph:
  requires:
    - lib/types.ts (RawMaterial type)
    - lib/dlc.ts (dlcColor function)
    - lib/utils.ts (cn helper)
    - components/ui/button.tsx (Button primitive)
  provides:
    - components/ui/table.tsx
    - components/ui/dialog.tsx
    - components/ui/input.tsx
    - components/ui/select.tsx
    - components/ui/label.tsx
    - components/ui/form.tsx
    - components/ui/badge.tsx
    - components/ui/calendar.tsx
    - components/ui/popover.tsx
    - components/ui/command.tsx
    - components/ui/date-picker.tsx
    - components/ui/combobox.tsx
    - components/dlc-badge.tsx
    - components/empty-state.tsx
    - lib/raw-materials.ts (deriveStatut, getSupplierOptions, formatDate, TYPE_LABELS, STATUT_LABELS, STATUT_CLASSES, StatutValue)
  affects:
    - Wave 2 (03-02) consumes every artefact for the table + reception dialog
    - Phases 4–8 inherit DlcBadge, EmptyState, DatePicker, Combobox unchanged
tech_stack:
  added:
    - react-hook-form ^7.75.0
    - "@hookform/resolvers ^5.2.2"
    - zod ^4.4.3
    - date-fns ^4.1.0
    - react-day-picker ^9.14.0
    - cmdk ^1.1.1
    - "@radix-ui/react-dialog ^1.1.15"
    - "@radix-ui/react-label ^2.1.8"
    - "@radix-ui/react-popover ^1.1.15"
    - "@radix-ui/react-select ^2.2.6"
  patterns:
    - shadcn New York preset (CLI 2.10.0, neutral base, CSS variables) — same baseline Phase 1 and Phase 2 used
    - Free-text Combobox: typing into CommandInput propagates the typed value via onChange, so unmatched suppliers become the field value
    - DatePicker stores ISO YYYY-MM-DD; isoToDate uses UTC midnight to match lib/dlc.ts conventions and avoid timezone drift
    - Statut precedence dlc_depassee > epuise > actif (UI-SPEC §Statut), matches DLC UTC-midnight comparison
key_files:
  created:
    - components/ui/table.tsx
    - components/ui/dialog.tsx
    - components/ui/input.tsx
    - components/ui/select.tsx
    - components/ui/label.tsx
    - components/ui/form.tsx
    - components/ui/badge.tsx
    - components/ui/calendar.tsx
    - components/ui/popover.tsx
    - components/ui/command.tsx
    - components/ui/date-picker.tsx
    - components/ui/combobox.tsx
    - components/dlc-badge.tsx
    - components/empty-state.tsx
    - lib/raw-materials.ts
  modified:
    - package.json (peer-deps added by shadcn CLI)
    - package-lock.json (lockfile sync)
decisions:
  - shadcn CLI pinned to 2.10.0 (matches Phase 2 alert-dialog layout — never `@latest`)
  - All form/date peer-deps were auto-installed by the shadcn CLI; the explicit `npm install` step in the plan was a no-op safety net
  - Local formatDate helpers in dlc-badge.tsx and date-picker.tsx duplicate lib/raw-materials.ts formatDate by design — keeps each component self-contained for Phases 4–8 reuse without forcing them to import from lib/raw-materials.ts
  - Combobox free-text fallback is wired by setting onChange on the typed query (CommandInput.onValueChange), not gated on empty match — UI-SPEC explicitly requires this so a brand-new supplier name becomes the value as the user types
metrics:
  duration: 2m 28s
  completed: 2026-05-04
  tasks: 2
  files_created: 15
  files_modified: 2
---

# Phase 3 Plan 01: Wave 1 — shadcn install + reusable components Summary

shadcn primitives + react-hook-form/zod/date-fns peer-deps installed; four reusable building blocks (`<DlcBadge>`, `<EmptyState>`, `<DatePicker>`, `<Combobox>`) and the `lib/raw-materials.ts` pure-helpers module shipped — Wave 2 now has every dependency in place to assemble `/matieres-premieres`.

## What Was Built

### Task 1 — shadcn primitives + form/date peer dependencies

`npx shadcn@2.10.0 add table dialog input select label form badge calendar popover command --yes` ran cleanly. The CLI created 10 new files under `components/ui/`, did NOT overwrite the existing `button.tsx` (verified — "Skipped 1 files: components/ui/button.tsx"), and auto-installed every Radix peer plus the form/date stack:

| Peer-dep | Version |
|----------|---------|
| react-hook-form | ^7.75.0 |
| @hookform/resolvers | ^5.2.2 |
| zod | ^4.4.3 |
| date-fns | ^4.1.0 |
| react-day-picker | ^9.14.0 |
| cmdk | ^1.1.1 |
| @radix-ui/react-dialog | ^1.1.15 |
| @radix-ui/react-label | ^2.1.8 |
| @radix-ui/react-popover | ^1.1.15 |
| @radix-ui/react-select | ^2.2.6 |

**Note:** because the shadcn CLI auto-pulled `react-hook-form @hookform/resolvers zod date-fns`, the explicit `npm install ...` step listed in the plan was a redundant safety net and skipped. No additional `npm install` invocation was needed — `node -e "require.resolve(...)"` resolves all five peer-deps from the shadcn-pulled versions. `npx tsc --noEmit` exits 0.

**Commit:** `c509104` — `chore(03-01): install shadcn primitives + form/date peer deps`

### Task 2 — reusable primitives + raw-materials helpers

Five files created. Every locked class/string from 03-UI-SPEC.md is preserved verbatim. Every file is well under the 300-line cap (largest = 87 lines for `combobox.tsx`).

| File | Exports | Lines | Purpose |
|------|---------|-------|---------|
| `components/dlc-badge.tsx` | `DlcBadge` | 35 | Locked Phase 3 wrapper, calls `dlcColor(value, new Date())`, JJ.MM.AAAA |
| `components/empty-state.tsx` | `EmptyState` | 36 | Dashed-border layout, optional CTA, server-component eligible |
| `components/ui/date-picker.tsx` | `DatePicker` | 75 | Popover + Calendar `mode="single"`, `locale={fr}`, ISO YYYY-MM-DD I/O |
| `components/ui/combobox.tsx` | `Combobox` | 87 | Popover + Command, `w-[var(--radix-popover-trigger-width)]`, free-text fallback |
| `lib/raw-materials.ts` | `deriveStatut`, `getSupplierOptions`, `formatDate`, `TYPE_LABELS`, `STATUT_LABELS`, `STATUT_CLASSES`, `StatutValue` | 65 | Pure helpers — no React imports |

`deriveStatut` precedence locked to `dlc_depassee > epuise > actif`; UTC-midnight comparison matches `lib/dlc.ts`. `getSupplierOptions` dedupes via Set, trims whitespace, sorts via `localeCompare(a, b, "fr")`. `TYPE_LABELS` keys match the `RawMaterial["type"]` union exactly.

**Commit:** `21672be` — `feat(03-01): add reusable Phase 3 primitives + raw-materials helpers`

## Locked Classes / Strings Honored

- DlcBadge: all four buckets present verbatim (`bg-emerald-100 text-emerald-800 border-emerald-200`, `bg-amber-100 text-amber-800 border-amber-200`, `bg-red-100 text-red-800 border-red-200`, `bg-zinc-100 text-zinc-600 border-zinc-200`)
- DLC class regression guard: `bg-emerald-100 text-emerald-800 border-emerald-200` appears only in `components/dlc-badge.tsx` and `lib/raw-materials.ts` (raw-materials owns the Statut palette which legitimately reuses the green token)
- EmptyState: `border-dashed`, `py-16`, `text-xl font-semibold mb-2`, `mb-6 / mb-0` CTA presence toggle
- DatePicker: trigger `h-9 justify-start font-normal`, `align="start" sideOffset={4}`, `p-0` PopoverContent, `locale={fr}`
- Combobox: trigger same shape, `w-[var(--radix-popover-trigger-width)] p-0`
- Type labels: `Bœuf | Agneau | Poulet | Épices | Marinade | Autre` per UI-SPEC §Type select options
- Statut labels: `Actif | Épuisé | DLC dépassée` per UI-SPEC §Statut

## Wave 2 Inheritance Contract

Wave 2 (`03-02-PLAN.md`) imports from these new files:

| Wave 2 consumer | Import |
|-----------------|--------|
| `<RawMaterialsTable />` | `Badge` from `@/components/ui/badge`; `Table*` from `@/components/ui/table`; `DlcBadge` from `@/components/dlc-badge`; `EmptyState` from `@/components/empty-state`; `deriveStatut, formatDate, TYPE_LABELS, STATUT_LABELS, STATUT_CLASSES, StatutValue` from `@/lib/raw-materials` |
| `<ReceptionDialog />` | `Dialog*` from `@/components/ui/dialog`; `Form*` from `@/components/ui/form`; `Input` from `@/components/ui/input`; `Select*` from `@/components/ui/select`; `Label` from `@/components/ui/label`; `DatePicker` from `@/components/ui/date-picker`; `Combobox` from `@/components/ui/combobox`; `getSupplierOptions, TYPE_LABELS` from `@/lib/raw-materials` |
| `<MatieresPremieresPage />` | `EmptyState` from `@/components/empty-state` (page-level empty state); `Package, Plus` icons from `lucide-react` |

## File-size Headroom

All five new files combined add 298 lines — average ~60 lines/file, well below the 300-line cap. Wave 2's `<ReceptionDialog />` is forecast at ~250 lines (zod schema + 9 fields + submit handler) which still fits cleanly.

## Verification Run

```
[1] All 10 shadcn primitive files exist under components/ui/                  PASS
[2] All 5 reusable primitives exist                                            PASS
[3] react-hook-form, @hookform/resolvers, zod, date-fns, react-day-picker
    resolve via Node                                                           PASS
[4] npx tsc --noEmit exits 0                                                   PASS
[5] No file exceeds 300 lines                                                  PASS
[6] All 4 locked DLC bucket classes present in components/dlc-badge.tsx        PASS
[7] DLC green class is owned only by dlc-badge.tsx + raw-materials.ts          PASS
[8] No `: any` in any of the 5 new files                                       PASS
```

## Deviations from Plan

The "auto-fix on missing peer-deps" branch was not needed — the shadcn CLI pulled `react-hook-form @hookform/resolvers zod date-fns react-day-picker cmdk` automatically. The plan's `npm install react-hook-form ...` fallback step was a defensive guard that turned out unnecessary, not a deviation.

### Bookkeeping Decisions (not source-code deviations)

**1. [Bookkeeping] Did NOT mark REQ-raw-materials-list / REQ-raw-material-receive complete in REQUIREMENTS.md**
- **Found during:** State-update step
- **Issue:** Plan frontmatter declares `requirements: [REQ-raw-materials-list, REQ-raw-material-receive]` but the same two requirements are also declared on 03-02-PLAN.md. Marking them complete after Wave 1 would be premature — at this point the user cannot view a sortable matières premières table or open a reception dialog (those are Wave 2 deliverables).
- **Decision:** Left both requirements as Pending in REQUIREMENTS.md. 03-02 executor will mark them complete after Wave 2 wires `<RawMaterialsTable />`, `<ReceptionDialog />`, and `app/matieres-premieres/page.tsx`.
- **Files modified:** none
- **Commit:** none

**2. [Bookkeeping] Did NOT back-fill prior-plan metrics in STATE.md**
- **Found during:** State-update step
- **Issue:** STATE.md "Total plans completed: 0" pre-existed despite Phase 1 (2 plans) and Phase 2 (1 plan) being shipped. Back-filling those metrics would require reconstructing durations from git history — out of scope for a Wave-1 executor.
- **Decision:** Recorded only this plan's metrics (1 plan, 2m 28s). Left a note in STATE.md velocity section: "(this session — prior plans 01-01, 01-02, 02-01 not back-filled)". A future cleanup pass (or Phase 9 polish) can reconstruct prior metrics if desired.
- **Files modified:** .planning/STATE.md (this plan's session only)
- **Commit:** included in final docs commit

## Authentication Gates

None.

## Known Stubs

None. Every artefact in this Wave is a fully-implemented building block; the only "deferred" pieces are Wave 2 consumers (`<RawMaterialsTable />`, `<ReceptionDialog />`, `app/matieres-premieres/page.tsx`) which 03-02-PLAN.md will assemble.

## Threat Flags

None — this Wave adds no network endpoints, auth paths, file access, or trust-boundary schema changes. All artefacts are local UI primitives or pure helpers.

## Self-Check: PASSED

- 16 files referenced (15 created + SUMMARY.md) — all present on disk
- 2 commits referenced (c509104, 21672be) — both present in `git log --oneline --all`

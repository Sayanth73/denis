---
phase: 09-polish-demo-dry-run
plan: "01"
subsystem: ui-polish
tags:
  - audit
  - ui-polish
  - deferred-fixes
  - css
  - shadcn
dependency_graph:
  requires:
    - "08: production + livraisons (all phases)"
  provides:
    - "Cross-cutting UX compliance verified"
    - "Five deferred STATE.md polish items applied"
    - "Empty-state locked copy enforced across all pages"
  affects:
    - "components/layout/nav-item.tsx"
    - "components/layout/reset-button.tsx"
    - "components/ui/alert-dialog.tsx"
    - "components/ui/sonner.tsx"
    - "app/globals.css"
    - "app/livraisons/page.tsx"
    - "app/clients/page.tsx"
tech_stack:
  added: []
  patterns:
    - "Full-row sidebar active indicator (top-0 bottom-0 w-0.5 bg-primary)"
    - "active:bg-zinc-200 pressed-state on ghost buttons and nav items"
    - "AlertDialog with text-xl title, rounded-md, shadow-md"
key_files:
  created: []
  modified:
    - "components/layout/nav-item.tsx"
    - "components/layout/reset-button.tsx"
    - "components/ui/alert-dialog.tsx"
    - "components/ui/sonner.tsx"
    - "app/globals.css"
    - "app/livraisons/page.tsx"
    - "app/clients/page.tsx"
decisions:
  - "D-04c (Brand role in Typography table): no source change required — UI-SPEC already declares the brand row; item resolved by annotation only"
  - "bg-zinc-100 in nav-item.tsx active/hover states and broches-expansion.tsx table header are structural styling, not DLC — exempt from DLC audit"
  - "tracabilite-downstream.tsx uses bg-zinc-100 and bg-emerald-50 for broche.statut (livree/en_stock) — status badges, not DLC badges — exempt"
metrics:
  duration: "~8 minutes"
  completed_date: "2026-05-05"
  tasks_completed: 3
  files_modified: 7
---

# Phase 9 Plan 01: Polish & Demo Dry-Run — UX Audit + Deferred Fixes Summary

**One-liner:** Full-app UX compliance audit (DLC, toasts, confirmations, empty states, pagination) with five deferred STATE.md CSS/component fixes applied (nav indicator, reset button, pressed state, destructive HSL, sonner/AlertDialog shadows).

---

## Audit Results

### Audit 1 — DLC Color Coding (REQ-dlc-color-coding): CLEAN

**Grep command:** `grep -rn "bg-emerald-100\|bg-amber-100\|bg-red-100\|bg-zinc-100" components/ app/`

**Findings:**
- `components/dlc-badge.tsx` — BUCKET_CLASSES definition (canonical source) — EXEMPT
- `components/dashboard/kpi-card.tsx` — bg-red-100 on KPI alert badge (non-DLC use) — EXEMPT
- `components/production/allocation-step.tsx` — bg-amber-100/bg-emerald-100 on shortfall badges (allocation status) — EXEMPT
- `components/clients/broches-expansion.tsx:134` — `<TableRow className="bg-zinc-100">` is a table header background, not a DLC badge — EXEMPT (DLC in that table is rendered via `<DlcBadge value={fp.dlc} />`)
- `components/layout/nav-item.tsx` — bg-zinc-100 on active/hover link states — EXEMPT (structural styling)
- `components/tracabilite/tracabilite-downstream.tsx` — bg-zinc-100/bg-emerald-50 on `broche.statut` display — EXEMPT (status badges, not DLC)

**Result:** No unexpected DLC color class violations found.

---

### Audit 2 — Toasts on Mutations (REQ-toasts-on-mutations): CLEAN

All 8 required toast.success calls confirmed present:

| Trigger | Component | Status |
|---------|-----------|--------|
| Receive raw material | `reception-dialog.tsx` | confirmed |
| Create production order | `production-wizard.tsx` | confirmed |
| Create delivery (préparée) | `new-delivery-dialog.tsx` | confirmed |
| Mark delivery livrée | `deliveries-table.tsx` | confirmed |
| Create client | `client-dialog.tsx` | confirmed |
| Edit client | `client-dialog.tsx` | confirmed |
| Delete client | `clients-table.tsx` | confirmed |
| Reset démo | `reset-button.tsx` | confirmed |

**Result:** All 8 required toast.success calls present. No additions needed.

---

### Audit 3 — Confirmations on Critical Actions (REQ-confirmations-on-critical-actions): CLEAN

| Action | Mechanism | Status |
|--------|-----------|--------|
| Confirmer la production | Step 3 récapitulatif in wizard with explicit "Confirmer la production" button | confirmed |
| Marquer comme livrée | Button sets pendingDeliveryId → AlertDialog opens before handleConfirmLivree fires | confirmed |
| Réinitialiser démo | `<AlertDialog>` wrapping the AlertDialogTrigger in reset-button.tsx | confirmed |
| Supprimer un client | `<AlertDialog>` with destructive confirm in clients-table.tsx | confirmed |

**Result:** All 4 critical actions properly gated. No destructive mutation fires on single unconfirmed click.

---

### Audit 4 — Empty States (REQ-empty-states): CLEAN (after fixes)

All 7 required EmptyState instances confirmed (2 copy fixes applied — see Deviations):

| Route / Component | Status |
|-------------------|--------|
| `/matieres-premieres` | confirmed |
| `/production` Ordres tab | confirmed |
| `/livraisons` | confirmed (copy fixed) |
| `/clients` | confirmed (copy fixed) |
| `/tracabilite` no-result | confirmed |
| Dashboard — Activité récente | confirmed |
| Dashboard — Alertes | confirmed |

---

### Audit 5 — No Pagination (REQ-no-pagination): CLEAN

`.slice()` calls found are all string operations (ISO date parsing), not display-limiting pagination. Zero pagination controls (`Pagination`, `currentPage`, `setPage`, `rowsPerPage`, `itemsPerPage`) found in any component.

**Result:** No pagination controls exist. All rows render directly.

---

### File-Size Cap Audit (PRD §10 — 300 lines max): CLEAN

All source files in `components/` and `app/` are within the 300-line limit. No extraction required.

---

## Deferred Fixes Applied

### D-01: Reset Button Font Size

**Before:** `<Button variant="ghost" size="sm" className="gap-2">`
**After:** `<Button variant="ghost" className="gap-2 text-sm active:bg-zinc-200">`

`size="sm"` dropped (was cascading `text-xs`); explicit `text-sm` ensures 14px label; `active:bg-zinc-200` added for D-03.

**Files modified:** `components/layout/reset-button.tsx`

---

### D-02: Sidebar Active Indicator (Full-Row Strip)

**Before:** `className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-primary"`
**After:** `className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary"`

`top-1.5`/`bottom-1.5`/`rounded-full` removed; `top-0`/`bottom-0` set — indicator now spans full row height (36px), not a 24px pip.

**Files modified:** `components/layout/nav-item.tsx`

---

### D-03: Pressed-State Classes

**nav-item.tsx inactive branch:**
**Before:** `"text-muted-foreground hover:bg-zinc-100 hover:text-foreground"`
**After:** `"text-muted-foreground hover:bg-zinc-100 hover:text-foreground active:bg-zinc-200"`

**reset-button.tsx:** combined with D-01 fix above — `active:bg-zinc-200` added to Button className.

**Files modified:** `components/layout/nav-item.tsx`, `components/layout/reset-button.tsx`

---

### D-04a: Destructive HSL Correction

**Before:** `--destructive: 0 84% 60%;           /* #DC2626 red-600 */`
**After:** `--destructive: 0 72% 51%;           /* #DC2626 red-600 */`

Corrected to actual HSL for red-600 (#DC2626): hue 0°, saturation 72%, lightness 51%.

**Files modified:** `app/globals.css`

---

### D-04b: Sonner Toast Shadow

**Before:** `"group-[.toaster]:shadow-lg"`
**After:** `"group-[.toaster]:shadow-md"`

Toast is a popover-layer element; UI-SPEC locks popover layer to shadow-md.

**Files modified:** `components/ui/sonner.tsx`

---

### D-04c: Brand Role in Typography Table

No source change required. UI-SPEC `01-UI-SPEC.md` already declares the brand row ("TraceKebab", `text-base font-semibold`) in the Layout section. Item resolved by annotation only.

---

### D-05: AlertDialog Dimension Drift

**AlertDialogContent:**
**Before:** `...shadow-lg...sm:rounded-lg`
**After:** `...shadow-md...rounded-md`

`sm:` responsive prefix dropped (UI-SPEC uses no responsive variants for modal radius); `shadow-lg` → `shadow-md`; `sm:rounded-lg` → `rounded-md`.

**AlertDialogTitle:**
**Before:** `cn("text-lg font-semibold", className)`
**After:** `cn("text-xl font-semibold", className)`

Heading role per UI-SPEC is text-xl. Every AlertDialog across the app (reset-button, clients-table, deliveries-table) inherits these fixes automatically.

**Files modified:** `components/ui/alert-dialog.tsx`

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] Fixed empty-state locked copy on livraisons page**
- **Found during:** Task 3
- **Issue:** `app/livraisons/page.tsx` had `heading="Aucune livraison"` and generic body instead of UI-SPEC locked copy "Aucune livraison enregistrée" / "Préparez votre première livraison depuis cette page."
- **Fix:** Updated heading and body to match UI-SPEC §1.4 verbatim
- **Files modified:** `app/livraisons/page.tsx`
- **Commit:** 1d38f02

**2. [Rule 2 - Missing Critical Functionality] Fixed empty-state locked copy on clients page**
- **Found during:** Task 3
- **Issue:** `app/clients/page.tsx` had `heading="Aucun client"` and generic body instead of UI-SPEC locked copy "Aucun client enregistré" / "Ajoutez votre premier client restaurant."
- **Fix:** Updated heading and body to match UI-SPEC §1.4 verbatim
- **Files modified:** `app/clients/page.tsx`
- **Commit:** 1d38f02

---

## TypeScript Verification

`npx tsc --noEmit` exits 0. No type errors introduced by any of the changes.

---

## Commits

| Task | Description | Hash |
|------|-------------|------|
| Task 1 | Audit only — all 5 audits clean, no files modified | (no commit — read-only) |
| Task 2 | Five deferred UI polish fixes (D-01 through D-05) | 724e2a7 |
| Task 3 | Empty-state locked copy fixes (livraisons, clients) | 1d38f02 |

---

## Self-Check: PASSED

- `components/layout/nav-item.tsx` — FOUND, contains `top-0 bottom-0 w-0.5 bg-primary` and `active:bg-zinc-200`
- `components/layout/reset-button.tsx` — FOUND, contains `text-sm active:bg-zinc-200`, no `size="sm"`
- `components/ui/alert-dialog.tsx` — FOUND, contains `text-xl font-semibold`, `rounded-md`, `shadow-md`
- `components/ui/sonner.tsx` — FOUND, contains `shadow-md`
- `app/globals.css` — FOUND, contains `0 72% 51%`
- `app/livraisons/page.tsx` — FOUND, contains `Aucune livraison enregistrée`
- `app/clients/page.tsx` — FOUND, contains `Aucun client enregistré`
- Commits 724e2a7 and 1d38f02 — verified in git log
- `npx tsc --noEmit` — exits 0

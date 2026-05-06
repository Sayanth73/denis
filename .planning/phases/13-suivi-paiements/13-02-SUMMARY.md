---
phase: "13"
plan: "02"
subsystem: "paiements-ui"
tags: ["factures", "paiement", "dashboard", "parametres", "print"]
dependency_graph:
  requires: ["lib/factures.ts (13-01)", "lib/dashboard.ts (13-01)", "lib/store.ts (13-01)"]
  provides: ["payment status columns in factures list", "payment section in facture detail", "Factures impayées KPI card", "delaiPaiementJours settings field"]
  affects: ["app/factures/page.tsx", "app/factures/[id]/page.tsx", "app/page.tsx", "app/parametres/page.tsx"]
tech_stack:
  added: []
  patterns: ["zodResolver with explicit FormValues type (z.coerce incompatibility workaround)", "print:hidden for non-printable UI sections", "3-tier sort function"]
key_files:
  created:
    - app/parametres/page.tsx
  modified:
    - app/factures/page.tsx
    - app/factures/[id]/page.tsx
    - app/page.tsx
decisions:
  - "Used z.number() + manual parseInt in onChange instead of z.coerce.number() — @hookform/resolvers v5 uses z4.input<T> for resolver type, and z.coerce.number() has input type unknown causing TypeScript errors"
  - "Captured narrowed 'facture' in local const 'f' before inner function declarations — TypeScript doesn't apply control flow narrowing inside closures for outer variables"
  - "3 occurrences of isFactureEnRetard in factures/page.tsx (import + sort + badge) — plan expected 2 but import counts; all usages correct"
metrics:
  duration: "~15 min"
  completed: "2026-05-05"
  tasks_completed: 3
  files_changed: 4
---

# Phase 13 Plan 02: Suivi Paiements — UI Layer Summary

**One-liner:** Wires payment lifecycle into all four UI surfaces: factures list with status/date columns and 3-tier sort, facture detail with payment action buttons, dashboard KPI 4 replaced with "Factures impayées", parametres with configurable payment delay field.

## Tasks Completed

| # | Task | Status |
|---|------|--------|
| T1 | Factures list: 3-tier sort + Statut paiement column + Date paiement column | ✓ |
| T2 | Facture detail: updateFacture subscription, payment handlers, Paiement section JSX | ✓ |
| T3 | Dashboard KPI 4 replacement + parametres delaiPaiementJours field | ✓ |

## Deviations from Plan

**1. [Rule 1 - Workaround] z.coerce.number() incompatible with @hookform/resolvers v5 + Zod v4**
- **Found during:** TypeScript check
- **Issue:** `zodResolver` v5 uses `z4.input<T>` for the first type param; `z.coerce.number()` has input type `unknown` in Zod v4, causing a type mismatch when `useForm<FormValues>` expects a number field.
- **Fix:** Changed schema to `z.number()` and added explicit `parseInt` conversion in Input's `onChange` handler. Manually declared `FormValues` type instead of using `z.infer<typeof settingsSchema>`.
- **Files modified:** app/parametres/page.tsx

**2. [Rule 1 - TypeScript] facture closure narrowing in handlers**
- **Found during:** TypeScript check (TS18048)
- **Issue:** TypeScript doesn't apply control flow narrowing for `facture` (Facture | undefined) inside nested function declarations, even after a null guard.
- **Fix:** Captured narrowed facture in `const f = facture` immediately after the null guard; all JSX and handlers use `f` instead.
- **Files modified:** app/factures/[id]/page.tsx

## Known Stubs

None.

## Threat Flags

None.

## Self-Check: PASSED

- Statut paiement column: FOUND in factures/page.tsx
- Date paiement column: FOUND in factures/page.tsx
- paiementRank sort: FOUND (grep -c: 2)
- handlePayerLivraison: FOUND (grep -c: 2)
- print:hidden on payment section: FOUND
- Factures impayées: FOUND in app/page.tsx
- delaiPaiementJours: FOUND in parametres (grep -c: 5)
- [id]/page.tsx line count: 290 (≤ 300)
- TypeScript: 0 errors
- npm run build: ✓

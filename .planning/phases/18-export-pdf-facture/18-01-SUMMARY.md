---
phase: 18-export-pdf-facture
plan: "01"
subsystem: factures-pdf
tags:
  - react-to-print
  - pdf-export
  - facture
dependency_graph:
  requires:
    - app/factures/[id]/page.tsx (existing page with useReactToPrint)
    - lib/types.ts (Facture, AppSettings)
    - lib/raw-materials.ts (formatDate)
  provides:
    - Payment deadline in printable invoice
    - "Exporter PDF" button label
  affects:
    - app/factures/[id]/page.tsx
tech_stack:
  added: []
  patterns:
    - Inline deadline computation (new Date + setDate) after null guard — no hook needed
    - formatDate() for consistent Swiss date format
key_files:
  modified:
    - app/factures/[id]/page.tsx
decisions:
  - "DEC-18-01-deadline-in-totals: Échéance row added in totals box under TTC — consistent with invoice summary grouping"
  - "DEC-18-02-button-label: Renamed to 'Exporter PDF' to match success criterion exactly"
  - "DEC-18-03-no-hook: Deadline computed as plain const after null guard, not useMemo — avoids hook-after-early-return issue"
metrics:
  duration: "~5m"
  completed: "2026-05-05"
  tasks_completed: 1
  files_changed: 1
---

# Phase 18 Plan 01: Export PDF Facture Summary

**One-liner:** Closed the Phase 18 gap — added payment deadline row to printable invoice totals and renamed button to "Exporter PDF"; react-to-print was already wired from Phase 12-01.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add Échéance to printable invoice, rename button | e3554b3 | app/factures/[id]/page.tsx |

## What Was Built

The facture detail page already had full react-to-print infrastructure from Phase 12-01. Phase 18 added:
- **Échéance row** in the totals box: computed from `dateFacture + settings.delaiPaiementJours`, formatted with `formatDate()`, rendered between Total TTC and the QR-bill section. Visible in print (no `print:hidden`).
- **Button label**: "Imprimer / PDF" → "Exporter PDF"

## Known Stubs

None.

## Self-Check: PASSED

- [x] app/factures/[id]/page.tsx modified (299 lines — under 300-line cap)
- [x] Button label is "Exporter PDF"
- [x] Échéance row present in totals box, formatDate() applied
- [x] npx tsc --noEmit exits with zero errors
- [x] Commit e3554b3 exists

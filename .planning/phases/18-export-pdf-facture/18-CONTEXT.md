---
phase: 18-export-pdf-facture
plan: "01"
status: ready
discuss_mode: smart
---

# Phase 18: Export PDF Facture — Context

## Goal
The operator can generate and download a formatted PDF of any invoice directly from the facture detail page.

## Situation Assessment
**Phase 18 is 85% already implemented** from Phase 12-01. The existing `/app/factures/[id]/page.tsx` already has:
- `useReactToPrint` wired to `printableRef`
- "Imprimer / PDF" button (screen-only, `print:hidden`)
- Printable region with: company header, client block, line-item table, totals (HT / TVA / TTC)
- QR-bill section

**Remaining gaps:**
1. Payment deadline (`echeancePaiement`) is not shown in the printable region — computed from `dateFacture + settings.delaiPaiementJours`
2. Button label is "Imprimer / PDF" — success criterion says "Exporter PDF"

## Acceptance Criteria (from ROADMAP)
1. The facture detail page shows an "Exporter PDF" button.
2. Print dialog includes: client name/address, invoice number/date, line-item table (recipe, quantity, unit price HT, line total HT), total HT, TVA rate, total TTC, and **payment deadline**.
3. Generated PDF contains no raw JSON, no debug output, no UI navigation elements.

## Decisions (auto-accepted)
- DEC-18-01-deadline-in-totals: Render payment deadline row directly under totalTTC in the totals box — mirrors the invoice summary card in the list page, consistent data grouping.
- DEC-18-02-button-label: Rename to "Exporter PDF" to match success criterion exactly. FileText icon retained.
- DEC-18-03-deadline-calc: Compute as `new Date(dateFacture) + delaiPaiementJours days`, format with formatDate(). No new store field needed.

## Files Affected
- `app/factures/[id]/page.tsx` (modify — add deadline row in totals, rename button)

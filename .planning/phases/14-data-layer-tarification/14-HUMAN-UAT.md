---
status: partial
phase: 14-data-layer-tarification
source: [14-VERIFICATION.md]
started: 2026-05-05T00:00:00.000Z
updated: 2026-05-05T00:00:00.000Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Default price (prixParDefautHT) is used when client has no tarif overrides
expected: Create a new delivery for any client (all have `tarifs: []`). Confirm the delivery. The generated facture line should show `prixUnitaireHT = 25` (the recipe default) for each broche — visible on the facture detail page.
result: [pending]

### 2. Client tarif override is respected when present
expected: Manually set a tarif override in the browser console (`useTraceabilityStore.getState().customers[0].tarifs = [{recetteId: "<id>", prixHT: 30}]`) or wait for Phase 15 UI. Create a delivery for that client with the matching recipe. The facture line should show `prixUnitaireHT = 30`, not 25.
result: [pending]

## Summary

total: 2
passed: 0
issues: 0
pending: 2
skipped: 0
blocked: 0

## Gaps

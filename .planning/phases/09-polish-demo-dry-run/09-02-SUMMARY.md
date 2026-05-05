---
phase: 09-polish-demo-dry-run
plan: "02"
subsystem: demo-validation
tags:
  - demo-dry-run
  - build-gate
  - readme
  - milestone-close
dependency_graph:
  requires:
    - "09-01: UX audit + deferred fixes"
  provides:
    - "§9 5-step demo flow verified clean (code-level trace)"
    - "tsc --noEmit exits 0"
    - "npm run build exits 0"
    - "README.md with French demo narrative"
  affects:
    - "README.md"
tech_stack:
  added: []
  patterns:
    - "Code-level trace as programmatic dry-run (no browser automation needed for executor)"
    - "useReactToPrint + print-target class for scoped PDF export"
    - "ProductionWizard handles quantiteRestante decrement inline (not in store action)"
key_files:
  created: []
  modified:
    - "README.md"
decisions:
  - "addProductionOrder store action intentionally does NOT decrement quantiteRestante — ProductionWizard does it inline via updateRawMaterial before calling addProductionOrder; this avoids duplicate decrement if the store action were also to apply it"
  - "Milestone policy: auto-approve checkpoint:human-verify when tsc + build pass + demo trace clean"
metrics:
  duration: "~8 minutes"
  completed_date: "2026-05-05"
  tasks_completed: 2
  files_modified: 1
---

# Phase 9 Plan 02: Demo Dry-Run + Final Build Gate Summary

**One-liner:** §9 5-step demo flow traced clean at code level (no blockers), tsc exits 0, npm run build exits 0, and README.md updated with French milestone narrative.

---

## Demo Dry-Run Results

### Pre-flight check

`resetToSeed()` confirmed in `lib/store.ts` (line 164). Calls `buildSeed()` and overwrites all six collections atomically.

Seed data confirmed complete:
- 5 raw materials (2× boeuf, 1× agneau, 1× poulet, 1× epices)
- 3 recipes (including "Broche standard 25 kg")
- 8 Suisse-romande customers
- 2 production orders
- 6 finished products (4 from order1, 2 from order2)
- 1 delivery (3 broches from order1, statut livree)

---

### Step 1 — Réception trace: CLEAN

`components/matieres/reception-dialog.tsx` verified:
- Form fields: type (select), nom, fournisseur, numeroLotFournisseur, quantiteRecue, dateReception, dlc, temperatureReception, certificatSanitaire (optional)
- DLC > dateReception cross-field validation via `.refine()` on the Zod schema
- On submit: `addRawMaterial(newRm)` called, `toast.success(...)` fires, dialog closes

**Result:** No blocker.

---

### Step 2 — Production wizard trace: CLEAN

`components/production/production-wizard.tsx` verified:
- Step 1: recipe select + nombreBroches input
- Step 2: AllocationStep renders eligible lots by type, sorted by DLC ascending, FIFO defaults pre-filled
- Step 3: récapitulatif shows consumed lots + broches count
- `handleConfirm()` (lines 83–127): iterates `matieresPremieresUtilisees`, calls `store.updateRawMaterial(rmId, { quantiteRestante: Math.max-equivalent })` for each lot **before** calling `store.addProductionOrder(order)`, then calls `store.addFinishedProduct(fp)` for each broche
- `toast.success(...)` fires with action link to traçabilité

**Key design note:** The quantiteRestante decrement is handled by the wizard (inline) rather than inside `addProductionOrder`. `addProductionOrder` in `lib/store.ts` only appends the order — this is intentional to avoid double-decrement.

**Result:** No blocker.

---

### Step 3 — Livraison + Marquer comme livrée trace: CLEAN

`components/livraisons/deliveries-table.tsx` verified:
- "Marquer comme livrée" button sets `pendingDeliveryId` state → AlertDialog opens
- `handleConfirmLivree()` iterates `pendingDelivery.brochesLivrees`, calls `store.updateFinishedProduct(fpId, { statut: "livree", livraisonId })` for each broche, then `store.updateDelivery(id, { statut: "livree" })`
- `toast.success("Livraison confirmée — N broche(s) livrée(s) à CLIENT")` fires

**Result:** No blocker.

---

### Step 4 — Traçabilité search trace: CLEAN

`app/tracabilite/page.tsx` and `lib/tracabilite.ts` verified:
- `detectLotType("BT-2026-DEMO")` returns `"supplier"` (does not match TK-YYYY-MMDD-NNN regex)
- `findSupplierLot("BT-2026-DEMO", rawMaterials)` does live `array.find()` against current Zustand state — no stale memoization
- Upstream view (`TracabiliteUpstream`) renders 3 sections:
  1. Matière première card (fournisseur, lot, type, DLC badge)
  2. Ordres de fabrication (via `getProductionOrdersForRm`)
  3. Clients impactés (via `getClientsImpactes` — chains RM → orders → broches → deliveries → customers)
- All lookups are O(N) array operations; live state; no caching issue

**Result:** No blocker.

---

### Step 5 — PDF export trace: CLEAN

`components/tracabilite/tracabilite-upstream.tsx` verified:
- `useReactToPrint({ contentRef: printableRef, documentTitle: "Tracabilite-..." })` instantiated
- "Exporter dossier (PDF)" button calls `handlePrint` on click
- `TracabilitePrintable` wrapper applies `className="print-target"` to the result div
- `app/globals.css` has `@media print { .print-target, .print-target * { ... } }` block

**Result:** No blocker.

---

## Build Gate

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | Exit 0 — no type errors |
| `npm run build` | Exit 0 — all 8 routes built successfully |

Build output confirmed: 8 routes (/, /_not-found, /clients, /clients/[id], /livraisons, /matieres-premieres, /production, /tracabilite).

---

## README.md Update

Added "Démo rapide — 5 étapes en moins de 5 minutes" section in French to `README.md` at project root. Section covers:
- Prerequisites (npm install + npm run dev)
- 5 steps with exact navigation paths and field values
- Réinitialiser démo instruction

Existing README content (project description, stack, structure, key constraints) preserved above the demo section.

---

## Deviations from Plan

None — all 5 steps traced clean. No blockers found during the code-level dry-run. No source files other than README.md were modified.

---

## Checkpoint: Auto-Approved (Milestone Policy)

Per the objective instruction: "Auto-approve human-verify per milestone policy (tsc + build pass + demo trace clean)."

All three conditions met:
- tsc --noEmit: exits 0
- npm run build: exits 0
- Demo trace: clean (no blockers across all 5 steps)

Checkpoint auto-approved. Milestone v0.1 closed.

---

## Commits

| Task | Description | Hash |
|------|-------------|------|
| Task 1 | Demo dry-run code trace — all 5 steps clean, no files modified | (read-only, no commit) |
| Task 2 | tsc + build gate verified; README.md updated with demo narrative | b4b1f5a |

---

## Self-Check: PASSED

- `README.md` — FOUND, contains "5 étapes"
- Commit b4b1f5a — verified in git log
- `npx tsc --noEmit` — exits 0
- `npm run build` — exits 0
- `lib/store.ts` — contains `resetToSeed`
- `lib/seed.ts` — contains boeuf + "Broche standard 25 kg"
- `components/production/production-wizard.tsx` — contains `quantiteRestante` decrement logic
- `components/livraisons/deliveries-table.tsx` — contains `updateFinishedProduct` + `statut: "livree"` in handleConfirmLivree
- `lib/tracabilite.ts` — contains `numeroLotFournisseur` + `numeroLotInterne` detection
- `components/tracabilite/tracabilite-upstream.tsx` — contains `handlePrint` (useReactToPrint)
- `components/tracabilite/tracabilite-printable.tsx` — contains `className="print-target"`

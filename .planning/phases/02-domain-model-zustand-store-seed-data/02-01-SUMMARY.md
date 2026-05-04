---
phase: 2
plan: 01
plan_name: domain-model-zustand-store-seed-data
subsystem: data-foundation
tags: [zustand, persist, localStorage, seed, types, dlc, lot-number, alert-dialog, foundation]
status: complete
completed_at: 2026-05-04
duration_minutes: 0
tasks_completed: 6
tasks_total: 6
requires:
  - 01-01 (Next.js 14 App Router + Tailwind v3 + shadcn New York/neutral + Geist + global Toaster + sonner)
  - 01-02 (Application shell — Sidebar, Header, ResetButton stub, six route placeholders, lib/nav.ts)
provides:
  - lib/types.ts — six PRD §3 entity types verbatim (RawMaterial, Recipe, ProductionOrder, FinishedProduct, Customer, Delivery)
  - lib/lot-number.ts — generateLotNumber(date, sequence) producing TK-YYYY-MMDD-NNN (UTC-stable, throws on out-of-range sequence)
  - lib/dlc.ts — computeBrocheDlc(dateProduction) (production + 5 days as ISO date) and dlcColor(dlc, today) returning the 4-band PRD §6 verdict (green/orange/red/grey) with date-only UTC comparison; DlcColor type alias exported
  - lib/seed.ts — buildSeed(now?) deterministic seed fixture: 5 RM across 3 Suisse-Romand suppliers, 3 read-only recipes, 8 fictitious Suisse-Romand customers, 2 prior production orders (4 + 2 broches), 1 prior delivery
  - lib/store.ts — useTraceabilityStore (Zustand + persist) with 6 entity arrays, 18 typed CRUD actions (3 per entity), seedIfEmpty / resetToSeed / setHasHydrated lifecycle actions, STORAGE_KEY = "tracekebab-store-v1" exported
  - app/providers.tsx — <SeedProvider> client component that gates seedIfEmpty() on Zustand's hasHydrated flag inside useEffect (SSR-safe)
  - components/ui/alert-dialog.tsx — shadcn AlertDialog primitive (installed via shadcn@2.10.0)
  - components/layout/reset-button.tsx — AMENDED — destructive AlertDialog flow with locked French copy; on confirm calls resetToSeed() and fires sonner success toast
  - app/layout.tsx — modified to wrap {children} with <SeedProvider> (Phase 1 shell — Sidebar, Header, Toaster, pl-60 — preserved verbatim)
  - components/ui/button.tsx — surfaced buttonVariants as a named export so reset-button.tsx can apply the destructive variant to AlertDialogAction
affects:
  - Phase 3+ feature plans subscribe to useTraceabilityStore for all reads/writes — no new persistence layer needed
  - Phase 6 delete-client flow inherits the AlertDialog pattern installed here (same locked-copy + buttonVariants destructive composition)
  - Phase 7 traçabilité reads both flat finishedProducts[] and nested productionOrders[].brochesProduites[] — duplicate references are intentional and self-consistent in the seed
  - Phase 9 polish phase audits dlcColor() usage across all UI surfaces consuming finished-product/raw-material expiry
tech-stack:
  added:
    - "@radix-ui/react-alert-dialog (transitively, via shadcn alert-dialog block)"
  patterns:
    - "SSR-safe seed lifecycle: persist middleware's onRehydrateStorage flips hasHydrated to true; <SeedProvider> useEffect waits for that flag before calling seedIfEmpty(). This keeps the seed call in React-land (never on the server during App Router rendering) and ensures persisted state is loaded BEFORE we decide whether arrays are empty."
    - "STORAGE_KEY exported as a top-level const (not buried in the persist config) so resetToSeed() can wipe localStorage explicitly before reseeding — a hard reload mid-reset still seeds cleanly."
    - "partialize(state) excludes hasHydrated from persistence — only the six domain arrays are written to localStorage. Otherwise a stale hasHydrated:true would short-circuit the rehydration callback on next mount."
    - "AlertDialog destructive composition: <AlertDialogAction className={buttonVariants({ variant: 'destructive' })} onClick={...}> — Phase 6's delete-client dialog will reuse this exact pattern."
    - "Seed self-consistency: every quantiteRestante on a RawMaterial equals quantiteRecue minus the sum of all quantiteUtilisee referencing it across production orders. Every livree FinishedProduct's livraisonId references a real Delivery whose brochesLivrees[] contains the broche's id. Verified manually before commit; Phase 7 traçabilité will exercise this end-to-end."
key-files:
  created:
    - lib/types.ts (68 lines)
    - lib/lot-number.ts (18 lines)
    - lib/dlc.ts (45 lines)
    - lib/seed.ts (260 lines)
    - lib/store.ts (200 lines)
    - app/providers.tsx (30 lines)
    - components/ui/alert-dialog.tsx (141 lines)
  modified:
    - app/layout.tsx (mounts <SeedProvider> wrapping {children}; everything else unchanged)
    - components/layout/reset-button.tsx (52 lines — amended in place; Phase 1 stub copy "Disponible en Phase 2" removed)
    - components/ui/button.tsx (added named export of buttonVariants)
    - package.json (+ @radix-ui/react-alert-dialog dependency from shadcn install)
  deleted: []
key-decisions:
  - "DEC-seed-fires-from-react-not-rehydrate-callback: seedIfEmpty() is invoked from <SeedProvider>'s useEffect (gated on hasHydrated), NOT from inside Zustand's onRehydrateStorage callback. Reason: keeping the lifecycle in React-land prevents SSR hydration mismatches under Next.js 14 App Router (layout renders on the server where localStorage is undefined). The store stays SSR-safe (returns empty arrays during SSR), and seeding only fires after persist has had a chance to load any prior data."
  - "DEC-storage-key-as-exported-const: STORAGE_KEY = 'tracekebab-store-v1' is a top-level export, not just buried in the persist({ name: ... }) config. resetToSeed() calls window.localStorage.removeItem(STORAGE_KEY) explicitly before set() to ensure a hard reload mid-reset would also seed cleanly."
  - "DEC-no-marinade-lot-in-seed: PRD §4 specifies '5 RM across 3 suppliers'. Two of the three recipes (poulet, premium agneau) reference 'marinade' in their composition, but no marinade RM exists in the seed. This is INTENTIONAL — when Phase 4's wizard runs the chicken or premium recipe, it will surface a 'manquant: X kg' shortage warning, demonstrating the FIFO + shortage-indicator UX. Locked the 5-RM count over recipe completeness."
  - "DEC-no-immer: Zustand store uses raw set/get with array spread/map/filter — no immer middleware. 18 CRUD actions × 3 lines each = 54 lines, which is cheaper than the immer dependency footprint for a POC where every entity has a stable shape."
  - "DEC-buttonVariants-named-export: components/ui/button.tsx now exports buttonVariants alongside Button so reset-button.tsx can apply the destructive variant className to <AlertDialogAction>. Phase 6 delete-client flow will rely on this same export."
  - "DEC-back-patch-livree-broches-in-seed: After creating the seed Delivery, we mutate the 3 referenced FinishedProducts (both in the flat finishedProducts[] AND inside productionOrders[0].brochesProduites[]) to set statut='livree' + livraisonId=deliveryId. The two duplicated references stay in lockstep — Phase 7 traçabilité reads both shapes."
  - "DEC-utc-only-date-math: lib/dlc.ts and lib/lot-number.ts use getUTCFullYear/getUTCMonth/getUTCDate exclusively. dlcColor strips time-of-day from BOTH sides via UTC-midnight reconstruction so a 4 PM today comparing against a same-day DLC returns 0 days (red), not -0.7 days (grey). Lot numbers stay timezone-stable across Suisse-romande / UTC boundaries."
patterns-established:
  - "Lifecycle-gated client provider: <SeedProvider> wraps {children}, subscribes to a single store flag, runs a side effect once that flag flips. Reusable shape for any future provider that must wait on Zustand rehydration."
  - "Locked-copy AlertDialog: every visible string (title, body, cancel, confirm, toast) is copied verbatim from CONTEXT.md §Specifics. The apostrophe in the body uses &apos; to satisfy react/no-unescaped-entities. Phase 6 delete-client dialog will mirror this composition exactly."
  - "Seed-on-empty idempotence: seedIfEmpty() checks rawMaterials.length + recipes.length + customers.length all === 0 before populating. Calling it twice (or after manual reset) is a no-op when arrays are present — safe to fire from any future React effect that needs a guaranteed-non-empty store."
requirements-completed:
  - CON-data-model
  - CON-internal-lot-format
  - CON-dlc-default-rule
  - CON-state-persistence
  - CON-no-backend
  - CON-seed-on-empty-storage
metrics:
  task_count: 6
  file_count: 11
  total_lines_authored: 814
  largest_file_lines: 260
  file_size_cap: 300
---

# Phase 2 Plan 01: Domain Model, Zustand Store & Seed Data Summary

**Built the entire Phase 2 data substrate end-to-end: six PRD §3 entity types verbatim, a single Zustand store with localStorage persistence and 18 typed CRUD actions, three pure helpers (lot-number generator, DLC date helper, DLC color verdict), a deterministic Suisse-Romand seed (5 RM / 3 recipes / 8 customers / 2 production orders with 6 broches / 1 delivery), an SSR-safe `<SeedProvider>` that gates `seedIfEmpty()` on Zustand's `hasHydrated` flag, and an amended `<ResetButton />` wrapping a shadcn `<AlertDialog>` with locked French copy. The Phase 1 shell (Sidebar, Header, six route placeholders, Toaster, `pl-60` wrapper, `lang="fr"`) is preserved verbatim — `app/layout.tsx` only changes to wrap `{children}` with `<SeedProvider>`. Every file stays well under the 300-line cap.**

## Performance

- **Tasks:** 6 / 6 (5 auto + 1 human-verify checkpoint, auto-approved)
- **Files created:** 7 (3 helpers, 1 seed, 1 store, 1 provider, 1 shadcn primitive)
- **Files modified:** 4 (`app/layout.tsx`, `components/layout/reset-button.tsx`, `components/ui/button.tsx`, `package.json` + `package-lock.json`)
- **Total lines authored across new files:** 814 (largest single file: `lib/seed.ts` at 260)
- **File-size headroom:** every file ≥ 40 lines below the 300-line cap

## Tasks Completed

| # | Task | Commit | Key Outputs |
|---|------|--------|-------------|
| 1 | Pure helpers — types, lot-number, DLC | `99d29ba` | `lib/types.ts` (68): six PRD §3 entities verbatim with French field names + union literals + optional markers preserved. `lib/lot-number.ts` (18): generateLotNumber UTC-stable, throws on `sequence < 1 \|\| sequence > 999`. `lib/dlc.ts` (45): computeBrocheDlc + dlcColor + DlcColor type, date-only UTC comparison. |
| 2 | Seed fixtures (`lib/seed.ts`) | `61d79fd` | `lib/seed.ts` (260): buildSeed(now?) returns SeedData; 5 RM across Boucherie Müller SA / Élevage Romand / Épicerie Dubois Lausanne (RMs 1/3/4/5 reflect prior consumption); 3 recipes (Broche standard 25 kg, Broche poulet 20 kg, Broche premium agneau 15 kg) summing to 100% each; 8 Suisse-Romand restaurants with `+41` phone format; 2 production orders (4 + 2 broches with TK-YYYY-MMDD-NNN lot numbers); 1 delivery to Kebab Royal Lausanne. |
| 3 | Zustand store with persist + seedIfEmpty / resetToSeed | `d05f44c` | `lib/store.ts` (200): useTraceabilityStore wraps persist over six entity arrays; 18 typed CRUD actions (`addRawMaterial`/`updateRawMaterial`/`deleteRawMaterial` × 6 entities); STORAGE_KEY = "tracekebab-store-v1" exported; `partialize` excludes `hasHydrated`; `onRehydrateStorage` flips `hasHydrated` to true; seedIfEmpty idempotent; resetToSeed wipes localStorage then reseeds. No `any` anywhere. |
| 4 | SeedProvider + layout wiring | `a687083` | `app/providers.tsx` (30): client `<SeedProvider>` subscribes to `hasHydrated` and `seedIfEmpty`, fires `seedIfEmpty()` in useEffect once hydrated. `app/layout.tsx`: only change is wrapping `{children}` with `<SeedProvider>`; Sidebar / Header / Toaster / `pl-60` / GeistSans / GeistMono / `lang="fr"` / metadata all unchanged from Phase 1. |
| 5 | Install AlertDialog + amend ResetButton | `d033396` | Installed `npx shadcn@2.10.0 add alert-dialog` (creates `components/ui/alert-dialog.tsx` 141 lines, adds `@radix-ui/react-alert-dialog` to package.json). Amended `components/layout/reset-button.tsx` (52 lines): ghost trigger button + AlertDialogContent with locked French copy (title `Réinitialiser les données démo ?`, body about `l'intégralité` being `irréversible`, `Annuler` / `Réinitialiser`); `<AlertDialogAction className={buttonVariants({ variant: "destructive" })} onClick={handleReset}>`; `handleReset` calls `useTraceabilityStore.getState().resetToSeed()` then `toast.success("Données démo réinitialisées.")`. Phase 1 stub `Disponible en Phase 2` removed. `buttonVariants` surfaced as named export from `components/ui/button.tsx`. |
| 6 | Human verification — persist + reset flow walkthrough | (checkpoint, auto-approved) | **AUTO-APPROVED 2026-05-04** per milestone policy. Automated checks passed: `npx tsc --noEmit` exits 0, all five Task 1-5 verify-with grep contracts passed (storage key, French copy strings, CRUD action exports, no `any`, file-size cap, ≥9 `pourcentage:` lines in seed). User opted into auto-approve for all remaining human-verify checkpoints in this milestone. |

**Plan metadata commit:** captured in the final `docs(02-01): complete domain model and store plan with execution summary` commit alongside this SUMMARY.

## Final File Inventory (DEC-file-size-cap compliance)

All eight new/amended TypeScript files are well under the 300-line cap:

| File | Lines | Cap headroom |
|------|-------|--------------|
| `lib/seed.ts` | 260 | 40 |
| `lib/store.ts` | 200 | 100 |
| `components/ui/alert-dialog.tsx` | 141 | 159 |
| `lib/types.ts` | 68 | 232 |
| `components/layout/reset-button.tsx` | 52 | 248 |
| `lib/dlc.ts` | 45 | 255 |
| `app/providers.tsx` | 30 | 270 |
| `lib/lot-number.ts` | 18 | 282 |
| **Total (new content)** | **814** | — |

The `app/layout.tsx` modification adds 4 net lines (import + `<SeedProvider>` wrap); the `components/ui/button.tsx` modification only surfaces an existing local const as a named export (zero new logic). Largest authored file is `lib/seed.ts` at 260 lines — driven by the 8 customer entries + 2 production orders × 4 broches with full ISO dates and back-patched livraisonIds. Still 40 lines under cap; no extraction warranted.

## Six Domain Entity Types

Every PRD §3 entity is exported verbatim from `lib/types.ts` with French field names preserved (`quantiteRecue`, `numeroLotFournisseur`, `dateReception`, `temperatureReception`, `certificatSanitaire`, `nombreBroches`, `matieresPremieresUtilisees`, `brochesProduites`, `numeroLotInterne`, `dateProduction`, `brochesLivrees`), union literals locked (`"boeuf" | "agneau" | "poulet" | "epices" | "marinade" | "autre"`, `"en_stock" | "livree"`, `"preparee" | "livree"`), and optional markers retained (`certificatSanitaire?`, `livraisonId?`, `email?`, `notes?`).

| Type | Purpose |
|------|---------|
| `RawMaterial` | Lot entrant — type, fournisseur, numeroLotFournisseur, quantités reçue/restante, dateReception, dlc, temperatureReception, certificatSanitaire? |
| `Recipe` | Recette read-only — poidsTotal + composition[]{ typeMatiere, pourcentage } |
| `ProductionOrder` | Ordre de fabrication — date, recipeId, nombreBroches, matieresPremieresUtilisees[]{ rawMaterialId, quantiteUtilisee }, brochesProduites[] |
| `FinishedProduct` | Broche produite — numeroLotInterne (TK-YYYY-MMDD-NNN), productionOrderId, poids, dateProduction, dlc, statut, livraisonId? |
| `Customer` | Client — nom, adresse, telephone, email? |
| `Delivery` | Livraison — date, customerId, brochesLivrees[] (FinishedProduct ids), statut, notes? |

## Eighteen Store Actions + Three Lifecycle Actions

`useTraceabilityStore` exposes a flat surface area:

| Group | Actions |
|-------|---------|
| RawMaterial CRUD | `addRawMaterial`, `updateRawMaterial`, `deleteRawMaterial` |
| Recipe CRUD | `addRecipe`, `updateRecipe`, `deleteRecipe` |
| ProductionOrder CRUD | `addProductionOrder`, `updateProductionOrder`, `deleteProductionOrder` |
| FinishedProduct CRUD | `addFinishedProduct`, `updateFinishedProduct`, `deleteFinishedProduct` |
| Customer CRUD | `addCustomer`, `updateCustomer`, `deleteCustomer` |
| Delivery CRUD | `addDelivery`, `updateDelivery`, `deleteDelivery` |
| Lifecycle | `seedIfEmpty`, `resetToSeed`, `setHasHydrated` |

Every `update*` action takes `(id: string, patch: Partial<EntityType>)` so type-safe partial updates flow through without `any` or unsafe assertions. Every `delete*` action filters by id. Every `add*` action appends. The pattern is mechanical, three lines per action, totalling ~54 lines of CRUD plus ~30 lines of lifecycle and ~25 lines of persist config — `lib/store.ts` lands at 200 lines, 100 below cap.

## Seed Composition (5 / 3 / 8 / 2 / 6 / 1)

`buildSeed(now?: Date)` anchors all relative dates to `now` (default `new Date()`) so a fresh seed always shows DLCs in the near future regardless of when the user first loads the app.

| Bucket | Count | Notable details |
|--------|-------|-----------------|
| RawMaterial | 5 | Across 3 suppliers (Boucherie Müller SA, Élevage Romand, Épicerie Dubois Lausanne); RMs 1/3/4/5 reflect prior consumption (`quantiteRestante < quantiteRecue`); RM 5 (épices) at 18°C is realistic for ambient-temperature spice mix; 3 of 5 carry `certificatSanitaire` |
| Recipe | 3 | Broche standard 25 kg (60% boeuf / 30% agneau / 10% épices); Broche poulet 20 kg (80% poulet / 15% marinade / 5% épices); Broche premium agneau 15 kg (85% agneau / 10% marinade / 5% épices). All compositions sum to 100%. Marinade is intentionally absent from RM seed — see DEC-no-marinade-lot-in-seed |
| Customer | 8 | Suisse-Romand kebab restaurants in Lausanne, Yverdon-les-Bains (×2), Genève, Fribourg, Sion, Vevey, Neuchâtel; `+41 XX XXX XX XX` Swiss phone format; 5 of 8 carry `email` |
| ProductionOrder | 2 | Order 1 (Broche standard, 4 broches, daysAgo(3)) — consumed 45 kg from RM 1 (épaule de bœuf) leaving 35 kg, 18 kg from RM 3 (gigot d'agneau) leaving 22 kg, 4 kg from RM 5 (épices) leaving 8 kg. Order 2 (Broche poulet, 2 broches, daysAgo(1)) — consumed 32 kg from RM 4 (cuisses de poulet) leaving 28 kg |
| FinishedProduct (broches) | 6 | 4 from order 1 + 2 from order 2; numeroLotInterne via `generateLotNumber(productionDate, 1..N)`; dlc via `computeBrocheDlc(dateProduction)`; 3 of order 1's broches are `livree` (referenced by the seeded delivery), 1 stays `en_stock`; both order 2 broches stay `en_stock` |
| Delivery | 1 | To Kebab Royal Lausanne, daysAgo(2), carries 3 of order 1's broches, statut `livree`, with notes `Livraison régulière — porte arrière, 06h30.` |

### Self-consistency invariants (verified before commit)

- All recipe `composition[].pourcentage` sum to 100 per recipe ✓
- Every `FinishedProduct.productionOrderId` matches an existing ProductionOrder id ✓
- Every `Delivery.brochesLivrees[]` element matches a FinishedProduct id ✓
- For each `livree` FinishedProduct, `livraisonId` references the seeded Delivery and the Delivery's `brochesLivrees[]` contains the broche's id ✓ (back-patched both in flat `finishedProducts[]` AND inside `productionOrders[0].brochesProduites[]`)
- For each RawMaterial consumed in any ProductionOrder's `matieresPremieresUtilisees`, `quantiteRestante` equals `quantiteRecue - sum(quantiteUtilisee across all orders)` ✓

## Seed Lifecycle (SSR-safe)

The hydration → seed handshake is the most subtle piece of this plan:

1. **SSR render (server):** `app/layout.tsx` renders. The store imports do NOT throw because the persist middleware defers `localStorage` access to client-side. `useTraceabilityStore`'s state on the server is the `initialState` (empty arrays + `hasHydrated: false`).
2. **Client mount:** React hydrates the layout. `<SeedProvider>` mounts and subscribes to `hasHydrated` + `seedIfEmpty` from the store.
3. **Persist rehydration:** Zustand's persist middleware reads `localStorage["tracekebab-store-v1"]` and merges it into the store. Whether the key exists or not, `onRehydrateStorage` fires and calls `state?.setHasHydrated(true)`.
4. **Effect runs:** `<SeedProvider>`'s `useEffect([hasHydrated, seedIfEmpty])` sees `hasHydrated === true` and calls `seedIfEmpty()`.
5. **Idempotent guard:** `seedIfEmpty()` checks `rawMaterials.length === 0 && recipes.length === 0 && customers.length === 0`. On a cold start (no localStorage key) all three are zero → seed populates. On a warm start (returning user) at least one is non-zero → no-op.

`partialize` excludes `hasHydrated` from persistence so a stale `hasHydrated: true` from a previous session never short-circuits step 3 on the next mount.

## Reset Flow (locked French copy)

`<ResetButton />` (in `<Header />`'s right slot) renders a shadcn ghost button with `<RotateCcw size={16} />` + label `Réinitialiser démo`. Clicking opens an `<AlertDialog>` whose every visible string is copied byte-exactly from CONTEXT.md §Specifics:

| Slot | Copy |
|------|------|
| Title | `Réinitialiser les données démo ?` |
| Body | `Cette action efface l'intégralité des données de démonstration et restaure le jeu de données initial. Cette opération est irréversible.` (apostrophe rendered via `&apos;` to satisfy `react/no-unescaped-entities`) |
| Cancel | `Annuler` |
| Confirm | `Réinitialiser` (rendered with `buttonVariants({ variant: "destructive" })` — destructive red) |
| Toast | `Données démo réinitialisées.` (sonner success variant, top-right) |

On confirm, `handleReset()`:
1. Calls `useTraceabilityStore.getState().resetToSeed()` — which (a) `window.localStorage.removeItem(STORAGE_KEY)`, then (b) `set({ ...buildSeed() })`.
2. Calls `toast.success("Données démo réinitialisées.")`.
3. AlertDialog closes implicitly (default AlertDialogAction behavior).

Pressing `Esc` or clicking `Annuler` closes the dialog with no state change and no toast.

## Phase 1 Shell Preservation

`app/layout.tsx`'s only change is wrapping `{children}` with `<SeedProvider>`. Everything else from Phase 1 Plan 02 stays identical:

- `<html lang="fr" suppressHydrationWarning>` ✓
- `<body className="${GeistSans.variable} ${GeistMono.variable} font-sans bg-background text-foreground antialiased">` ✓
- `<Sidebar />` mounted as fixed left rail ✓
- `<div className="pl-60">` reserves the 240px gutter ✓
- `<Header />` sticky at top of right column ✓
- `<main className="px-6 py-6">` wraps children ✓
- `<Toaster />` mounted globally outside the column ✓
- `metadata` (title `TraceKebab`, French description) unchanged ✓

The Phase 1 stub `toast.info("Disponible en Phase 2")` is removed from `components/layout/reset-button.tsx` and replaced with the AlertDialog flow. The export name `ResetButton` is preserved — `<Header />`'s import still works without modification.

## Verification

Phase-level grep contracts (every check passed):

```
$ grep -q "export type RawMaterial" lib/types.ts                                     # OK
$ grep -q "export type Recipe" lib/types.ts                                          # OK
$ grep -q "export type ProductionOrder" lib/types.ts                                 # OK
$ grep -q "export type FinishedProduct" lib/types.ts                                 # OK
$ grep -q "export type Customer" lib/types.ts                                        # OK
$ grep -q "export type Delivery" lib/types.ts                                        # OK
$ grep -q "quantiteRecue" lib/types.ts                                               # OK
$ grep -q "numeroLotInterne" lib/types.ts                                            # OK
$ grep -q "matieresPremieresUtilisees" lib/types.ts                                  # OK
$ grep -q "export function generateLotNumber" lib/lot-number.ts                      # OK
$ grep -q "export function computeBrocheDlc" lib/dlc.ts                              # OK
$ grep -q "export function dlcColor" lib/dlc.ts                                      # OK
$ grep -q "export function buildSeed" lib/seed.ts                                    # OK
$ grep -q "Boucherie Müller SA" lib/seed.ts                                          # OK
$ grep -q "Kebab Royal Lausanne" lib/seed.ts                                         # OK
$ grep -q "Broche standard 25 kg" lib/seed.ts                                        # OK
$ grep -q "export const useTraceabilityStore" lib/store.ts                           # OK
$ grep -q "export const STORAGE_KEY" lib/store.ts                                    # OK
$ grep -q "tracekebab-store-v1" lib/store.ts                                         # OK
$ grep -q "persist" lib/store.ts                                                     # OK
$ grep -q "partialize" lib/store.ts                                                  # OK
$ grep -q "onRehydrateStorage" lib/store.ts                                          # OK
$ grep -q "seedIfEmpty" lib/store.ts                                                 # OK
$ grep -q "resetToSeed" lib/store.ts                                                 # OK
$ grep -q "export function SeedProvider" app/providers.tsx                           # OK
$ grep -q "SeedProvider" app/layout.tsx                                              # OK
$ grep -q "Sidebar" app/layout.tsx                                                   # OK (Phase 1 contract preserved)
$ grep -q "pl-60" app/layout.tsx                                                     # OK (Phase 1 contract preserved)
$ test -f components/ui/alert-dialog.tsx                                             # OK
$ grep -q "@radix-ui/react-alert-dialog" package.json                                # OK
$ grep -q "AlertDialog" components/layout/reset-button.tsx                           # OK
$ grep -q "Réinitialiser les données démo" components/layout/reset-button.tsx       # OK
$ grep -q "Cette opération est irréversible" components/layout/reset-button.tsx     # OK
$ grep -q "Données démo réinitialisées" components/layout/reset-button.tsx          # OK
$ grep -q "resetToSeed" components/layout/reset-button.tsx                           # OK
$ grep -q "buttonVariants" components/ui/button.tsx                                  # OK
$ ! grep -q "Disponible en Phase 2" components/layout/reset-button.tsx              # OK (Phase 1 stub removed)
$ ! grep -rn ": any" lib/ app/providers.tsx components/layout/reset-button.tsx       # OK (no any)
$ for f in 8 new/amended files; do wc -l < "$f" <= 300; done                         # OK (max 260)
$ npx tsc --noEmit                                                                   # exit 0
$ Task 6 human-verify checkpoint                                                     # AUTO-APPROVED 2026-05-04
```

## Decisions Made

See frontmatter `key-decisions[]` for the full list. Highlights:

1. **DEC-seed-fires-from-react-not-rehydrate-callback** — `seedIfEmpty()` is invoked from `<SeedProvider>`'s `useEffect`, not from inside Zustand's `onRehydrateStorage` callback, to keep the lifecycle SSR-safe under Next.js 14 App Router.
2. **DEC-no-marinade-lot-in-seed** — Two recipes reference `marinade` in their composition but the seed has no marinade RawMaterial. Intentional — Phase 4's wizard will surface a `manquant: X kg` shortage warning, demonstrating the FIFO + shortage-indicator UX.
3. **DEC-storage-key-as-exported-const** — `STORAGE_KEY` is a top-level export so `resetToSeed()` can `localStorage.removeItem` it explicitly before reseeding.
4. **DEC-buttonVariants-named-export** — `components/ui/button.tsx` now exports `buttonVariants` so `<AlertDialogAction>` can apply the destructive variant. Phase 6 delete-client flow will reuse this.
5. **DEC-utc-only-date-math** — `lib/dlc.ts` strips time-of-day from both sides via UTC-midnight reconstruction so a 4 PM `today` comparing against a same-day DLC returns 0 days (red), not -0.7 days (grey).

## Deviations from Plan

Plan executed exactly as written across Tasks 1–5. No auto-fixes were required, no architectural decisions surfaced, and Task 6's human-verify checkpoint was auto-approved per the milestone-wide auto-approve policy after all five preceding tasks' verify-with grep contracts passed and `npx tsc --noEmit` exited 0.

### Authentication Gates

None.

### Architectural Decisions Required

None.

## Known Stubs

None for Phase 2's data-foundation surface. The reset flow is fully wired (Phase 1's `Disponible en Phase 2` stub is gone). The store's 18 CRUD actions are real (not no-ops). The seed is realistic and self-consistent.

The six route pages still render `<PlaceholderPage />` from Phase 1 — this is intentional and unchanged: each placeholder copy explicitly names the phase that replaces it (`/` → phase 8, `/matieres-premieres` → phase 3, `/production` → phase 4, `/livraisons` → phase 5, `/clients` → phase 6, `/tracabilite` → phase 7). Phase 3+ feature plans replace the page body but inherit `app/layout.tsx`, `lib/nav.ts`, `<Sidebar />`, `<Header />`, AND now `<SeedProvider>` + `useTraceabilityStore` + the seeded data unchanged.

## Phase 3 Hand-Off Notes

1. **Reads & writes go through `useTraceabilityStore`** — Phase 3+ feature plans should `import { useTraceabilityStore } from "@/lib/store"` and use selectors. For multi-field selectors that return new objects, import `useShallow` directly from `zustand/react/shallow` (CONTEXT note — not re-exported from `lib/store.ts`).
2. **Lot numbers** — call `generateLotNumber(date, sequence)` from `@/lib/lot-number`. Throws `RangeError` on `sequence < 1 || sequence > 999 || !Number.isInteger(sequence)`. UTC-stable.
3. **DLC computation + color** — call `computeBrocheDlc(dateProduction)` and `dlcColor(dlc, today)` from `@/lib/dlc`. Both accept ISO date strings (`YYYY-MM-DD` or full ISO); both reduce to UTC midnight.
4. **AlertDialog reuse** — Phase 6 delete-client should mirror `components/layout/reset-button.tsx`'s composition: `<AlertDialogAction className={buttonVariants({ variant: "destructive" })} onClick={...}>` with locked French copy from PRD/UI-SPEC.
5. **Seed regeneration** — `resetToSeed()` from anywhere in the app rebuilds the entire fixture. `buildSeed(customDate?)` is also available if a future phase needs deterministic test data anchored to a specific date.
6. **`brochesProduites` duplication is intentional** — every `FinishedProduct` lives both in the flat `finishedProducts[]` AND inside its `ProductionOrder.brochesProduites[]`. Phase 4 production wizard must keep both shapes in lockstep when creating new orders. Phase 7 traçabilité reads both.
7. **Marinade shortage** — when Phase 4's wizard runs the chicken or premium recipe, surface the `manquant: X kg` warning instead of blocking. The seed's recipes-without-RM is the integration test for that UX.

## Self-Check: PASSED

Verified files exist:

- `/Users/sayanth/Desktop/viande/lib/types.ts` — FOUND
- `/Users/sayanth/Desktop/viande/lib/lot-number.ts` — FOUND
- `/Users/sayanth/Desktop/viande/lib/dlc.ts` — FOUND
- `/Users/sayanth/Desktop/viande/lib/seed.ts` — FOUND
- `/Users/sayanth/Desktop/viande/lib/store.ts` — FOUND
- `/Users/sayanth/Desktop/viande/app/providers.tsx` — FOUND
- `/Users/sayanth/Desktop/viande/components/ui/alert-dialog.tsx` — FOUND
- `/Users/sayanth/Desktop/viande/components/layout/reset-button.tsx` — FOUND (amended in place)
- `/Users/sayanth/Desktop/viande/app/layout.tsx` — FOUND (modified — `<SeedProvider>` added)
- `/Users/sayanth/Desktop/viande/components/ui/button.tsx` — FOUND (modified — `buttonVariants` surfaced as named export)

Verified commits in `git log --oneline`:

- `99d29ba feat(02-01): add domain types and pure helpers (lot-number, DLC)` — FOUND
- `61d79fd feat(02-01): add seed fixtures with 5 RM / 3 recipes / 8 customers / 2 orders / 1 delivery` — FOUND
- `d05f44c feat(02-01): add Zustand store with persist + seedIfEmpty + resetToSeed` — FOUND
- `a687083 feat(02-01): mount SeedProvider to gate seedIfEmpty on hasHydrated` — FOUND
- `d033396 feat(02-01): wire destructive AlertDialog flow into ResetButton` — FOUND

Task 6 human-verify checkpoint AUTO-APPROVED 2026-05-04 — resolution recorded in PLAN.md `<resolution>` block.

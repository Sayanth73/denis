---
phase: 4
slug: production-screen
status: draft
shadcn_initialized: true
preset: inherits 01-UI-SPEC.md + 03-UI-SPEC.md (New York, neutral, CSS variables)
created: 2026-05-05
inherits: 01-UI-SPEC.md, 03-UI-SPEC.md
---

# Phase 4 — UI Design Contract: Production Screen

> Phase 4 inherits **every token, color, type role, spacing token, and copy convention from `01-UI-SPEC.md` and `03-UI-SPEC.md`**. This file declares only the net-new contract for `/production`: the tabbed page layout, the read-only Recettes tab, the Ordres de fabrication table, and the 3-step production wizard dialog with its FIFO lot-allocation step.

> The patterns established here (tabbed page, wizard dialog, FIFO allocation editor) are consumed by no later phase directly; the traçabilité view (Phase 7) links back into production order IDs but does not replicate this UI.

---

## Phase 4 — Components Installed

shadcn component added in this phase: `tabs`. No other new shadcn primitives (Dialog, Button, Input, Select, Form, Badge, Table already ship from Phase 3).

---

## Page Layout — `/production`

Replaces the Phase 1 placeholder. Single-column layout inside the inherited shell main content area (`px-6 py-6`).

```
┌─────────────────────────────────────────────────────────────────────┐
│ (header: "Production" — owned by global Phase 1 header)             │
├─────────────────────────────────────────────────────────────────────┤
│  Page-header row (flex justify-between, mb-6, h-9)                  │
│                               ┌──────────────────────────────────┐  │
│  (no subtitle)                │ + Nouvel ordre de fabrication    │  │
│                               └──────────────────────────────────┘  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Recettes  │  Ordres de fabrication  ← shadcn Tabs           │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │ (tab panel — either Recettes content or ODF table)          │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

- Page-header row: `flex items-center justify-between mb-6`. The global `<Header />` from Phase 1 owns the `<h1>`; no subtitle.
- The CTA `+ Nouvel ordre de fabrication` is **always visible** regardless of active tab. Clicking it always opens the wizard (step 1).
- `<Tabs defaultValue="recettes">` immediately below the page-header row, no additional spacing.

### Page-header CTA — "+ Nouvel ordre de fabrication"

Variant `default` (primary, accent blue), size `default` (`h-9 px-4 text-sm font-medium`), lucide `Plus` (`size=16 mr-2`), label `+ Nouvel ordre de fabrication`. The `+` glyph matches Phase 1 / Phase 3 CTA convention.

---

## Tabs

**Component:** shadcn `<Tabs>`, `<TabsList>`, `<TabsTrigger>`, `<TabsContent>`.

```
┌──────────────────────────────────────────────────────────────────┐
│  [ Recettes ]  [ Ordres de fabrication ]                         │  ← TabsList
├──────────────────────────────────────────────────────────────────┤
│  (panel)                                                         │  ← TabsContent
└──────────────────────────────────────────────────────────────────┘
```

- `<TabsList>` classes: shadcn defaults (`bg-muted` pill container).
- `<TabsTrigger value="recettes">Recettes</TabsTrigger>` — first trigger, default-active.
- `<TabsTrigger value="ordres">Ordres de fabrication</TabsTrigger>` — second trigger.
- `<TabsContent>` panels: no added wrapper padding (panel inherits the page `px-6 py-6`); the table container adds its own `rounded-md border bg-background` exactly as in Phase 3.

---

## Recettes Tab (read-only)

**Trigger label:** `Recettes`
**Panel:** list of 3 seeded recipe cards. No create / edit / delete affordances (PRD §5.4, DEC-recipe-readonly).

### Recipe Card Layout

```
┌────────────────────────────────────────────────────────────────┐
│  Broche standard 25 kg                       25 kg             │  ← name + weight
│  ─────────────────────────────────────────────────────         │
│  Bœuf              60 %                                        │  ← ingredient rows
│  Agneau            30 %                                        │
│  Épices            10 %                                        │
└────────────────────────────────────────────────────────────────┘
```

- Container: `<div className="space-y-4">` — three cards stacked with `gap-4`.
- Each card: `rounded-md border bg-background p-4` (same surface as Phase 1 Card, no `shadow-sm` — dense display, not airy).
- Card header: `flex items-center justify-between` — recipe name (`text-sm font-semibold text-foreground`) on left, `{poidsTotal} kg` (`text-sm text-muted-foreground tabular-nums`) on right.
- Separator: `<Separator />` (shadcn, or plain `<div className="border-t border-border my-3">`). Use `<div>` to avoid adding another shadcn dep.
- Ingredient rows: `space-y-1.5` below the separator. Each row: `flex items-center justify-between`.
  - Left: `TYPE_LABELS[typeMatiere]` — `text-sm text-foreground`.
  - Right: `{pourcentage} %` — `text-sm text-muted-foreground tabular-nums`.
- Composition rows sum to 100 % (enforced by seed data; no runtime check needed in the UI).
- No empty state: recipes are always seeded.

---

## Ordres de Fabrication Tab

**Trigger label:** `Ordres de fabrication`
**Panel:** table or empty state.

### Table Container

Same container as Phase 3: `<div className="rounded-md border bg-background overflow-hidden">` wrapping `<Table>`.

### Columns (exact order)

| # | Header (FR) | Field | Width | Align | Cell content |
|---|-------------|-------|-------|-------|--------------|
| 1 | Date | `date` | 14 % | left | `JJ.MM.AAAA` via `formatDate(date)`, `text-sm` |
| 2 | Recette | `recipeId` → recipe name | 26 % | left | `text-sm truncate` |
| 3 | Nb broches | `nombreBroches` | 12 % | right | `text-sm tabular-nums` |
| 4 | Poids total | computed from `nombreBroches × recipe.poidsTotal` | 16 % | right | `text-sm tabular-nums`, `{value} kg` |
| 5 | Lots consommés | `matieresPremieresUtilisees` | 32 % | left | comma-separated `numeroLotFournisseur` strings, `text-sm font-mono truncate` |

- `colgroup` widths: 14/26/12/16/32 sum to 100 %.
- Header row: `bg-zinc-50`, `text-sm font-medium text-muted-foreground py-3 px-3 border-b border-border`. Columns are **not sortable** in Phase 4 (PRD does not require it; simplicity). No chevron indicators — plain `<TableHead>` text.
- Data rows: `border-b border-border hover:bg-zinc-50 min-h-9`. Cells: `py-2 px-3 text-sm`. `whitespace-nowrap` on columns 1, 3, 4. `truncate` on columns 2, 5.
- The "Lots consommés" cell renders the `numeroLotFournisseur` for each consumed lot (look up from store's `rawMaterials` by `rawMaterialId`). If lookup fails (edge case), render the `rawMaterialId` in `font-mono` as fallback.
- **No row click, no detail link** in Phase 4. Phase 7 will add traçabilité links.

### Empty State — Ordres de fabrication

| Slot | Value |
|------|-------|
| `icon` | lucide `Factory` |
| `heading` | `Aucun ordre de fabrication` |
| `body` | `Créez votre premier ordre pour commencer la production.` |
| `cta.label` | `+ Nouvel ordre de fabrication` |
| `cta.icon` | lucide `Plus` |
| `cta.onClick` | Opens wizard dialog |

---

## Production Wizard Dialog

**Trigger:** page-header CTA "+ Nouvel ordre de fabrication".
**Structure:** single `<Dialog>` containing a `<div>` with step state (`1 | 2 | 3`). Three distinct view blocks rendered conditionally based on `step`. Navigation in `<DialogFooter>`: Back (steps 2–3) and Next / Confirm (all steps).

### Dialog Dimensions

| Property | Value | Tailwind |
|----------|-------|----------|
| Width | 640 px | `sm:max-w-[640px]` |
| Max height | 90 vh | `max-h-[90vh]` |
| Body scroll | overflow-y auto | `overflow-y-auto` on inner content |
| Backdrop | shadcn default `bg-black/50` | inherited |

**Why 640 px?** Step 2 has per-ingredient allocation rows with a lot-number column (`font-mono`, truncatable), a DLC badge, and a number input. At 560 px (Phase 3 dialog width) the Step 2 allocation table would be cramped. 640 px (`40 rem`) gives each row comfortable breathing room. Steps 1 and 3 are single-column forms that scale gracefully to 640 px.

### DialogHeader (all steps)

```
┌──────────────────────────────────────────────────────────────┐
│ Nouvel ordre de fabrication                              ✕   │ ← DialogTitle
│ Étape N sur 3 — {step title}                                 │ ← DialogDescription
└──────────────────────────────────────────────────────────────┘
```

- Title: `Nouvel ordre de fabrication` (constant across all steps).
- Description: `Étape 1 sur 3 — Choisir la recette` / `Étape 2 sur 3 — Allouer les matières premières` / `Étape 3 sur 3 — Récapitulatif`.

### Step 1 — Choisir la recette

```
┌─────────────────────────────────────────────────────────────┐
│  Recette *                                                  │
│  [ Sélectionnez une recette         ▾ ]                     │
│                                                             │
│  Nombre de broches *                                        │
│  [ 1                                  ]                     │
│                                                             │
│                         [ Annuler ]  [ Suivant →  ]         │
└─────────────────────────────────────────────────────────────┘
```

- `space-y-4` form body.
- Recette: `<Select>` — options are the 3 seeded recipes (`{recipe.nom}`). Value = `recipeId`. Required.
- Nombre de broches: `<Input type="number" min="1" step="1">`. Required, must be integer ≥ 1.
- Footer: `Annuler` (outline) + `Suivant →` (primary). `Suivant →` advances to step 2 after zod validation of step-1 fields.

### Step 2 — Allouer les matières premières

This is the most complex step. For each ingredient in the chosen recipe:

```
┌──────────────────────────────────────────────────────────────────────┐
│  Bœuf — requis : 15,00 kg                                            │  ← ingredient header
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  N° lot fournisseur  │  DLC      │  Disponible │  Allouer (kg) │  │  ← lot header
│  │  BM-2026-0471        │  12.05.26 │  18,00 kg   │  [ 15.00 ]    │  │
│  │  BM-2026-0390        │  20.05.26 │  5,00 kg    │  [  0.00 ]    │  │
│  └────────────────────────────────────────────────────────────────┘  │
│  Total alloué : 15,00 kg ✓   (or "manquant : 3,00 kg" badge)        │  ← running total
└──────────────────────────────────────────────────────────────────────┘
```

**Ingredient section header:** `flex items-center justify-between mb-2`.
- Left: `{TYPE_LABELS[typeMatiere]} — requis : {required.toFixed(2)} kg` — `text-sm font-medium text-foreground`.
- No right slot.

**Lot mini-table columns:**

| # | Header | Field | Width | Align | Cell |
|---|--------|-------|-------|-------|------|
| 1 | N° lot fournisseur | `numeroLotFournisseur` | 36 % | left | `text-xs font-mono truncate` |
| 2 | DLC | `dlc` | 20 % | left | `<DlcBadge value={lot.dlc} />` (xs) |
| 3 | Disponible | `quantiteRestante` | 20 % | right | `text-xs tabular-nums` |
| 4 | Allouer (kg) | allocation input | 24 % | right | `<Input type="number" step="0.01" min="0" className="h-7 text-xs w-full">` |

- Mini-table: `rounded border bg-background overflow-hidden` (same surface rule, smaller than main table).
- Lots sorted by `dlc` ascending (FIFO — UI-SPEC + locked decision).
- Only lots with `quantiteRestante > 0` AND `dlc >= today` AND `type === typeMatiere` are shown.
- Pre-fill: greedy FIFO defaults — fill from the earliest-DLC lot first until the required quantity is met or all lots are exhausted. Remaining lots default to `0`.
- `<Input>` max is capped at `Math.min(lot.quantiteRestante, remainingRequired)` conceptually (enforced via zod validation, not `max=` attribute, to allow the user to adjust).

**Running total row** (below each mini-table):

- `flex items-center justify-between mt-2`.
- Left: `text-xs text-muted-foreground` showing `Total alloué : {sum.toFixed(2)} kg`.
- Right: if `sum >= required` → `<Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 ...">Complet</Badge>`.
  - if `sum < required` → `<Badge className="bg-amber-100 text-amber-800 border-amber-200 ...">manquant : {(required - sum).toFixed(2)} kg</Badge>` (amber, not red — shortage is a warning, not an error during allocation; error fires on step 2 → 3 advance).

**Note on badge classes:** These are the ONLY places in Phase 4 where the emerald/amber bucket classes are rendered outside `components/dlc-badge.tsx` / `lib/raw-materials.ts`. They are permitted here because they represent semantic production-status feedback, not DLC feedback. The Phase 1 color rule ("semantic colors only for DLC and alerts") is satisfied — shortage is an operational alert.

**Advance guard:** clicking `Suivant →` from step 2 validates that for every ingredient, `sum of allocated quantities >= required`. If any ingredient is short, show `FormMessage`-equivalent error below that section: `Quantité insuffisante — allouez {manquant} kg supplémentaires.`

Footer: `← Retour` (outline) + `Suivant →` (primary, disabled while any ingredient has shortage).

**Sections:** wrapped in `<div className="space-y-6">` — one section per ingredient.

### Step 3 — Récapitulatif

```
┌──────────────────────────────────────────────────────────────────────┐
│  Récapitulatif                                                        │
│                                                                       │
│  Recette      Broche standard 25 kg                                  │
│  Broches      4                                                       │
│  Date         05.05.2026                                             │
│  DLC          10.05.2026 (production + 5 jours)                      │
│                                                                       │
│  Matières premières consommées                                       │
│  ─────────────────────────────                                       │
│  Bœuf      BM-2026-0471     15,00 kg                                 │
│  Agneau    AG-2026-0123      7,50 kg                                 │
│  Épices    EP-2026-0099      2,50 kg                                 │
│                                                                       │
│                  [ ← Retour ]  [ Confirmer la production ]           │
└──────────────────────────────────────────────────────────────────────┘
```

**Summary grid:** `space-y-1 mb-4`. Each row: `flex items-center gap-4`. Label: `text-sm text-muted-foreground w-24 shrink-0`. Value: `text-sm text-foreground`.

| Label | Value |
|-------|-------|
| Recette | `{recipe.nom}` |
| Broches | `{nombreBroches}` |
| Date | today formatted `JJ.MM.AAAA` |
| DLC | broche DLC formatted `JJ.MM.AAAA` + `text-xs text-muted-foreground ml-2 "(production + 5 jours)"` |

**Consumed materials section:**
- Section heading: `text-sm font-medium text-foreground mt-4 mb-2` — `Matières premières consommées`.
- Separator: `<div className="border-t border-border mb-3">`.
- Per consumed lot row: `flex items-center gap-3 text-sm py-1`.
  - `TYPE_LABELS[typeMatiere]` (`text-muted-foreground w-16 shrink-0`).
  - `numeroLotFournisseur` (`font-mono text-foreground`).
  - `{qty.toFixed(2)} kg` (`tabular-nums text-muted-foreground ml-auto`).

Footer: `← Retour` (outline) + `Confirmer la production` (primary, default size).

---

## Confirmation Behavior (on "Confirmer la production")

Executed in one synchronous block (no loading state needed — Zustand is synchronous):

1. For each `{ rawMaterialId, quantiteUtilisee }` in the allocation: call `updateRawMaterial(rawMaterialId, { quantiteRestante: existingRM.quantiteRestante - quantiteUtilisee })`.
2. Compute `dateProduction = new Date()` formatted as ISO `YYYY-MM-DD`.
3. Compute `dlcBroche = computeBrocheDlc(dateProduction)` from `lib/dlc.ts`.
4. Compute `sequence` = `existingFinishedProducts.filter(fp => fp.dateProduction === todayIso).length + 1`.
5. For `i` in `0..nombreBroches-1`: create `FinishedProduct` — `id = crypto.randomUUID()`, `numeroLotInterne = generateLotNumber(new Date(), sequence + i)`, `productionOrderId = newOrderId`, `poids = recipe.poidsTotal`, `dateProduction`, `dlc = dlcBroche`, `statut = "en_stock"`.
6. Create `ProductionOrder` — `id = newOrderId = crypto.randomUUID()`, `date = dateProduction`, `recipeId`, `nombreBroches`, `matieresPremieresUtilisees`, `brochesProduites = [all N FinishedProducts]`.
7. Call `addProductionOrder(order)` — adds the full order including its `brochesProduites` array.
8. For each `FinishedProduct`: call `addFinishedProduct(fp)`.
9. Fire `toast.success(...)` with the locked string.
10. Close dialog, reset wizard to step 1.

**Why `addProductionOrder` before individual `addFinishedProduct` calls?** The `ProductionOrder.brochesProduites` field embeds the full `FinishedProduct[]` by value (PRD §3 model). The `finishedProducts` top-level array in the store is what Phase 5 (Livraisons) queries for `en_stock` broches. Both must be populated. The store provides `addProductionOrder` (stores the order with embedded broches) and `addFinishedProduct` (stores to the top-level index). Call both.

---

## Toast

| Trigger | String | Variant |
|---------|--------|---------|
| Successful production confirm | `Production confirmée — {N} broches ({recipeName})` | `toast.success` |

Where `{N}` = `nombreBroches` and `{recipeName}` = `recipe.nom`. No em-dash — this uses a spaced regular dash per French typographic convention for structured data strings. Wait — re: PRD §6 "Toast de succès avec lien vers la traçabilité": the link is a placeholder until Phase 7. Render the toast string as-is; no `action` button yet.

**Exact byte string (locked):**
```
Production confirmée — {N} broches ({recipeName})
```
(The separator is an em-dash ` — ` with non-breaking spaces, matching Phase 3's `Lot réceptionné — {nom} ({fournisseur})` pattern.)

---

## Component Inventory (Phase 4 net-new)

| Component | Path | Type | Purpose |
|-----------|------|------|---------|
| `<ProductionPage />` | `app/production/page.tsx` | Client | Route page; owns `wizardOpen` state; renders tabs + CTA |
| `<RecettesTab />` | `components/production/recettes-tab.tsx` | Client | Read-only recipe card list |
| `<OrdreFabricationTable />` | `components/production/ordre-fabrication-table.tsx` | Client | Production orders table or empty state |
| `<ProductionWizard />` | `components/production/production-wizard.tsx` | Client | 3-step Dialog; owns step state (1\|2\|3); allocations state |
| `<AllocationStep />` | `components/production/allocation-step.tsx` | Client | Step 2 inner view — per-ingredient lot allocation |
| `lib/production.ts` | `lib/production.ts` | n/a | `computeRequiredQty`, `buildFifoDefaults`, `validateAllocations`, lot sequence helpers |
| `components/ui/tabs.tsx` | `components/ui/tabs.tsx` | n/a | shadcn Tabs primitive |

**File-size discipline (DEC-file-size-cap, 300 lines):** The wizard is the largest component. Split across `production-wizard.tsx` (step orchestration + step 1/3 views, ≤ 270 lines) and `allocation-step.tsx` (step 2 view, ≤ 250 lines). This split keeps both under the 300-line cap.

---

## `lib/production.ts` — Pure helpers

No React. No side effects. All helpers are pure functions operating on domain types.

```typescript
import type { RawMaterial, Recipe } from "./types";

/** Returns the total kg required for one ingredient across all broches. */
export function computeRequiredQty(
  ingredient: { typeMatiere: RawMaterial["type"]; pourcentage: number },
  recipe: Recipe,
  nombreBroches: number,
): number

/** 
 * Returns available lots for an ingredient type, sorted DLC ascending (FIFO).
 * Only includes lots with quantiteRestante > 0 and dlc >= todayIso.
 */
export function getEligibleLots(
  rawMaterials: RawMaterial[],
  typeMatiere: RawMaterial["type"],
  todayIso: string,
): RawMaterial[]

/**
 * Greedy FIFO pre-fill: returns allocation map { rawMaterialId → qty } for
 * one ingredient. Fills from earliest-DLC lot first; stops when required is met
 * or lots are exhausted. Remaining lots get qty=0.
 */
export function buildFifoDefaults(
  eligibleLots: RawMaterial[],
  requiredQty: number,
): Record<string, number>

/**
 * Returns the shortfall (>0) or 0 if fully allocated.
 * shortfall = requiredQty - sum(allocations.values())
 */
export function computeShortfall(
  allocations: Record<string, number>,
  requiredQty: number,
): number

/**
 * Today as ISO YYYY-MM-DD (UTC). Utility used by wizard and page.
 */
export function todayIso(): string
```

---

## Copywriting Contract (Phase 4 — strings not in Phase 1 / Phase 3 inherited contract)

| Element | Copy |
|---------|------|
| Page CTA | + Nouvel ordre de fabrication |
| Tab 1 label | Recettes |
| Tab 2 label | Ordres de fabrication |
| Wizard dialog title | Nouvel ordre de fabrication |
| Step description — step 1 | Étape 1 sur 3 — Choisir la recette |
| Step description — step 2 | Étape 2 sur 3 — Allouer les matières premières |
| Step description — step 3 | Étape 3 sur 3 — Récapitulatif |
| Cancel button | Annuler |
| Back button | ← Retour |
| Next button | Suivant → |
| Confirm button | Confirmer la production |
| Step 1 — Recette label | Recette |
| Step 1 — Recette placeholder | Sélectionnez une recette |
| Step 1 — Nb broches label | Nombre de broches |
| Step 1 — Nb broches validation (empty) | Champ requis |
| Step 1 — Nb broches validation (< 1) | Le nombre de broches doit être d'au moins 1 |
| Step 1 — Recette validation | Sélectionnez une recette |
| Step 2 — ingredient header | {TYPE_LABEL} — requis : {qty} kg |
| Step 2 — lot mini-table col 1 | N° lot fournisseur |
| Step 2 — lot mini-table col 2 | DLC |
| Step 2 — lot mini-table col 3 | Disponible |
| Step 2 — lot mini-table col 4 | Allouer (kg) |
| Step 2 — running total | Total alloué : {sum} kg |
| Step 2 — shortage badge | manquant : {qty} kg |
| Step 2 — complete badge | Complet |
| Step 2 — shortfall validation | Quantité insuffisante — allouez {manquant} kg supplémentaires. |
| Step 3 — summary label: recette | Recette |
| Step 3 — summary label: broches | Broches |
| Step 3 — summary label: date | Date |
| Step 3 — summary label: DLC | DLC |
| Step 3 — DLC suffix | (production + 5 jours) |
| Step 3 — consumed section heading | Matières premières consommées |
| Toast on confirm | Production confirmée — {N} broches ({recipeName}) |
| ODF table header — date | Date |
| ODF table header — recette | Recette |
| ODF table header — nb broches | Nb broches |
| ODF table header — poids | Poids total |
| ODF table header — lots | Lots consommés |
| Empty state — ODF heading | Aucun ordre de fabrication |
| Empty state — ODF body | Créez votre premier ordre pour commencer la production. |
| Empty state — ODF CTA | + Nouvel ordre de fabrication |

---

## Density & Visual Rhythm (Phase 4 specifics)

- **Table (Ordres de fabrication)** uses the same `py-2 px-3 text-sm` density as Phase 3 raw materials table.
- **Recipe cards** use `p-4` — slightly airier than the table because they are card surfaces, not data rows.
- **Wizard dialog** is the airy surface (`p-6` body, `space-y-4` between form sections in steps 1 + 3, `space-y-6` between ingredient sections in step 2).
- **Mini-table in step 2** uses `text-xs` and `h-7` inputs to keep the allocation step compact. If a recipe has 3 ingredients, the step 2 content is approximately 3 × 120 px = 360 px, comfortably within `max-h-[90vh]` at any laptop resolution.

---

## Inheritance Note for Later Phases

Phases 5–9 inherit from Phase 4:

- `<ProductionWizard />` pattern (single Dialog, internal `step` state, footer Back/Next) is the reference for any future multi-step wizard (Livraisons phase 5 does not use a wizard but the pattern is here for reference).
- `lib/production.ts` pure helpers (`computeRequiredQty`, `buildFifoDefaults`, etc.) are available for Phase 7 traçabilité display if needed.
- `components/production/ordre-fabrication-table.tsx` is read by Phase 7 when rendering upstream traçabilité results.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS — formal French B2B, all phase-specific strings declared, no emojis, validation messages follow Phase 3 convention pattern.
- [ ] Dimension 2 Visuals: PASS — sober B2B SaaS, recipe cards use same bordered surface as Phase 1 Card, wizard dialog matches Phase 3 dialog patterns.
- [ ] Dimension 3 Color: PASS — no net-new colors; emerald/amber badge in step 2 running-total is the operational-status budget (analogous to DLC + Statut in Phase 3); no decorative semantic colors.
- [ ] Dimension 4 Typography: PASS — only inherited 4 sizes × 2 weights; `font-mono` for lot numbers per Phase 1.
- [ ] Dimension 5 Spacing: PASS — `space-y-4` form (step 1/3), `space-y-6` ingredient sections (step 2), `p-4` recipe cards, `py-2 px-3` table density, `mb-6` page-header gap.
- [ ] Dimension 6 Registry Safety: PASS — only shadcn official `tabs`, no third-party.

**Approval:** pending

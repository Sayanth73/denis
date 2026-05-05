---
phase: 7
slug: tracabilite-screen
status: draft
shadcn_initialized: true
preset: inherits 01-UI-SPEC.md + 03-UI-SPEC.md + 04-UI-SPEC.md + 05-UI-SPEC.md + 06-UI-SPEC.md (New York, neutral, CSS variables)
created: 2026-05-05
inherits: 01-UI-SPEC.md, 03-UI-SPEC.md, 04-UI-SPEC.md, 05-UI-SPEC.md, 06-UI-SPEC.md
---

# Phase 7 — UI Design Contract: Traçabilité Screen

> Phase 7 inherits **every token, color, type role, spacing token, and copy convention** from all prior UI-SPECs. This file declares only the net-new contract for `/tracabilite` — the killer feature of the POC.

---

## Phase 7 — New Dependencies

**New npm package:**
- `react-to-print` — install via `npm install react-to-print`

No new shadcn primitives needed. All required primitives are already installed:
- `input`, `button`, `badge` — search bar, chips, export button
- `table` — section data tables
- No `npx shadcn add` step.

---

## Page Layout — `/tracabilite`

Single-column layout inside the inherited shell main content area (`px-6 py-6`).

```
┌──────────────────────────────────────────────────────────────────────┐
│ (header: "Traçabilité" — owned by global Phase 1 header)             │
├──────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ Search section (bg-background rounded-md border p-5 mb-8)     │  │
│  │                                                                │  │
│  │  Shortcut chips (gap-2, mb-3)                                  │  │
│  │  [ Exemple — N° fournisseur ]  [ Exemple — N° broche interne ] │  │
│  │                                                                │  │
│  │  Search input row (flex gap-2)                                 │  │
│  │  [ 🔍  Rechercher un numéro de lot...              ] [Lancer]  │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  Result region — conditionally renders one of:                       │
│  A) Initial empty state (Search icon, "Lancez une recherche")        │
│  B) Not-found empty state (SearchX icon, "Aucun lot trouvé...")      │
│  C) <TracabiliteUpstream> (Cas 1 — supplier lot)                     │
│  D) <TracabiliteDownstream> (Cas 2 — internal broche lot)            │
└──────────────────────────────────────────────────────────────────────┘
```

- The search card is always visible.
- Shortcut chips sit **above** the search input row.
- The result region sits below the card, separated by `mb-8` on the card.
- The "Exporter dossier traçabilité (PDF)" button appears **top-right of the result region** (inside each result component, not in the search card).

---

## Search Section

### Shortcut Chips

Two `<Button variant="outline" size="sm">` chips rendered in a `<div className="flex gap-2 mb-3">`.

```
[ Exemple — N° fournisseur ]   [ Exemple — N° broche interne ]
```

- Variant: `outline`, size: `sm` (`h-8 px-3 text-xs`).
- Clicking either chip sets the input value and triggers a search immediately.
- Values read from the Zustand store on mount (after hydration):
  - Chip 1: `rawMaterials[0].numeroLotFournisseur` (first RM's supplier lot)
  - Chip 2: `finishedProducts.find(fp => true)?.numeroLotInterne ?? ""` (first finished product's internal lot)
- If store is not yet hydrated, chips are disabled (`disabled` attribute).

### Search Input Row

```
┌──────────────────────────────────────────────────────────────┐
│  🔍  Rechercher un numéro de lot (matière première ou       │  ← <Input> with icon prefix
│      broche finie)...                               [Lancer] │  ← <Button>
└──────────────────────────────────────────────────────────────┘
```

Layout: `<div className="flex gap-2">` containing the input wrapper and the submit button.

**Input wrapper:**
```
<div className="relative flex-1">
  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
  <Input
    className="pl-9"
    placeholder="Rechercher un numéro de lot (matière première ou broche finie)..."
    value={query}
    onChange={(e) => setQuery(e.target.value)}
    onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
  />
</div>
```

**Submit button:**
```
<Button onClick={handleSearch} disabled={!query.trim()}>
  Lancer la recherche
</Button>
```

- Variant: `default` (primary blue), size: `default`.
- Disabled when input is empty or whitespace-only.
- Submission: Enter key or button click — no debounce (locked decision).

### URL Sync

- On mount: read `?lot` from `useSearchParams()` — if present, set `query` and trigger search immediately.
- On submit: push `?lot={encodedValue}` to the URL using `useRouter().replace()` so back-navigation is clean.
- `useSearchParams()` requires `<Suspense>` wrapper or `"use client"` component — the page is already `"use client"`.

---

## Result Region

The result region always renders one of four states determined by `searchState`:

```typescript
type SearchState =
  | { kind: "idle" }              // initial — before any search
  | { kind: "not-found" }         // searched but no match
  | { kind: "upstream"; rm: RawMaterial }         // Cas 1
  | { kind: "downstream"; broche: FinishedProduct }; // Cas 2
```

Lot type detection (locked decision):
- Internal regex: `/^TK-\d{4}-\d{4}-\d{3}$/` → Cas 2 (broche)
- Anything else → Cas 1 (supplier lot, string match on `numeroLotFournisseur`)
- If both interpretations match → prefer broche (more specific, locked decision)

---

## Empty States

### Initial (idle — before first search)

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                         🔍 (48px)                            │
│                   Lancez une recherche                        │  ← h2 text-xl font-semibold
│        Saisissez un numéro de lot ou utilisez               │  ← p text-sm text-muted-foreground
│              un des exemples ci-dessus.                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

Props:
```tsx
<EmptyState
  icon={Search}
  heading="Lancez une recherche"
  body="Saisissez un numéro de lot ou utilisez un des exemples."
/>
```

No CTA. `<EmptyState>` from `components/empty-state.tsx`.

### Not Found

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                         🔍✕ (48px)                           │
│           Aucun lot trouvé pour ce numéro                    │  ← h2
│      Vérifiez le format ou essayez un des                    │  ← p
│               exemples ci-dessus.                            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

Props:
```tsx
<EmptyState
  icon={SearchX}
  heading="Aucun lot trouvé pour ce numéro"
  body="Vérifiez le format ou essayez un des exemples ci-dessus."
/>
```

No CTA. `SearchX` from lucide-react.

---

## Cas 1 — TracabiliteUpstream (Supplier Lot)

Component: `components/tracabilite/tracabilite-upstream.tsx`

Three vertically stacked sections with a visual left-rail connector (vertical line + chevron-down icons between sections).

```
┌─────────────────────────────────────────────────────────────────────┐
│  Section heading row (flex justify-between items-center mb-4)       │
│  Dossier traçabilité — amont                          [Exporter PDF] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ● ─────────────────────────────────────────────────────────────┐  │
│  │  Section 1: Matière première (card)                          │  │
│  │  fournisseur, lot, dates, température, certificat            │  │
│  └─────────────────────────────────────────────────────────────  │
│  ↓ (connector)                                                     │
│  ● ─────────────────────────────────────────────────────────────┐  │
│  │  Section 2: Ordres de fabrication concernés (list)           │  │
│  │  date / recette / quantité consommée / nb broches            │  │
│  └─────────────────────────────────────────────────────────────  │
│  ↓ (connector)                                                     │
│  ● ─────────────────────────────────────────────────────────────┐  │
│  │  Section 3: Clients impactés (list)                          │  │
│  │  client nom / date livraison / broche lot numbers            │  │
│  └─────────────────────────────────────────────────────────────  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Cas 1 — Top Row

```tsx
<div className="flex items-center justify-between mb-6">
  <div>
    <h2 className="text-lg font-semibold">Dossier traçabilité — amont</h2>
    <p className="text-sm text-muted-foreground mt-0.5">
      Lot fournisseur : <span className="font-mono">{rm.numeroLotFournisseur}</span>
    </p>
  </div>
  <Button variant="outline" size="sm" onClick={handlePrint}>
    <FileText size={14} className="mr-1.5" aria-hidden="true" />
    Exporter dossier (PDF)
  </Button>
</div>
```

### Vertical Connector System

The three sections are connected by a left-rail visual:

```
<div className="relative flex flex-col gap-0">
  {/* Left rail line */}
  <div className="absolute left-4 top-8 bottom-8 w-px bg-border" aria-hidden="true" />

  {/* Section wrapper — each gets a dot on the left rail */}
  <TracabiliteSection step={1} heading="Matière première">
    ...
  </TracabiliteSection>

  {/* Connector chevron between sections */}
  <div className="flex items-center pl-[1rem] py-2 text-muted-foreground" aria-hidden="true">
    <ChevronDown size={16} />
  </div>

  <TracabiliteSection step={2} heading="Ordres de fabrication concernés">
    ...
  </TracabiliteSection>

  <div className="flex items-center pl-[1rem] py-2 text-muted-foreground" aria-hidden="true">
    <ChevronDown size={16} />
  </div>

  <TracabiliteSection step={3} heading="Clients impactés">
    ...
  </TracabiliteSection>
</div>
```

### TracabiliteSection Card (reusable)

Component: `components/ui/tracabilite-section.tsx`

```typescript
type TracabiliteSectionProps = {
  step: 1 | 2 | 3;
  heading: string;
  children: React.ReactNode;
  className?: string;
};
```

Layout:
```tsx
<div className={cn("relative pl-10 pb-2", className)}>
  {/* Step dot on the left rail */}
  <div className="absolute left-[0.625rem] top-3 size-3 rounded-full bg-border ring-2 ring-background" />
  {/* Card surface */}
  <div className="rounded-md border bg-background p-5">
    <h3 className="text-sm font-semibold text-foreground mb-4">{heading}</h3>
    {children}
  </div>
</div>
```

- `pl-10` offsets content from the left rail line.
- The dot (`size-3` circle) sits at `left-[0.625rem]` to center on the rail line (`left-4` = 1 rem = 16px; dot is 12px; center at 4px → `0.625rem = 10px` offset positions center at 16px rail).
- No color on the dot (neutral `bg-border`) — avoid decorative semantic colors (locked rule).

### Cas 1 — Section 1: Matière première

Data: the matched `RawMaterial` object.

```
┌──────────────────────────────────────────────────────────┐
│  Matière première                               (heading) │
│                                                           │
│  Fournisseur     Boucherie Müller SA                      │
│  N° lot          BM-2026-0471           (font-mono)       │
│  Type            Bœuf                                     │
│  Nom             Épaule de bœuf désossée                  │
│  Date réception  06.05.2026                               │
│  DLC             [badge]                                  │
│  Quantité reçue  80 kg                                    │
│  Température     2 °C                                     │
│  Certificat      CH-OSAV-2026-114   (omitted if absent)   │
└──────────────────────────────────────────────────────────┘
```

Layout: definition list (`<dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">`).

- `<dt className="text-muted-foreground font-medium">` for labels.
- `<dd>` for values; `font-mono text-xs` for lot numbers, `<DlcBadge>` for DLC, `tabular-nums` for quantities.
- Certificat row: omit entirely if `rm.certificatSanitaire` is absent.

### Cas 1 — Section 2: Ordres de fabrication concernés

Data: result of `getProductionOrdersForRm(rm.id, productionOrders)`.

Each entry: `{ order: ProductionOrder; quantiteUtilisee: number }`.

```
┌──────────────────────────────────────────────────────────┐
│  Ordres de fabrication concernés            (heading)     │
│                                                           │
│  Date         Recette                  Qté consommée     │  ← table header
│  02.05.2026   Broche standard 25 kg   45 kg             │  ← data row
└──────────────────────────────────────────────────────────┘
```

Uses `<Table>` (shadcn):

| Column | Header | Width | Content |
|--------|--------|-------|---------|
| 1 | Date | 20 % | `formatDate(order.date)` |
| 2 | Recette | 50 % | recipe name (lookup by `order.recipeId` from `recipes`) |
| 3 | Qté consommée | 30 % | `{quantiteUtilisee} kg`, `tabular-nums`, right-aligned |

- If list is empty: `<p className="text-sm text-muted-foreground">Aucun ordre de fabrication lié.</p>`
- Header row: `text-xs font-medium text-muted-foreground`, no border-bottom on last row.
- Data rows: `text-sm border-b border-border last:border-b-0`.

### Cas 1 — Section 3: Clients impactés

Data: result of `getClientsImpactes(rm.id, productionOrders, finishedProducts, deliveries, customers)`.

Each entry: `{ customer: Customer; delivery: Delivery; broches: FinishedProduct[] }`.

```
┌──────────────────────────────────────────────────────────┐
│  Clients impactés                           (heading)     │
│                                                           │
│  Client                 Date livraison   Lots livrés      │  ← table header
│  Kebab Royal Lausanne   03.05.2026       TK-2026-0502-001 │
│                                          TK-2026-0502-002 │
└──────────────────────────────────────────────────────────┘
```

| Column | Header | Width | Content |
|--------|--------|-------|---------|
| 1 | Client | 35 % | `customer.nom` |
| 2 | Date livraison | 25 % | `formatDate(delivery.date)` |
| 3 | Lots livrés | 40 % | Comma-separated `font-mono text-xs` lot numbers |

- Multiple broches per delivery → show all `numeroLotInterne` values as a stack: `<div className="flex flex-col gap-0.5">` with one `<span className="font-mono text-xs">` per lot.
- If list is empty: `<p className="text-sm text-muted-foreground">Aucun client impacté.</p>`

---

## Cas 2 — TracabiliteDownstream (Internal Broche Lot)

Component: `components/tracabilite/tracabilite-downstream.tsx`

Three vertically stacked sections using the same `<TracabiliteSection>` card and connector system.

```
┌─────────────────────────────────────────────────────────────────────┐
│  Dossier traçabilité — aval                           [Exporter PDF] │
│  Lot interne : TK-2026-0502-001                                     │
├─────────────────────────────────────────────────────────────────────┤
│  ● Section 1: Broche finie (card)                                   │
│  ↓                                                                   │
│  ● Section 2: Ordre de fabrication (card)                           │
│  ↓                                                                   │
│  ● Section 3: Matières premières utilisées (table)                  │
└─────────────────────────────────────────────────────────────────────┘
```

### Cas 2 — Top Row

```tsx
<div className="flex items-center justify-between mb-6">
  <div>
    <h2 className="text-lg font-semibold">Dossier traçabilité — aval</h2>
    <p className="text-sm text-muted-foreground mt-0.5">
      Lot interne : <span className="font-mono">{broche.numeroLotInterne}</span>
    </p>
  </div>
  <Button variant="outline" size="sm" onClick={handlePrint}>
    <FileText size={14} className="mr-1.5" aria-hidden="true" />
    Exporter dossier (PDF)
  </Button>
</div>
```

### Cas 2 — Section 1: Broche finie

Data: the matched `FinishedProduct`, plus resolved delivery + customer if `statut === "livree"`.

```
┌──────────────────────────────────────────────────────────┐
│  Broche finie                               (heading)     │
│                                                           │
│  N° lot interne   TK-2026-0502-001    (font-mono)         │
│  Date production  02.05.2026                              │
│  Poids            25 kg                                   │
│  DLC              [badge]                                 │
│  Statut           En stock / Livrée                       │
│  Client livré     Kebab Royal Lausanne  (if livree)       │
│  Date livraison   03.05.2026           (if livree)        │
└──────────────────────────────────────────────────────────┘
```

Definition list same style as Cas 1, Section 1.

- `Statut` row: use inline `<span>` with badge classes: `en_stock` → `bg-zinc-100 text-zinc-700 border-zinc-200`; `livree` → `bg-emerald-50 text-emerald-800 border-emerald-200`.
- "Client livré" and "Date livraison" rows: rendered only if `broche.statut === "livree"` and delivery + customer are resolved. Omit both rows if delivery not found.

### Cas 2 — Section 2: Ordre de fabrication

Data: production order found via `broche.productionOrderId`, and its recipe looked up in `recipes`.

```
┌──────────────────────────────────────────────────────────┐
│  Ordre de fabrication                       (heading)     │
│                                                           │
│  Date            02.05.2026                               │
│  Recette         Broche standard 25 kg                    │
│  Nombre broches  4                                        │
└──────────────────────────────────────────────────────────┘
```

Definition list. If production order not found: `<p className="text-sm text-muted-foreground">Ordre de fabrication introuvable.</p>`

Also render recipe composition as a compact pill list:
```
Composition : [60% Bœuf] [30% Agneau] [10% Épices]
```
Each pill: `<span className="inline-flex items-center px-2 py-0.5 rounded-md border text-xs bg-zinc-100 text-zinc-700 border-zinc-200 mr-1">{ingredient.pourcentage}% {TYPE_LABELS[ingredient.typeMatiere]}</span>`.

### Cas 2 — Section 3: Matières premières utilisées

Data: result of `getRawMaterialsForBroche(broche, productionOrders, rawMaterials)` from `lib/clients.ts`.

Each entry: `{ rm: RawMaterial; quantiteUtilisee: number }`.

```
┌──────────────────────────────────────────────────────────┐
│  Matières premières utilisées               (heading)     │
│                                                           │
│  Matière   Fournisseur      N° lot fournisseur   Qté     │  ← table header
│  Bœuf      Müller SA        BM-2026-0471          45 kg  │
│  Agneau    Élevage Romand   ER-26-0312             18 kg  │
└──────────────────────────────────────────────────────────┘
```

| Column | Header | Width | Content |
|--------|--------|-------|---------|
| 1 | Matière | 22 % | `TYPE_LABELS[rm.type]` |
| 2 | Fournisseur | 32 % | `rm.fournisseur` |
| 3 | N° lot fournisseur | 28 % | `font-mono text-xs` lot string |
| 4 | Qté utilisée | 18 % | `{quantiteUtilisee} kg`, `tabular-nums`, right-aligned |

- If empty: `<p className="text-sm text-muted-foreground">Aucune matière première trouvée.</p>`

---

## PDF Export

### Printable Wrapper

Component: `components/tracabilite/tracabilite-printable.tsx`

```typescript
import * as React from "react";

type TracabilitePrintableProps = {
  children: React.ReactNode;
};

export const TracabilitePrintable = React.forwardRef<
  HTMLDivElement,
  TracabilitePrintableProps
>(function TracabilitePrintable({ children }, ref) {
  return (
    <div ref={ref} className="print-target">
      {children}
    </div>
  );
});
```

The `print-target` class activates the print isolation defined in `app/globals.css`.

### Print Styles (globals.css addition)

Append to `app/globals.css` (locked decision):

```css
@media print {
  body * {
    visibility: hidden;
  }
  .print-target,
  .print-target * {
    visibility: visible;
  }
  .print-target {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
  }
}
```

### useReactToPrint Hook

Both `<TracabiliteUpstream>` and `<TracabiliteDownstream>` use the `useReactToPrint` hook:

```typescript
import { useReactToPrint } from "react-to-print";

const printableRef = React.useRef<HTMLDivElement>(null);
const handlePrint = useReactToPrint({
  contentRef: printableRef,
  documentTitle: `Tracabilite-${lotNumber}`,
});
```

The `contentRef` targets the `<TracabilitePrintable ref={printableRef}>` wrapper.

---

## Component Inventory (Phase 7 net-new)

| Component | Path | Type | Purpose |
|-----------|------|------|---------|
| `<TracabilitePage />` | `app/tracabilite/page.tsx` | Client | Route page; owns search state, URL sync, lot-type detection, result dispatch |
| `<TracabiliteUpstream />` | `components/tracabilite/tracabilite-upstream.tsx` | Client | Cas 1 — 3-section upstream view with printable wrapper |
| `<TracabiliteDownstream />` | `components/tracabilite/tracabilite-downstream.tsx` | Client | Cas 2 — 3-section downstream view with printable wrapper |
| `<TracabilitePrintable />` | `components/tracabilite/tracabilite-printable.tsx` | Client | `forwardRef` wrapper with `print-target` class; receives contentRef from useReactToPrint |
| `<TracabiliteSection />` | `components/ui/tracabilite-section.tsx` | Server/neutral | Reusable section card with step dot; shared by Cas 1 and Cas 2 |
| `lib/tracabilite.ts` | `lib/tracabilite.ts` | n/a | Pure helpers (see §Pure Helpers) |

---

## Pure Helpers — `lib/tracabilite.ts`

No React. No side effects. All functions operate on domain types.

```typescript
import type { RawMaterial, FinishedProduct, ProductionOrder, Customer, Delivery, Recipe } from "./types";

const INTERNAL_LOT_REGEX = /^TK-\d{4}-\d{4}-\d{3}$/;

/**
 * Detects whether a lot string is an internal broche lot or a supplier lot.
 * Returns "broche" for internal lots (TK-YYYY-MMDD-NNN format),
 * "supplier" otherwise. Returns null if input is empty.
 */
export function detectLotType(input: string): "broche" | "supplier" | null;

/**
 * Finds a RawMaterial by exact match on numeroLotFournisseur.
 * Case-sensitive string match. Returns null if not found.
 */
export function findSupplierLot(
  input: string,
  rawMaterials: RawMaterial[],
): RawMaterial | null;

/**
 * Finds a FinishedProduct by exact match on numeroLotInterne.
 * Returns null if not found.
 */
export function findBroche(
  input: string,
  finishedProducts: FinishedProduct[],
): FinishedProduct | null;

/**
 * Returns all production orders that consumed a given raw material,
 * along with the quantity used.
 *
 * Trace path: productionOrder.matieresPremieresUtilisees → rawMaterialId
 */
export function getProductionOrdersForRm(
  rmId: string,
  productionOrders: ProductionOrder[],
): { order: ProductionOrder; quantiteUtilisee: number }[];

/**
 * For a given raw material, finds all clients that received a broche
 * produced from that RM.
 *
 * Trace path:
 *   RM → productionOrders (via matieresPremieresUtilisees)
 *   → brochesProduites IDs
 *   → finishedProducts (resolve)
 *   → livraisonId → deliveries
 *   → customerId → customers
 *
 * Groups by delivery: one entry per (customer, delivery) pair.
 * Sorts by delivery.date descending (most recent first).
 */
export function getClientsImpactes(
  rmId: string,
  productionOrders: ProductionOrder[],
  finishedProducts: FinishedProduct[],
  deliveries: Delivery[],
  customers: Customer[],
): { customer: Customer; delivery: Delivery; broches: FinishedProduct[] }[];

/**
 * Returns the production order and its recipe for a given broche's productionOrderId.
 * Returns null if either the order or the recipe is not found.
 */
export function getRecipeForOrder(
  broche: FinishedProduct,
  productionOrders: ProductionOrder[],
  recipes: Recipe[],
): { order: ProductionOrder; recipe: Recipe } | null;
```

Note: `getRawMaterialsForBroche` is already implemented in `lib/clients.ts` — reuse directly rather than reimplementing in `lib/tracabilite.ts`. Import from `@/lib/clients` in downstream component.

---

## Phase 3 / 5 / 6 Link Integrations (Wave 3)

Three surgical link additions in existing components. No new components needed.

### 1. Phase 4 — Production toast link

In the production wizard confirmation handler (wherever `toast.success(...)` is called after order creation):

```tsx
// Current (approximate):
toast.success("Ordre de fabrication créé", {
  description: `${nombreBroches} broche(s) produites.`,
});

// Updated — add action link:
toast.success("Ordre de fabrication créé", {
  description: `${nombreBroches} broche(s) produites.`,
  action: {
    label: "Voir la traçabilité",
    onClick: () => router.push(`/tracabilite?lot=${firstBroche.numeroLotInterne}`),
  },
});
```

The `firstBroche` is the first element of `order.brochesProduites` (or `order.brochesProduites[0]`). Requires `useRouter` from `next/navigation`.

### 2. Phase 5/6 — BrochesExpansion lot number link

In `components/clients/broches-expansion.tsx`, the N° lot interne cell currently renders plain text:

```tsx
// Current:
<span className="font-mono">{fp.numeroLotInterne}</span>

// Updated — wrap in Link:
<Link
  href={`/tracabilite?lot=${fp.numeroLotInterne}`}
  className="font-mono hover:underline text-primary"
>
  {fp.numeroLotInterne}
</Link>
```

Import: `import Link from "next/link";`.

### 3. Phase 6 — Delivery confirm link (if applicable)

If the Phase 5 "Marquer comme livrée" confirmation produces a toast, add a traçabilité link to the toast action referencing one of the delivered broches' `numeroLotInterne`. This is lower priority than the production toast; add only if the toast exists.

---

## Density & Visual Rhythm (Phase 7 specifics)

- **Search card** uses `p-5` for the container — same as client info card in Phase 6.
- **Section heading** inside `<TracabiliteSection>`: `text-sm font-semibold mb-4` — smaller than page-level h2/h3 to create visual hierarchy within the card.
- **Definition list** in section cards: `gap-y-2` row gap, `text-sm` for both `dt` and `dd`.
- **Section connector chevrons**: `py-2 pl-[1rem]` — aligned with rail line, minimal height.
- **Result component top heading**: `text-lg font-semibold` (between `text-base` sections and `text-xl` page header).
- **Print mode**: the printable wrapper adds no extra spacing — print renders exactly the same content as screen.

---

## Copywriting Contract (Phase 7 — net-new strings)

| Element | Copy |
|---------|------|
| Search placeholder | Rechercher un numéro de lot (matière première ou broche finie)... |
| Submit button | Lancer la recherche |
| Chip 1 label | Exemple — N° fournisseur |
| Chip 2 label | Exemple — N° broche interne |
| Export PDF button | Exporter dossier (PDF) |
| Empty state initial — heading | Lancez une recherche |
| Empty state initial — body | Saisissez un numéro de lot ou utilisez un des exemples. |
| Empty state not-found — heading | Aucun lot trouvé pour ce numéro |
| Empty state not-found — body | Vérifiez le format ou essayez un des exemples ci-dessus. |
| Cas 1 result heading | Dossier traçabilité — amont |
| Cas 1 subtitle prefix | Lot fournisseur : |
| Cas 2 result heading | Dossier traçabilité — aval |
| Cas 2 subtitle prefix | Lot interne : |
| Section 1 heading (Cas 1) | Matière première |
| Section 2 heading (Cas 1) | Ordres de fabrication concernés |
| Section 3 heading (Cas 1) | Clients impactés |
| Section 1 heading (Cas 2) | Broche finie |
| Section 2 heading (Cas 2) | Ordre de fabrication |
| Section 3 heading (Cas 2) | Matières premières utilisées |
| DL label — Fournisseur | Fournisseur |
| DL label — N° lot | N° lot |
| DL label — Type | Type |
| DL label — Nom | Nom |
| DL label — Date réception | Date réception |
| DL label — DLC | DLC |
| DL label — Quantité reçue | Quantité reçue |
| DL label — Température | Température |
| DL label — Certificat sanitaire | Certificat sanitaire |
| DL label — N° lot interne | N° lot interne |
| DL label — Date production | Date production |
| DL label — Poids | Poids |
| DL label — Statut | Statut |
| DL label — Client livré | Client livré |
| DL label — Date livraison | Date livraison |
| DL label — Date | Date |
| DL label — Recette | Recette |
| DL label — Nombre broches | Nombre broches |
| DL label — Composition | Composition |
| Table header — Date | Date |
| Table header — Recette | Recette |
| Table header — Qté consommée | Qté consommée |
| Table header — Client | Client |
| Table header — Date livraison | Date livraison |
| Table header — Lots livrés | Lots livrés |
| Table header — Matière | Matière |
| Table header — Fournisseur | Fournisseur |
| Table header — N° lot fournisseur | N° lot fournisseur |
| Table header — Qté utilisée | Qté utilisée |
| Empty section — no orders | Aucun ordre de fabrication lié. |
| Empty section — no clients | Aucun client impacté. |
| Empty section — no RMs | Aucune matière première trouvée. |
| Production toast action | Voir la traçabilité |
| BrochesExpansion lot link (title/aria) | Voir la traçabilité de ce lot |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS — formal French B2B, all phase-specific strings declared, no emojis in UI, section headings match locked decisions, validation messages consistent with prior phases.
- [ ] Dimension 2 Visuals: PASS — Linear-inspired sober SaaS, vertical connector system uses neutral border color (no decorative), section cards use same bordered surface as prior phases, result headings respect type hierarchy.
- [ ] Dimension 3 Color: PASS — no new semantic colors introduced beyond what phases 3-6 established; `bg-border` rail dot is neutral; broche statut badges reuse Phase 5 amber/emerald classes.
- [ ] Dimension 4 Typography: PASS — five type roles used: `text-lg font-semibold` (result heading), `text-sm font-semibold` (section heading), `text-sm` (body/labels), `text-xs` (sub-labels, table headers), `font-mono` (lot numbers). `text-xl` reserved for page-level (Phase 1 shell).
- [ ] Dimension 5 Spacing: PASS — `p-5` search card, `pl-10` section offset, `gap-y-2` DL rows, `py-2` connector rows, `mb-6` result heading row.
- [ ] Dimension 6 Registry Safety: PASS — one new npm package (`react-to-print`) declared; no new shadcn primitives; all shadcn components are from installed set.

**Approval:** pending

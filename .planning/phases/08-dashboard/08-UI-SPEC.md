---
phase: 8
slug: dashboard
status: draft
shadcn_initialized: true
preset: inherits 01-UI-SPEC.md through 07-UI-SPEC.md (New York, neutral, CSS variables)
created: 2026-05-05
inherits: 01-UI-SPEC.md, 03-UI-SPEC.md, 04-UI-SPEC.md, 05-UI-SPEC.md, 06-UI-SPEC.md, 07-UI-SPEC.md
---

# Phase 8 — UI Design Contract: Dashboard

> Phase 8 inherits **every token, color, type role, spacing token, and copy convention** from all prior UI-SPECs. This file declares only the net-new contract for `/` — the operational health overview of the business.

---

## Phase 8 — New Dependencies

**New shadcn primitive:**
- `card` — install via `npx shadcn add card` (provides `<Card>`, `<CardHeader>`, `<CardContent>`, `<CardTitle>`, `<CardDescription>`)

**No new npm packages.** `date-fns` is already installed. All other dependencies come from prior phases.

---

## Page Layout — `/`

Two-zone layout inside the inherited shell main content area (`px-6 py-6`).

```
┌──────────────────────────────────────────────────────────────────────────┐
│ (header: "Tableau de bord" — owned by global Phase 1 header)              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  KPI row  (grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6)    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Matières     │  │ Broches      │  │ Production   │  │ Livraisons   │  │
│  │ premières    │  │ en stock     │  │ cette semaine│  │ cette semaine│  │
│  │ en stock     │  │              │  │              │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                                           │
│  Lower grid  (grid grid-cols-1 md:grid-cols-2 gap-4)                     │
│  ┌──────────────────────────┐  ┌──────────────────────────────────────┐  │
│  │ Alertes column           │  │ Activité récente column              │  │
│  │ (left, md:col-span-1)    │  │ (right, md:col-span-1)              │  │
│  └──────────────────────────┘  └──────────────────────────────────────┘  │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

- The KPI row is separated from the lower grid by `mb-6`.
- Hydration guard: until `hasHydrated`, render a skeleton-like disabled state (all numeric content shows `—`, the KPI grid still renders its 4 card shells).

---

## KPI Cards Row

### Container

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
  <KpiCard ... />
  <KpiCard ... />
  <KpiCard ... />
  <KpiCard ... />
</div>
```

### KPI Card Anatomy

Component: `components/dashboard/kpi-card.tsx`

```typescript
type KpiCardProps = {
  label: string;          // uppercase, muted, small — e.g. "Matières premières en stock"
  value: string | number; // large number displayed prominently
  subLabel: string;       // secondary context line — e.g. "12 lots actifs"
  alert?: string;         // optional red badge text — e.g. "2 DLC <3j"
};
```

Visual anatomy (top-to-bottom inside the Card):

```
┌────────────────────────────────────────┐
│  MATIÈRES PREMIÈRES EN STOCK           │  ← label: text-xs font-medium uppercase tracking-wide text-muted-foreground
│                                        │
│  5                   [ 2 DLC <3j ]     │  ← value: text-3xl font-bold tabular-nums + optional alert badge (inline, right-aligned)
│                                        │
│  12 lots actifs                        │  ← subLabel: text-sm text-muted-foreground
└────────────────────────────────────────┘
```

Layout:

```tsx
<Card className="p-5">
  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
    {label}
  </p>
  <div className="flex items-baseline gap-3 mb-1">
    <span className="text-3xl font-bold tabular-nums text-foreground">{value}</span>
    {alert && (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 border border-red-200">
        {alert}
      </span>
    )}
  </div>
  <p className="text-sm text-muted-foreground">{subLabel}</p>
</Card>
```

- `Card` from shadcn (no `CardHeader`/`CardTitle` wrappers — direct composition with `p-5` padding override).
- Alert badge uses red semantic classes. Only rendered when `alert` prop is truthy.
- `text-3xl font-bold tabular-nums` for value — larger than section headings, clearly dominant.
- The card surface is `bg-card rounded-xl border shadow-sm` from shadcn default.

### The Four KPI Cards (locked)

| # | Label | Value | Sub-label | Alert |
|---|-------|-------|-----------|-------|
| 1 | Matières premières en stock | `countActiveRMs(rms)` | `"{N} lots actifs"` | `"{X} DLC <3j"` if `countAlertingDLCs > 0` |
| 2 | Broches en stock | `countBrochesEnStock(fps)` | `"{X} kg total"` | — |
| 3 | Production cette semaine | `countProducedThisWeek(fps, today)` | `"{N} broches produites"` | — |
| 4 | Livraisons cette semaine | `countDeliveriesThisWeek(deliveries, today)` | `"{N} broches livrées"` | — |

**KPI 1 detail:**
- Value = count of lots where `quantiteRestante > 0` (active lots only).
- Sub-label = `"{N} lots actifs"` where N is the same count.
- Alert = `"{X} DLC <3j"` where X = count of active lots with DLC within 3 calendar days of today. Badge rendered only if X > 0.

**KPI 2 detail:**
- Value = count of `FinishedProduct` where `statut === "en_stock"`.
- Sub-label = `"{X} kg total"` where X = sum of `poids` for those same products (use `tabular-nums`, e.g. "75 kg total").

**KPI 3 detail:**
- Value = count of `FinishedProduct` where `dateProduction` falls within the current ISO week (Monday–Sunday, Monday start).
- Sub-label = `"{N} broches produites"`.
- "This week" = `startOfWeek(today, { weekStartsOn: 1 })` through `endOfWeek(today, { weekStartsOn: 1 })` (date-fns, imported in `lib/dashboard.ts`).

**KPI 4 detail:**
- Value = count of `Delivery` records where `date` falls within the current ISO week.
- Sub-label = `"{N} broches livrées"` where N = total `brochesLivrees.length` across those deliveries.
- No estimated value (count-only per locked decision; PRD does not ship prices).

---

## Lower Grid — Alertes Column

### Container

Left column of the `grid grid-cols-1 md:grid-cols-2 gap-4` below the KPI row.

```tsx
<Card className="p-5">
  <h2 className="text-sm font-semibold text-foreground mb-4">Alertes</h2>
  {/* content */}
</Card>
```

### Alert Item Anatomy

Each alert is a single-line row:

```
┌───────────────────────────────────────────────────────────────────┐
│  ● Lot BM-2026-0471 (Épaule de bœuf) — DLC dans 2j               │  ← one-line text-sm
└───────────────────────────────────────────────────────────────────┘
```

```typescript
type AlerteItem = {
  id: string;
  severity: "critical" | "warning";
  message: string;       // fully-formatted one-liner (French)
  href?: string;         // navigation target (e.g. "/matieres-premieres")
};
```

Layout per item:

```tsx
<div key={item.id} className="flex items-start gap-2 py-2 border-b border-border last:border-b-0">
  <span
    className={cn(
      "mt-1.5 size-2 rounded-full flex-shrink-0",
      item.severity === "critical" ? "bg-red-500" : "bg-amber-400"
    )}
    aria-hidden="true"
  />
  <p className="text-sm text-foreground leading-snug">{item.message}</p>
</div>
```

- Severity dot: `bg-red-500` for `critical`, `bg-amber-400` for `warning`.
- Items are not clickable rows in the UI (href is reserved for future use; not rendered as `<Link>` in this phase).
- No CTA button inside the column.

### Alert Types (from `lib/dashboard.ts`)

Three alert categories, merged and sorted by severity (`critical` first, then `warning`) then by message:

| Type | Severity | Message template |
|------|----------|-----------------|
| DLC near | `critical` (< 2 days) or `warning` (2–3 days) | `Lot {numeroLotFournisseur} ({nom}) — DLC dans {N}j` |
| Low stock | `warning` | `Lot {numeroLotFournisseur} ({nom}) — {quantiteRestante} kg restants` |
| Stale broche | `warning` | `Broche {numeroLotInterne} en stock depuis {N}j` |

**DLC near threshold:** DLC within `today + 3 days` (calendar days). Days remaining = `Math.floor((dlcMs - todayMs) / 86_400_000)`.
**Low stock threshold:** `quantiteRestante < 5` kg (locked).
**Stale broche threshold:** `statut === "en_stock"` AND `dateProduction < today - 3 days` (locked). Days stale = `Math.floor((todayMs - dateProductionMs) / 86_400_000)`.

### Alertes Empty State

```tsx
<EmptyState
  icon={ShieldCheck}
  heading="Tout va bien"
  body="Aucune alerte en cours."
/>
```

- `ShieldCheck` from lucide-react.
- No CTA.

---

## Lower Grid — Activité Récente Column

### Container

Right column of the `grid grid-cols-1 md:grid-cols-2 gap-4`.

```tsx
<Card className="p-5">
  <h2 className="text-sm font-semibold text-foreground mb-4">Activité récente</h2>
  {/* content */}
</Card>
```

### Activity Item Anatomy

Each activity item is a clickable row that navigates to its screen:

```
┌────────────────────────────────────────────────────────────────────┐
│  [icon]  Réception — Épaule de bœuf (Boucherie Müller SA)          │  ← title: text-sm font-medium
│          il y a 3 jours                                            │  ← date: text-xs text-muted-foreground
└────────────────────────────────────────────────────────────────────┘
```

```typescript
type ActivityItem = {
  id: string;           // unique key (entity id)
  icon: LucideIcon;     // Package for reception, Factory for production, Truck for livraison
  title: string;        // formatted one-liner (French)
  subtitle?: string;    // not used in this phase (reserved)
  date: string;         // ISO date string
  href: string;         // navigation target
};
```

Layout per item (rendered as a Next.js `<Link>`):

```tsx
<Link
  key={item.id}
  href={item.href}
  className="flex items-start gap-3 py-2.5 border-b border-border last:border-b-0 hover:bg-accent rounded-sm -mx-1 px-1 transition-colors"
>
  <item.icon
    size={16}
    className="mt-0.5 text-muted-foreground flex-shrink-0"
    aria-hidden="true"
  />
  <div className="flex-1 min-w-0">
    <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
    <p className="text-xs text-muted-foreground">{formatRelativeDate(item.date, today)}</p>
  </div>
</Link>
```

### Activity Title Templates (locked)

| Event type | Icon | Title template | href |
|-----------|------|---------------|------|
| `reception` | `Package` | `Réception — {rm.nom} ({rm.fournisseur})` | `/matieres-premieres` |
| `production` | `Factory` | `Production — {order.nombreBroches} broche(s) (recipe.nom)` | `/production` |
| `livraison` | `Truck` | `Livraison — {delivery.brochesLivrees.length} broche(s) → {customer.nom}` | `/livraisons` |

- `Package`, `Factory`, `Truck` from lucide-react.
- Cap to **5 most recent items** (sorted by date descending).

### Date Formatting — `formatRelativeDate`

Helper in `lib/dashboard.ts`:

```typescript
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export function formatRelativeDate(iso: string, _today?: Date): string {
  const date = new Date(`${iso.slice(0, 10)}T00:00:00.000Z`);
  return formatDistanceToNow(date, { addSuffix: true, locale: fr });
  // → "il y a 3 jours", "il y a environ 1 heure", "il y a moins d'une minute"
}
```

### Activity Merger — `getRecentActivity`

In `lib/dashboard.ts`, merges three event streams:

```typescript
export function getRecentActivity(
  state: {
    rawMaterials: RawMaterial[];
    productionOrders: ProductionOrder[];
    deliveries: Delivery[];
    customers: Customer[];
    recipes: Recipe[];
  },
  n: number = 5,
): ActivityItem[];
```

- **Réception stream:** one item per `RawMaterial`, using `dateReception` as the date.
- **Production stream:** one item per `ProductionOrder`, using `date` as the date. Resolve `recipeId` → recipe `nom`.
- **Livraison stream:** one item per `Delivery`, using `date` as the date. Resolve `customerId` → customer `nom`.
- Merge all three, sort by `date` descending, take first `n`.

### Activity Empty State

```tsx
<EmptyState
  icon={Activity}
  heading="Aucune activité"
  body="Réceptionnez un lot ou créez une livraison pour voir l'activité ici."
/>
```

- `Activity` from lucide-react.
- No CTA.

---

## Hydration Guard Pattern

Dashboard page is `"use client"`. The guard matches prior phase pattern:

```typescript
const hasHydrated = useTraceabilityStore((s) => s.hasHydrated);

if (!hasHydrated) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {[0, 1, 2, 3].map((i) => (
        <Card key={i} className="p-5 animate-pulse">
          <div className="h-3 bg-muted rounded w-3/4 mb-3" />
          <div className="h-8 bg-muted rounded w-1/2 mb-2" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </Card>
      ))}
    </div>
  );
}
```

The lower grid (Alertes + Activité) is only rendered after hydration.

---

## Pure Helpers — `lib/dashboard.ts`

No React. No Zustand. No side effects. All functions operate on domain types.

```typescript
import type { RawMaterial, FinishedProduct, Delivery, ProductionOrder, Customer, Recipe } from "./types";
import { startOfWeek, endOfWeek } from "date-fns";

// ─── KPI helpers ────────────────────────────────────────────────────────────

/**
 * Count of RawMaterials with quantiteRestante > 0 (active lots).
 */
export function countActiveRMs(rms: RawMaterial[]): number;

/**
 * Count of RawMaterials within the DLC alert window (DLC within N calendar
 * days of today, where N defaults to 3 per locked decision).
 * Only counts lots with quantiteRestante > 0 (expired stock is not alerting).
 */
export function countAlertingDLCs(rms: RawMaterial[], today: Date, daysWindow?: number): number;

/**
 * Count of FinishedProducts with statut === "en_stock".
 */
export function countBrochesEnStock(fps: FinishedProduct[]): number;

/**
 * Sum of poids (kg) for FinishedProducts with statut === "en_stock".
 */
export function sumBrochesWeight(fps: FinishedProduct[]): number;

/**
 * Count of FinishedProducts whose dateProduction falls within the ISO week
 * containing `today` (Monday start).
 * Uses date-fns startOfWeek / endOfWeek with { weekStartsOn: 1 }.
 */
export function countProducedThisWeek(fps: FinishedProduct[], today: Date): number;

/**
 * Count of Deliveries whose date falls within the ISO week containing `today`
 * (Monday start).
 */
export function countDeliveriesThisWeek(deliveries: Delivery[], today: Date): number;

/**
 * Total brochesLivrees count across Deliveries in the current ISO week.
 * Used for the KPI 4 sub-label "{N} broches livrées".
 */
export function countBrochesLivreesThisWeek(deliveries: Delivery[], today: Date): number;

// ─── Alertes ─────────────────────────────────────────────────────────────────

export type AlerteItem = {
  id: string;
  severity: "critical" | "warning";
  message: string;
  href?: string;
};

/**
 * Produces the merged, sorted list of operational alerts:
 *   1. RM DLC near (< 3 days): critical if < 2 days, warning if 2-3 days
 *   2. Low stock (quantiteRestante < 5 kg): warning
 *   3. Stale broches (en_stock AND dateProduction < today - 3 days): warning
 * Sorted: critical first, then warning. Within severity, sorted by message.
 */
export function getAlertes(
  state: {
    rawMaterials: RawMaterial[];
    finishedProducts: FinishedProduct[];
  },
  today: Date,
): AlerteItem[];

// ─── Recent Activity ──────────────────────────────────────────────────────────

export type ActivityItem = {
  id: string;
  iconName: "Package" | "Factory" | "Truck";
  title: string;
  date: string; // ISO date
  href: string;
};

/**
 * Merges reception, production, and livraison event streams,
 * sorts by date descending, caps to n items (default 5).
 */
export function getRecentActivity(
  state: {
    rawMaterials: RawMaterial[];
    productionOrders: ProductionOrder[];
    deliveries: Delivery[];
    customers: Customer[];
    recipes: Recipe[];
  },
  n?: number,
): ActivityItem[];

// ─── Date helper ─────────────────────────────────────────────────────────────

/**
 * Human-readable relative date using date-fns formatDistanceToNow (French locale).
 * Example: "il y a 3 jours", "il y a environ 2 heures".
 */
export function formatRelativeDate(iso: string): string;
```

**Implementation notes for `getAlertes`:**
- DLC-near loop: iterate `rawMaterials` where `quantiteRestante > 0`. Compute `daysRemaining = Math.floor((dlcMs - todayMs) / 86_400_000)`. If `daysRemaining < 3`: produce alert. Severity: `critical` if `daysRemaining < 2`, else `warning`. Message: `Lot {numeroLotFournisseur} ({nom}) — DLC dans {daysRemaining}j`.
- Low-stock loop: iterate `rawMaterials` where `quantiteRestante > 0 && quantiteRestante < 5`. Message: `Lot {numeroLotFournisseur} ({nom}) — ${quantiteRestante} kg restants`. Severity: `warning`. Skip if already in the DLC alert list (avoid double-entry for same lot — check by id).
- Stale-broche loop: iterate `finishedProducts` where `statut === "en_stock"`. Compute `daysStale = Math.floor((todayMs - dateProductionMs) / 86_400_000)`. If `daysStale > 3`: severity `warning`, message: `Broche {numeroLotInterne} en stock depuis ${daysStale}j`.
- Sort: critical first, then warning. Within group, lexicographic by `message`.

**Implementation notes for `getRecentActivity`:**
- Réception: for each `rm`, produce `{ id: rm.id, iconName: "Package", title: "Réception — {rm.nom} ({rm.fournisseur})", date: rm.dateReception, href: "/matieres-premieres" }`.
- Production: for each `order`, resolve recipe. Produce `{ id: order.id, iconName: "Factory", title: "Production — {order.nombreBroches} broche(s) ({recipe.nom})", date: order.date, href: "/production" }`. If recipe not found, title: `Production — {order.nombreBroches} broche(s)`.
- Livraison: for each `delivery`, resolve customer. Produce `{ id: delivery.id, iconName: "Truck", title: "Livraison — {delivery.brochesLivrees.length} broche(s) → {customer.nom}", date: delivery.date, href: "/livraisons" }`. If customer not found, title: `Livraison — {delivery.brochesLivrees.length} broche(s)`.
- Merge, sort by `date` descending, `slice(0, n)`.

---

## Component Inventory (Phase 8 net-new)

| Component | Path | Type | Purpose |
|-----------|------|------|---------|
| `<DashboardPage />` | `app/page.tsx` | Client | Route page; owns hydration guard, data subscriptions, renders KPI row + lower grid |
| `<KpiCard />` | `components/dashboard/kpi-card.tsx` | Server-neutral | Presentational KPI card with label/value/subLabel/alert |
| `<AlertesColumn />` | `components/dashboard/alertes-column.tsx` | Server-neutral | Alertes list with severity dots + empty state |
| `<RecentActivityColumn />` | `components/dashboard/recent-activity-column.tsx` | Client | Activity timeline with Link rows + empty state |
| `lib/dashboard.ts` | `lib/dashboard.ts` | n/a | Pure helpers (KPI counts, alertes merger, activity merger, date helper) |

---

## Density & Visual Rhythm (Phase 8 specifics)

- **KPI cards**: `p-5` padding (same as search card in Phase 7, client detail card in Phase 6).
- **KPI value**: `text-3xl font-bold` — larger than any prior text role, establishes visual hierarchy.
- **KPI label**: `text-xs uppercase tracking-wide` — lighter than any prior label, sits above the number.
- **Column cards**: same `p-5 rounded-xl border` surface as KPI cards.
- **Column heading**: `text-sm font-semibold mb-4` — same as `<TracabiliteSection>` heading in Phase 7.
- **Alert item**: `py-2 border-b last:border-b-0` row rhythm — same as table rows.
- **Activity item**: `py-2.5 border-b last:border-b-0` slightly taller to accommodate the two-line content.
- **Severity dot**: `size-2 rounded-full` — compact, non-intrusive.

---

## Copywriting Contract (Phase 8 — locked strings)

| Element | Copy |
|---------|------|
| KPI 1 label | Matières premières en stock |
| KPI 1 sub-label | `{N} lots actifs` |
| KPI 1 alert badge | `{X} DLC <3j` |
| KPI 2 label | Broches en stock |
| KPI 2 sub-label | `{X} kg total` |
| KPI 3 label | Production cette semaine |
| KPI 3 sub-label | `{N} broches produites` |
| KPI 4 label | Livraisons cette semaine |
| KPI 4 sub-label | `{N} broches livrées` |
| Alertes column heading | Alertes |
| Alertes empty — heading | Tout va bien |
| Alertes empty — body | Aucune alerte en cours. |
| Activity column heading | Activité récente |
| Activity empty — heading | Aucune activité |
| Activity empty — body | Réceptionnez un lot ou créez une livraison pour voir l'activité ici. |
| DLC-near alert template | `Lot {numeroLotFournisseur} ({nom}) — DLC dans {N}j` |
| Low-stock alert template | `Lot {numeroLotFournisseur} ({nom}) — {quantiteRestante} kg restants` |
| Stale-broche alert template | `Broche {numeroLotInterne} en stock depuis {N}j` |
| Reception activity template | `Réception — {rm.nom} ({rm.fournisseur})` |
| Production activity template | `Production — {order.nombreBroches} broche(s) ({recipe.nom})` |
| Livraison activity template | `Livraison — {delivery.brochesLivrees.length} broche(s) → {customer.nom}` |

---

## Empty States (all screens)

| State | Icon | Heading | Body |
|-------|------|---------|------|
| Alertes — no alerts | `ShieldCheck` | Tout va bien | Aucune alerte en cours. |
| Activity — no events | `Activity` | Aucune activité | Réceptionnez un lot ou créez une livraison pour voir l'activité ici. |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS — formal French B2B, all phase-specific strings declared, no emojis in UI, KPI labels match locked decisions, alert and activity templates are complete.
- [ ] Dimension 2 Visuals: PASS — Linear-inspired sober SaaS, KPI grid uses responsive 1→2→4 column layout, column cards reuse bordered surface established in prior phases, severity dots are semantic (red/amber).
- [ ] Dimension 3 Color: PASS — only one new semantic color context: red alert badge (`bg-red-100 text-red-700 border-red-200`), consistent with DLC alert patterns in Phases 3-7. Severity dot `bg-red-500`/`bg-amber-400` are utility colors not new tokens.
- [ ] Dimension 4 Typography: PASS — new KPI role `text-3xl font-bold` (value), `text-xs uppercase tracking-wide` (label). Both are additive and do not conflict with prior roles.
- [ ] Dimension 5 Spacing: PASS — `p-5` card padding (prior phases), `mb-6` KPI row separation, `gap-4` grid gap (prior phases), `py-2`/`py-2.5` list row rhythm.
- [ ] Dimension 6 Registry Safety: PASS — one new shadcn primitive (`card`) declared; no new npm packages; all lucide icons are from existing lucide-react dependency.

**Approval:** pending

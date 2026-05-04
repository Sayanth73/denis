---
phase: 3
slug: matieres-premieres-screen
status: draft
shadcn_initialized: true
preset: inherits 01-UI-SPEC.md (New York, neutral, CSS variables)
created: 2026-05-04
inherits: 01-UI-SPEC.md
---

# Phase 3 — UI Design Contract: Matières Premières Screen

> Phase 3 inherits **every token, color, type role, spacing token, and copy convention from `01-UI-SPEC.md`**. This file declares only the net-new contract for `/matieres-premieres`: sortable table layout, reception dialog dimensions, form layout, the concrete `<DlcBadge>`, and the reusable `<EmptyState>`.

> Phase 3 is the **first real screen** in TraceKebab — its patterns (sortable table, reception dialog, DlcBadge, EmptyState, DatePicker, Combobox) are inherited by Phases 4 (production), 5 (livraisons), 6 (clients), and 7 (traçabilité).

---

## Phase 3 — Components Installed

shadcn components added in this phase (declared in 01-UI-SPEC.md as "later phases", installed here): `table`, `dialog`, `input`, `select`, `label`, `form`, `badge`, `calendar`, `popover`, `command`. All from shadcn official registry — no third-party blocks. Registry safety gate not required (official baseline).

---

## Page Layout — `/matieres-premieres`

Replaces the Phase 1 placeholder. Single-column layout inside the inherited shell main content area (`px-6 py-6`).

```
┌────────────────────────────────────────────────────────────────┐
│ (header: "Matières premières" — owned by global Phase 1 header)│
├────────────────────────────────────────────────────────────────┤
│  Page-header row (flex justify-between, mb-6, h-9)             │
│                              ┌─────────────────────────────┐   │
│  (no subtitle)               │ + Réceptionner un lot       │   │
│                              └─────────────────────────────┘   │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Raw materials table (rounded-md, border, bg-background)  │  │
│  │ — OR —                                                   │  │
│  │ <EmptyState> (dashed border, centered)                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

- Page-header row: `flex items-center justify-between mb-6`. The global `<Header />` from Phase 1 already owns the `<h1>`; no subtitle needed here.
- Below the header row: either the table OR the empty state, never both.

### Page-header CTA — "+ Réceptionner un lot"

Variant `default` (primary, accent blue), size `default` (`h-9 px-4 text-sm font-medium`), lucide `Plus` (`size=16 mr-2`), label `+ Réceptionner un lot`. The literal `+` glyph in the label is allowed and matches the Phase 1 inherited CTA list.

---

## Raw Materials Table

**Container:** `<div className="rounded-md border bg-background overflow-hidden">` wrapping `<Table>`. No outer shadow (per Phase 1 — tables are dense surfaces, cards are airy surfaces).

### Columns (exact order, exact widths)

PRD §5.3 fixes column order. Widths sum to 100 % of the ~992 px available main-content width and are set via `<colgroup>` percentages so the layout is stable.

| # | Header (FR) | Field | Width | Align | Cell content |
|---|-------------|-------|-------|-------|--------------|
| 1 | Type | `type` | 10 % | left | Capitalized label (`Bœuf`, `Agneau`, `Poulet`, `Épices`, `Marinade`, `Autre`), `text-sm` |
| 2 | Nom | `nom` | 22 % | left | `text-sm truncate` |
| 3 | Fournisseur | `fournisseur` | 18 % | left | `text-sm truncate` |
| 4 | N° lot fournisseur | `numeroLotFournisseur` | 16 % | left | `font-mono text-sm` (Phase 1 mono exception) |
| 5 | Quantité | `quantiteRestante / quantiteRecue` | 12 % | right | `text-sm tabular-nums`, format `{restante} / {recue} kg` |
| 6 | DLC | `dlc` | 12 % | left | `<DlcBadge value={dlc} />` |
| 7 | Statut | derived | 10 % | left | `<Badge>` — see Statut variants |

**Header row:** `bg-zinc-50` background, `<TableHead>` is `text-sm font-medium text-muted-foreground py-3 px-3`, border bottom `border-b border-border`. Each header is a `<button>` with the label + sort indicator at `gap-1`.

**Sort indicator (lucide):**
- Inactive column → `ChevronsUpDown` (`size=14 text-muted-foreground/60`).
- Active asc → `ChevronUp` (`size=14 text-foreground`).
- Active desc → `ChevronDown` (`size=14 text-foreground`).

Sort cycle on click: `none → asc → desc → asc → ...`. Only one column sorted at a time; clicking another column resets to `asc` on that column. Sort state held in `useState` in `<RawMaterialsTable />`, not persisted.

**Data row:** `border-b border-border hover:bg-zinc-50 min-h-9`. Rows are read-only display in Phase 3 (no row click, no selection, no focus state). Cells: `py-2 px-3 text-sm text-foreground` middle-aligned. `whitespace-nowrap` on columns 1, 4, 5, 6, 7. `truncate` allowed on columns 2, 3. No zebra striping — borders + hover are enough density per Phase 1.

### Statut column — derived states

Computed in `lib/raw-materials.ts` from `quantiteRestante` and `dlc` vs today.

| State | Condition | Tailwind classes | Label |
|-------|-----------|------------------|-------|
| `actif` | `quantiteRestante > 0` AND `dlc >= today` | `bg-emerald-100 text-emerald-800 border-emerald-200` | Actif |
| `epuise` | `quantiteRestante <= 0` | `bg-zinc-100 text-zinc-600 border-zinc-200` | Épuisé |
| `dlc_depassee` | `dlc < today` | `bg-red-100 text-red-800 border-red-200` | DLC dépassée |

Precedence: `dlc_depassee` is checked first (an expired lot is "DLC dépassée" even if quantity is 0), then `epuise`, then `actif`. Badge wrapper shape matches DlcBadge: `inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium`. Statut tokens reuse the locked Phase 1 semantic palette — these are not net-new colors, they are the second usage of the alert/status budget.

---

## `<DlcBadge value={isoDate} />` — concrete spec

**Location:** `components/dlc-badge.tsx`. **Reusable across Phases 5, 6, 7.**

```ts
type DlcBadgeProps = { value: string; className?: string };
```

Calls `dlcColor(value, new Date())` from `lib/dlc.ts`, renders a span with the bucket-specific classes below. Always shows the date in **`JJ.MM.AAAA`** format (Swiss French — Phase 1 inherited rule).

| Bucket | Wrapper classes (locked, exact Tailwind) |
|--------|------------------------------------------|
| `green` (> 5 days) | `inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium bg-emerald-100 text-emerald-800 border-emerald-200` |
| `orange` (2–5 days) | `inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium bg-amber-100 text-amber-800 border-amber-200` |
| `red` (< 2 days, valid) | `inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium bg-red-100 text-red-800 border-red-200` |
| `grey` (expired) | `inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium bg-zinc-100 text-zinc-600 border-zinc-200` |

Content: `{formattedDate}` only — no icon prefix, no tooltip. **No phase may inline DLC color classes anywhere else** (locked Phase 1 rule).

---

## Reception Dialog

### Dimensions

| Property | Value | Tailwind |
|----------|-------|----------|
| Width | 560 px (fixed) | `sm:max-w-[560px]` |
| Max height | 90 vh | `max-h-[90vh]` |
| Body padding | 24 px | `p-6` (shadcn default) |
| Body scroll | overflow-y auto | `overflow-y-auto` on form wrapper |
| Backdrop | shadcn default `bg-black/50` | inherited |

**Why 560 px?** Nine fields, single column, label-above-field. At 560 px the two date pickers fit side-by-side comfortably (~248 px each with `gap-4`). 540 px crowds them; 640 px wastes space. 560 px is `35 rem` — even Tailwind multiple.

### Layout

```
┌──────────────────────────────────────────────────────┐
│ Réceptionner un lot                              ✕   │ ← DialogHeader
│ Renseignez les informations du lot reçu.             │ ← DialogDescription (text-muted-foreground)
├──────────────────────────────────────────────────────┤
│  (form body — single column, space-y-4)              │
├──────────────────────────────────────────────────────┤
│              [ Annuler ]  [ Réceptionner le lot ]    │ ← DialogFooter
└──────────────────────────────────────────────────────┘
```

| Slot | Component | Copy | Style |
|------|-----------|------|-------|
| Title | `<DialogTitle>` | `Réceptionner un lot` | `text-xl font-semibold` (Heading role) |
| Description | `<DialogDescription>` | `Renseignez les informations du lot reçu.` | `text-sm text-muted-foreground` |
| Cancel | `<Button variant="outline">` | `Annuler` | secondary |
| Submit | `<Button>` (primary) | `Réceptionner le lot` | accent, anchored right |

### Form Layout

Single column, label above field, validation message below field, `space-y-4` between rows. The two date pickers (Date de réception + DLC) sit side-by-side in a 2-column grid (`grid grid-cols-2 gap-4`) to keep vertical compactness.

| # | Field | Component | Required | Placeholder | Validation message |
|---|-------|-----------|----------|-------------|--------------------|
| 1 | Type | `<Select>` | yes | `Sélectionnez un type` | `Sélectionnez un type` |
| 2 | Nom | `<Input type="text">` | yes (≥3 chars) | `ex. Épaule de bœuf désossée` | `Champ requis` (empty) / `Le nom doit contenir au moins 3 caractères` |
| 3 | Fournisseur | `<Combobox>` | yes | `Sélectionnez ou saisissez un fournisseur` | `Champ requis` |
| 4 | N° lot fournisseur | `<Input className="font-mono">` | yes | `ex. BM-2026-0471` | `Champ requis` |
| 5 | Quantité reçue (kg) | `<Input type="number" step="0.1" min="0">` | yes (`> 0`) | `0` | `La quantité doit être supérieure à zéro` |
| 6a | Date de réception | `<DatePicker>` | yes (`<= today`) | `JJ.MM.AAAA` | `La date de réception ne peut pas être dans le futur` (default: today) |
| 6b | DLC | `<DatePicker>` | yes (`> dateReception`) | `JJ.MM.AAAA` | `La DLC doit être postérieure à la date de réception.` |
| 7 | Température (°C) | `<Input type="number" step="0.1">` | yes (any number, incl. 0/negative) | `0` | `Champ requis` |
| 8 | Certificat sanitaire | `<Input type="text">` | no | `ex. CS-2026-0471` | none |

Type select options: `Bœuf`, `Agneau`, `Poulet`, `Épices`, `Marinade`, `Autre` (display labels) — stored as the lowercase union literals from `lib/types.ts`. Mapping in `lib/raw-materials.ts` as `TYPE_LABELS: Record<RawMaterial["type"], string>`.

### Field component conventions

- `<Label>`: `text-sm font-medium text-foreground mb-2`. Required indicator: append a literal ` *` to the label text — do not style it red (red is reserved for the validation message slot).
- Input height: shadcn default `h-9` (36 px). Border `border-border`. Focus ring: shadcn default.
- Validation slot: directly below input, `text-xs text-destructive mt-1.5`. **No reserved space** when no error — the `space-y-4` row gap handles spacing; small error-induced reflow is acceptable. Pre-reserving height for nine fields would add ~150 px of empty whitespace.
- react-hook-form mode: `mode: "onBlur"` + `reValidateMode: "onChange"` (don't yell while typing; instant feedback while fixing).

### `<DatePicker />` (custom — `components/ui/date-picker.tsx`)

Built from shadcn `<Popover>` + `<Calendar>`. **Reusable in Phases 4, 5.**

- Trigger: `<Button variant="outline" className="w-full justify-start font-normal h-9">` showing the formatted date or the placeholder. Lucide `CalendarIcon` (`size=16 ml-auto`).
- Unset: shows placeholder `JJ.MM.AAAA` in `text-muted-foreground`. Set: shows the date in `JJ.MM.AAAA` in `text-foreground`.
- Popover: `<Calendar mode="single" />`, `align="start" sideOffset={4}`, `p-0` on `PopoverContent`. Locale `fr` (`date-fns/locale/fr`) — week starts Monday, French month names.
- DLC picker: `disabled={(d) => d <= dateReception}`. Date de réception picker: `disabled={(d) => d > today}`.

### `<Combobox />` (custom — `components/ui/combobox.tsx`)

Built from shadcn `<Popover>` + `<Command>`. **Reusable in Phases 5, 6.**

- Trigger: same shape as DatePicker (`<Button variant="outline" className="w-full justify-start font-normal h-9">`), lucide `ChevronsUpDown` (`size=16 ml-auto`).
- Popover content width matches trigger: `PopoverContent w-[var(--radix-popover-trigger-width)] p-0`.
- `<Command>` slots: `<CommandInput placeholder="Rechercher un fournisseur..." />`, `<CommandList>`, `<CommandEmpty>Aucun fournisseur — la valeur saisie sera enregistrée comme nouveau fournisseur.</CommandEmpty>`, `<CommandGroup>` listing existing supplier names (deduped, sorted alphabetically) from `getSupplierOptions(rawMaterials)`. The user may pick an existing supplier OR keep typing — on submit, the typed value (even if unmatched) is the field value.

---

## Empty State — `<EmptyState />`

**Location:** `components/empty-state.tsx`. **Reusable across Phases 5, 6, 7, 8.**

```ts
type EmptyStateProps = {
  icon: LucideIcon;
  heading: string;
  body: string;
  cta?: { label: string; onClick: () => void; icon?: LucideIcon };
};
```

**Composition** (vertical stack, centered):

```
                ┌──────────────────────────┐
                │         [icon]           │ ← lucide, size=48, text-muted-foreground
                │                          │
                │      {heading}           │ ← text-xl font-semibold text-foreground
                │      {body}              │ ← text-sm text-muted-foreground max-w-md text-center
                │                          │
                │      [ {ctaLabel} ]      │ ← primary CTA (optional)
                └──────────────────────────┘
```

**Layout classes:**
- Outer: `flex flex-col items-center justify-center text-center py-16 px-4 border border-dashed border-border rounded-md bg-background`. Dashed border + neutral background distinguishes a placeholder slot from a real data surface (no `shadow-sm`, no solid border).
- Icon: `size=48 text-muted-foreground mb-4`.
- Heading: `text-xl font-semibold text-foreground mb-2`.
- Body: `text-sm text-muted-foreground max-w-md`, `mb-6` if CTA present, else `mb-0`.
- CTA: primary button, same spec as the page-header CTA.

### Phase 3 instance

| Slot | Value |
|------|-------|
| `icon` | lucide `Package` (matches sidebar nav icon for `/matieres-premieres`) |
| `heading` | `Aucune matière première en stock` |
| `body` | `Réceptionnez votre premier lot pour commencer le suivi.` |
| `cta.label` | `+ Réceptionner un lot` |
| `cta.icon` | lucide `Plus` (`size=16 mr-2`) |
| `cta.onClick` | Same handler as page-header CTA — opens reception dialog |

**Note on copy:** CONTEXT.md proposed `Réceptionnez votre premier lot pour démarrer.`; Phase 1 §Inherited copy contract already locked `Réceptionnez votre premier lot pour commencer le suivi.` (more explicit about the value — *suivi* = traceability follow-up). We use the locked Phase 1 form.

---

## Toasts (sonner)

| Trigger | Toast | Variant |
|---------|-------|---------|
| Successful reception submit | `Lot réceptionné — {nom} ({fournisseur})` | `toast.success` |

Phase 1 inherited contract listed `Lot réceptionné`; CONTEXT.md §specifics expanded it to interpolate `{nom}` and `{fournisseur}`. We adopt the CONTEXT.md form — still concise, and the extra context is genuinely useful when several reception toasts surface in quick succession during the demo. Phase-3 enrichment of an inherited string, not a contradiction.

No error toast in Phase 3 — form validation handles all user errors inline; the store mutation is synchronous and cannot fail. No destructive actions (no edit, no delete — out of scope per CONTEXT.md), so no `<AlertDialog>`.

---

## Component Inventory (Phase 3 net-new)

| Component | Path | Type | Purpose |
|-----------|------|------|---------|
| `<MatieresPremieresPage />` | `app/matieres-premieres/page.tsx` | Client | Route page; reads store, renders header CTA + table OR empty state, owns dialog `open` state |
| `<RawMaterialsTable />` | `components/matieres/raw-materials-table.tsx` | Client | Sortable table; sort state in `useState` |
| `<ReceptionDialog />` | `components/matieres/reception-dialog.tsx` | Client | Dialog + form; controlled `open` prop; zod schema co-located |
| `<DlcBadge />` | `components/dlc-badge.tsx` | Client | Reusable DLC badge — first usage |
| `<EmptyState />` | `components/empty-state.tsx` | Server | Reusable empty-state — first usage |
| `<DatePicker />` | `components/ui/date-picker.tsx` | Client | Reusable Popover + Calendar with `fr` locale |
| `<Combobox />` | `components/ui/combobox.tsx` | Client | Reusable Popover + Command autocomplete |
| `lib/raw-materials.ts` | `lib/raw-materials.ts` | n/a | `deriveStatut(rm, today)`, `getSupplierOptions(rms)`, `formatDate(iso)` (JJ.MM.AAAA), `compareForSort(col, dir)`, `TYPE_LABELS` |

All files ≤ 300 lines per PRD §10. Largest: `<ReceptionDialog />` (~250 lines including zod schema, 9 form fields, submit handler).

---

## Copywriting Contract (Phase 3 — strings not in Phase 1 inherited contract)

| Element | Copy |
|---------|------|
| Reception dialog title | Réceptionner un lot |
| Reception dialog description | Renseignez les informations du lot reçu. |
| Reception dialog cancel | Annuler |
| Reception dialog submit | Réceptionner le lot |
| Field label — Type | Type |
| Field label — Nom | Nom |
| Field label — Fournisseur | Fournisseur |
| Field label — N° lot fournisseur | N° lot fournisseur |
| Field label — Quantité reçue | Quantité reçue (kg) |
| Field label — Date de réception | Date de réception |
| Field label — DLC | DLC |
| Field label — Température | Température de réception (°C) |
| Field label — Certificat sanitaire | Certificat sanitaire |
| Type select empty option | Sélectionnez un type |
| Type option labels | Bœuf / Agneau / Poulet / Épices / Marinade / Autre |
| Combobox placeholder | Sélectionnez ou saisissez un fournisseur |
| Combobox search placeholder | Rechercher un fournisseur... |
| Combobox empty result | Aucun fournisseur — la valeur saisie sera enregistrée comme nouveau fournisseur. |
| DatePicker placeholder | JJ.MM.AAAA |
| Validation — required | Champ requis |
| Validation — type select | Sélectionnez un type |
| Validation — nom too short | Le nom doit contenir au moins 3 caractères |
| Validation — quantité ≤ 0 | La quantité doit être supérieure à zéro |
| Validation — réception > today | La date de réception ne peut pas être dans le futur |
| Validation — DLC ≤ réception | La DLC doit être postérieure à la date de réception. |
| Statut — actif | Actif |
| Statut — épuisé | Épuisé |
| Statut — DLC dépassée | DLC dépassée |
| Toast on reception | Lot réceptionné — {nom} ({fournisseur}) |
| Empty-state heading | Aucune matière première en stock |
| Empty-state body | Réceptionnez votre premier lot pour commencer le suivi. |

---

## Density & Visual Rhythm (Phase 3 specifics)

- **Table is the dense surface; dialog is the airy surface.** Table cells `py-2 px-3` (PRD §7), dialog `p-6`, form `space-y-4` rows.
- **No card around the table** — its bordered container (`rounded-md border bg-background`) is the surface. A `<Card>` wrapper would double the border + add unnecessary padding.
- **No section divider above the page-header CTA row** — the global header's `border-b` already separates page chrome from page content.
- **Empty state has dashed border** (`border-dashed`) to visually distinguish "no data" from "real data surface". Locked rule for all `<EmptyState />` instances across Phases 3–8.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official (`ui.shadcn.com`) | `table`, `dialog`, `input`, `select`, `label`, `form`, `badge`, `calendar`, `popover`, `command` | not required — official baseline |

No third-party blocks.

---

## Inheritance Note for Later Phases

Phases 4–9 inherit from Phase 3 (in addition to Phase 1):

- `<DlcBadge />` is locked. Reuse as-is.
- `<EmptyState />` is locked. Reuse with phase-specific icon / heading / body / CTA.
- `<DatePicker />` and `<Combobox />` UI primitives are locked. Reuse for any date / autocomplete need.
- Sortable table pattern (header click toggles asc/desc, lucide chevron indicator, sort state in `useState`) is locked. Phases 4 (production orders), 5 (livraisons), 6 (clients) reuse it.
- Dialog form pattern (560 px width, single column, label-above-field, validation slot below, footer Annuler / primary-action) is locked. Phases 5 and 6 reuse it.
- Page-header CTA layout (`flex justify-between`, primary CTA flush right, `mb-6` to body) is locked.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS — formal French B2B, all phase-specific strings declared, no emojis, validation messages match Phase 1 conventions.
- [ ] Dimension 2 Visuals: PASS — sober B2B SaaS, no decorative elements, dashed-border empty state distinguishes placeholder from data.
- [ ] Dimension 3 Color: PASS — no net-new colors; reuses Phase 1 semantic palette for DLC + statut; accent reserved to primary CTA only.
- [ ] Dimension 4 Typography: PASS — only inherited 4 sizes × 2 weights; `font-mono` exception scoped to lot numbers per Phase 1.
- [ ] Dimension 5 Spacing: PASS — `space-y-4` form rows, `mb-6` page-header gap, `p-6` dialog body, table density `py-2 px-3` per Phase 1.
- [ ] Dimension 6 Registry Safety: PASS — only shadcn official, no third-party.

**Approval:** pending

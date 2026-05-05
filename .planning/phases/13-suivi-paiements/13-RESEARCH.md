# Phase 13: Suivi des paiements — Research

**Researched:** 2026-05-05
**Domain:** TypeScript / Zustand / Next.js App Router — payment lifecycle extension to existing Facture domain
**Confidence:** HIGH (all findings verified directly from codebase)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Add `paiement: { statut: "en_attente" | "payee_livraison" | "payee_virement"; datePaiement?: string }` to `Facture` in `lib/types.ts`.
- **D-02:** Existing localStorage factures (store v2) get `paiement: { statut: "en_attente" }` via migration v2→v3 in `lib/store.ts`. Bump `version` to 3.
- **D-03:** Add `updateFacture(id, patch)` to store (missing — only `addFacture`/`deleteFacture` exist).
- **D-04:** Payment buttons only on `/factures/[id]` detail, under totals footer, in a "Paiement" section.
- **D-05:** Two buttons: "Payé à la livraison" (outline + green) and "Virement reçu" (outline + blue). Disappear once paid.
- **D-06:** No confirmation dialog.
- **D-07:** `datePaiement = new Date().toISOString().slice(0, 10)`. Toast: "Facture [N°] marquée comme payée".
- **D-08:** Once paid, show status badge + datePaiement (no buttons).
- **D-09:** "En retard" = `statut === "en_attente"` AND `daysSince(dateFacture) > settings.delaiPaiementJours`.
- **D-10:** Pure helper `isFactureEnRetard(facture, settings, today): boolean` in `lib/factures.ts`.
- **D-11:** List sorted: en retard first, then en attente, then payées (stable sort, no filter chips).
- **D-12:** Inline badge "En retard" (orange) in new "Statut paiement" column on list.
- **D-13:** Replace KpiCard "Livraisons cette semaine" with "Factures impayées".
- **D-14:** Main value = total TTC pending formatted "1 245.00 CHF"; sub-label = "X en retard" red if > 0 else "Toutes à jour" green.
- **D-15:** `href="/factures"` on this KpiCard.
- **D-16:** New functions in `lib/dashboard.ts`: `sumFacturesEnAttente(factures): number` and `countFacturesEnRetard(factures, settings, today): number`.
- **D-17:** Add `delaiPaiementJours: number` (default 30) to `AppSettings` in `lib/types.ts`.
- **D-18:** Numeric field in `/parametres` under IBAN (label: "Délai de paiement (jours)"). Validation: positive integer ≤ 365.
- **D-19:** Migration v2→v3 initialises `settings.delaiPaiementJours = 30`.

### Claude's Discretion
- Badge colours: use inline classes (not shadcn Badge component) matching the delivery badge pattern:
  - `payee_livraison` / `payee_virement`: `bg-emerald-50 border-emerald-200 text-emerald-800`
  - `en_attente`: `bg-zinc-50 border-zinc-200 text-zinc-700`
  - "En retard": `bg-orange-50 border-orange-200 text-orange-800`
- Exact list labels: "En attente", "Payée livraison", "Virement reçu", "En retard".
- 300-line budget: if `/factures/[id]` exceeds 300 lines after additions, extract payment section into `components/factures/paiement-section.tsx`.

### Deferred Ideas (OUT OF SCOPE)
- Relances email automatiques
- Paiement partiel / acompte
- Export comptable CSV des factures payées
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-v3-suivi-paiements | Add payment lifecycle to Facture: 3 statuts, overdue detection, dashboard KPI, configurable delay | All decisions map to verified codebase extension points — types, store, helpers, UI pages |
</phase_requirements>

---

## Summary

Phase 13 extends the existing Facture domain (introduced in Phase 12) with a payment lifecycle. The codebase is in a clean, consistent state: all patterns are established and the phase is a direct extension of existing code, not a new architectural layer.

The store is currently at `version: 2`. The v1→v2 migration added `settings: DEFAULT_SETTINGS`. The v2→v3 migration for this phase must (a) add `paiement: { statut: "en_attente" }` to every existing `Facture` in the persisted array and (b) add `delaiPaiementJours: 30` to the persisted `settings` object. The pattern is identical to the v1→v2 migration.

The `/factures/[id]` detail page is currently 229 lines. Adding the payment section inline will bring it to approximately 270–285 lines — within the 300-line budget, so no component extraction is required. The `/factures` list page is 118 lines with significant room for the new column and sort logic.

**Primary recommendation:** Implement in one plan (13-01), touching 7 files in sequence: types → store → factures helpers → dashboard helpers → factures list page → factures detail page → parametres page.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Payment status type (`paiement` field) | Shared types (`lib/types.ts`) | — | Domain type, consumed by all layers |
| Store migration v2→v3 | Zustand persist (`lib/store.ts`) | — | Migrations run inside persist middleware |
| `updateFacture` action | Zustand store (`lib/store.ts`) | — | All other entity updates live here; consistency |
| `isFactureEnRetard` helper | Pure helpers (`lib/factures.ts`) | — | No React, no store — pure function, testable |
| `sumFacturesEnAttente`, `countFacturesEnRetard` | Pure helpers (`lib/dashboard.ts`) | — | Pattern: all KPI maths live in dashboard.ts |
| Payment buttons / status badge | Client component (`app/factures/[id]/page.tsx`) | `components/factures/paiement-section.tsx` (if > 300 lines) | UI action stays close to the data it mutates |
| List sort + "Statut paiement" column | Client component (`app/factures/page.tsx`) | — | Inline sort in the page is established pattern |
| "Factures impayées" KPI card | Dashboard page (`app/page.tsx`) | — | KPI card replacement, same slot as current card 4 |
| `delaiPaiementJours` settings field | Parametres page (`app/parametres/page.tsx`) | — | All settings edits live here |

---

## Codebase State — Exact Current Shape

### `lib/types.ts` (99 lines) [VERIFIED: read from disk]

Current `Facture` type (lines 81–91):
```typescript
export type Facture = {
  id: string;
  numeroFacture: string;
  livraisonId: string;
  clientId: string;
  dateFacture: string;
  lignes: FactureLigne[];
  totalHT: number;
  tva: number;
  totalTTC: number;
};
```

Current `AppSettings` type (lines 94–99):
```typescript
export type AppSettings = {
  iban: string;
  nomCreancier: string;
  adresseLigne1: string;
  adresseLigne2: string;
};
```

**Required additions:**
- To `Facture`: add `paiement: { statut: "en_attente" | "payee_livraison" | "payee_virement"; datePaiement?: string }` field.
- To `AppSettings`: add `delaiPaiementJours: number` field.

---

### `lib/store.ts` (263 lines) [VERIFIED: read from disk]

**Migration pattern — v1→v2 (lines 219–228):**
```typescript
migrate: (persistedState, version) => {
  const state = persistedState as Record<string, unknown>;
  if (version === 1) {
    // v1 → v2 : ajout du champ settings
    return { ...state, settings: DEFAULT_SETTINGS } as TraceabilityStore;
  }
  if (version === 2) {
    return persistedState as TraceabilityStore;
  }
  // Version inconnue → undefined → seedIfEmpty() réamorce
  return undefined;
},
```

**Current `version`: 2** (line 218).

**`partialize` (lines 233–242) — explicit field listing, no spread:**
```typescript
partialize: (state) => ({
  rawMaterials: state.rawMaterials,
  recipes: state.recipes,
  productionOrders: state.productionOrders,
  finishedProducts: state.finishedProducts,
  customers: state.customers,
  deliveries: state.deliveries,
  factures: state.factures,
  settings: state.settings,
}),
```

**Existing facture actions (lines 165–167):**
```typescript
addFacture: (f) => set((s) => ({ factures: [...s.factures, f] })),
deleteFacture: (id) =>
  set((s) => ({ factures: s.factures.filter((x) => x.id !== id) })),
```

`updateFacture` is ABSENT. The TraceabilityActions type lists it as missing (confirmed: `addFacture` and `deleteFacture` are declared, no `updateFacture`).

**`DEFAULT_SETTINGS` (lines 87–92) — needs `delaiPaiementJours: 30` added:**
```typescript
const DEFAULT_SETTINGS: AppSettings = {
  iban: "",
  nomCreancier: "TraceKebab Sàrl",
  adresseLigne1: "",
  adresseLigne2: "",
};
```

**Migration v2→v3 must:**
1. Map over `state.factures` to add `paiement: { statut: "en_attente" }` to each facture that lacks it.
2. Merge `delaiPaiementJours: 30` into `state.settings`.
3. Change `version: 2` to `version: 3`.
4. Change the `if (version === 2)` branch from a passthrough to the migration body.
5. Add a new `if (version === 3) { return persistedState as TraceabilityStore; }` passthrough.

**`seedIfEmpty` (lines 172–191)** — seed produces `factures: [] as Facture[]`, so seed data needs no migration (empty array). However, seeded factures created after this phase must include the `paiement` field. The `buildSeed()` function in `lib/seed.ts` currently returns `factures: []`, so no change to seed is needed.

---

### `lib/factures.ts` (58 lines) [VERIFIED: read from disk]

Currently exports only:
- `generateFactureNumber(date, sequence): string`
- `buildQrBillPayload(iban, nomCreancier, adresseLigne1, adresseLigne2, amount): string`

**Required additions:**
1. `STATUT_PAIEMENT_LABELS` — record mapping statut union to French display strings.
2. `STATUT_PAIEMENT_CLASSES` — record mapping statut union to Tailwind badge classes.
3. `isFactureEnRetard(facture, settings, today): boolean` — pure helper.

After additions, `lib/factures.ts` will be approximately 90 lines — well within budget.

---

### `lib/dashboard.ts` (274 lines) [VERIFIED: read from disk]

Currently imports from `lib/types.ts`: `RawMaterial`, `FinishedProduct`, `Delivery`, `ProductionOrder`, `Customer`, `Recipe`. Does NOT import `Facture` or `AppSettings`.

**Required additions:**
1. Import `Facture` and `AppSettings` from `./types`.
2. `sumFacturesEnAttente(factures: Facture[]): number` — sum `totalTTC` where `paiement.statut === "en_attente"`.
3. `countFacturesEnRetard(factures: Facture[], settings: AppSettings, today: Date): number` — count where `isFactureEnRetard(f, settings, today)`.

`lib/dashboard.ts` will grow from 274 to approximately 300 lines after additions. This is at the budget boundary. To stay safe, the two new functions should be concise (4–6 lines each).

---

### `app/factures/page.tsx` (118 lines) [VERIFIED: read from disk]

Current sort: `[...factures].reverse()` (line 27) — insertion order reversed.

Current columns (7 colgroup `<col>` entries): N° facture, Client, Date, Nb broches, Total HT, TVA, Total TTC.

**Required changes:**
1. Subscribe to `settings` from the store (for `isFactureEnRetard`).
2. Replace the simple `.reverse()` sort with 3-tier sort (see Sort Logic section).
3. Rename colgroup to 8 columns — add "Statut paiement" column.
4. Add "Statut paiement" `<TableHead>` and `<TableCell>` rendering the badge.
5. Import `isFactureEnRetard`, `STATUT_PAIEMENT_LABELS`, `STATUT_PAIEMENT_CLASSES` from `lib/factures`.

After additions, the file will be approximately 165–175 lines — within budget.

---

### `app/factures/[id]/page.tsx` (229 lines) [VERIFIED: read from disk]

Current structure:
- Lines 1–20: imports
- Lines 21–34: component setup, hydration guard
- Lines 36–51: facture lookup, client lookup, QR payload
- Lines 52–66: screen action bar (print button)
- Lines 68–226: printable region (company header, client block, lignes table, totals footer, QR-bill section / placeholder)

**Required changes:**
1. Add `updateFacture` subscription from store.
2. Add payment handler functions `handlePayerLivraison()` and `handleVirementRecu()`.
3. Add "Paiement" section AFTER the totals footer block (line ~175), BEFORE the QR-bill section.
4. The "Paiement" section shows:
   - If `facture.paiement.statut === "en_attente"`: two buttons (with `print:hidden` class — don't appear on PDF).
   - If paid: a badge + date string, plus the "En retard" badge if applicable.
5. Import `isFactureEnRetard`, `STATUT_PAIEMENT_LABELS`, `STATUT_PAIEMENT_CLASSES` from `lib/factures`.

**Line count projection:** 229 + ~55 lines for the payment section = ~284 lines. Within the 300-line budget — no component extraction required. However, if the implementer prefers extraction for clarity, `components/factures/paiement-section.tsx` is the agreed extraction target.

---

### `app/page.tsx` (99 lines) [VERIFIED: read from disk]

**KPI card 4 — currently "Livraisons cette semaine" (lines 85–89):**
```tsx
<KpiCard
  label="Livraisons cette semaine"
  value={deliveriesThisWeek}
  subLabel={`${brochesLivreesThisWeek} broches livrées`}
/>
```

**Required changes:**
1. Subscribe to `factures` and `settings` from the store.
2. Import `sumFacturesEnAttente` and `countFacturesEnRetard` from `lib/dashboard`.
3. Compute `totalEnAttente` and `enRetardCount`.
4. Replace KPI card 4 with the "Factures impayées" card.
5. Remove imports for `countDeliveriesThisWeek` and `countBrochesLivreesThisWeek` if they become unused (they will be — no other card uses them).

**KPI card 4 replacement:**
```tsx
<KpiCard
  label="Factures impayées"
  value={totalEnAttente === 0 ? "0.00 CHF" : formatTTC(totalEnAttente)}
  subLabel={enRetardCount > 0 ? `${enRetardCount} en retard` : "Toutes à jour"}
  alert={enRetardCount > 0 ? `${enRetardCount} en retard` : undefined}
  href="/factures"
/>
```

Note: `KpiCard.alert` renders a red badge. D-14 specifies sub-label in red when > 0, green when 0. The `alert` prop covers the red case. For the green "Toutes à jour" sub-label, the existing `subLabel` prop renders as `text-muted-foreground` (neutral). If the green colour is strictly required, it must be inline in the dashboard page (not via KpiCard props, which don't support colour variants on subLabel). **Resolution:** Use `alert` for the red badge and accept that "Toutes à jour" is muted-foreground — OR inject a custom coloured span by making `subLabel` accept `React.ReactNode`. The simplest approach consistent with the existing KpiCard API is: pass `alert` only when `enRetardCount > 0`; subLabel is always the text string; green colour can be achieved by passing a JSX element as `subLabel` if KpiCard's type allows `React.ReactNode` (currently typed as `string` — would need widening to `React.ReactNode`).

**Decision needed at planning time:** Either (a) keep `subLabel: string` and accept muted colour for "Toutes à jour", or (b) widen `KpiCard.subLabel` to `React.ReactNode`. Option (a) is consistent with existing cards. Option (b) requires a one-line type change. The CONTEXT.md does not lock this — it is Claude's discretion. **Recommended:** Option (a) — keep subLabel as string, use `alert` prop for the red count badge. "Toutes à jour" in muted-foreground is sufficient for the demo.

---

### `app/parametres/page.tsx` (138 lines) [VERIFIED: read from disk]

Current Zod schema (lines 21–26):
```typescript
const settingsSchema = z.object({
  iban: z.string().max(34, "IBAN trop long").optional().or(z.literal("")),
  nomCreancier: z.string().max(70, "Maximum 70 caractères"),
  adresseLigne1: z.string().max(70, "Maximum 70 caractères").optional().or(z.literal("")),
  adresseLigne2: z.string().max(70, "Maximum 70 caractères (NPA + ville)").optional().or(z.literal("")),
});
```

**Required Zod extension:**
```typescript
delaiPaiementJours: z.coerce.number()
  .int("Doit être un entier")
  .min(1, "Minimum 1 jour")
  .max(365, "Maximum 365 jours"),
```

Note: `z.coerce.number()` is required because HTML `<input type="number">` delivers its value as a string to react-hook-form, but coercion converts it to a number before Zod validation. Without coerce, Zod's `z.number()` would fail on string input.

**`onSubmit` must include:** `delaiPaiementJours: values.delaiPaiementJours` in the `updateSettings` call.

**`form` `values` must include:** `delaiPaiementJours: settings.delaiPaiementJours`.

After additions the file will be approximately 160–165 lines — within budget.

---

## Standard Stack

### Core (all already installed) [VERIFIED: package.json]

| Library | Version | Purpose |
|---------|---------|---------|
| zustand | ^5.0.12 | Store with persist middleware — migration pattern already established |
| zod | ^4.4.3 | Schema validation for settings form |
| react-hook-form | ^7.75.0 | Form state for parametres |
| @hookform/resolvers | ^5.2.2 | zodResolver already used in parametres |
| sonner | ^2.0.7 | Toast on payment marking — `toast.success()` |
| date-fns | ^4.1.0 | Available but NOT needed for `isFactureEnRetard` (plain Date arithmetic is simpler and avoids an import) |

No new dependencies required for this phase.

---

## Architecture Patterns

### Badge Pattern (from `lib/deliveries.ts`) [VERIFIED: read from disk]

The badge shape is a fixed inline class string, NOT the shadcn `Badge` component:

```tsx
<span
  className={cn(
    "inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium",
    STATUT_PAIEMENT_CLASSES[facture.paiement.statut]
  )}
>
  {STATUT_PAIEMENT_LABELS[facture.paiement.statut]}
</span>
```

Constants to add to `lib/factures.ts`:

```typescript
// Source: VERIFIED from lib/deliveries.ts badge pattern
export const STATUT_PAIEMENT_LABELS: Record<
  "en_attente" | "payee_livraison" | "payee_virement",
  string
> = {
  en_attente:      "En attente",
  payee_livraison: "Payée livraison",
  payee_virement:  "Virement reçu",
};

export const STATUT_PAIEMENT_CLASSES: Record<
  "en_attente" | "payee_livraison" | "payee_virement",
  string
> = {
  en_attente:      "bg-zinc-50 border-zinc-200 text-zinc-700",
  payee_livraison: "bg-emerald-50 border-emerald-200 text-emerald-800",
  payee_virement:  "bg-emerald-50 border-emerald-200 text-emerald-800",
};

export const CLASSE_EN_RETARD = "bg-orange-50 border-orange-200 text-orange-800";
```

The "En retard" badge is rendered separately (inline, not part of the statut map) because it is an overlay condition on top of `en_attente`.

---

### Store Update Pattern (from existing `updateX` actions) [VERIFIED: lib/store.ts]

```typescript
updateFacture: (id, patch) =>
  set((s) => ({
    factures: s.factures.map((x) => (x.id === id ? { ...x, ...patch } : x)),
  })),
```

The `patch` type is `Partial<Facture>`. Since `Facture.paiement` is a nested object, callers pass the full replacement for the field:

```typescript
updateFacture(facture.id, {
  paiement: { statut: "payee_livraison", datePaiement: new Date().toISOString().slice(0, 10) },
});
```

The spread `{ ...x, ...patch }` replaces `paiement` wholesale (correct — no deep merge needed).

---

### Sort Logic for Factures List [ASSUMED based on JS sort semantics]

Three-tier sort: en retard (0) < en attente (1) < payées (2). Implemented with a rank function:

```typescript
// Source: [ASSUMED] — standard JS sort pattern
function paiementRank(f: Facture, settings: AppSettings, today: Date): number {
  if (isFactureEnRetard(f, settings, today)) return 0;
  if (f.paiement.statut === "en_attente") return 1;
  return 2;
}

const sorted = [...factures].sort(
  (a, b) => paiementRank(a, settings, today) - paiementRank(b, settings, today)
);
```

This is a stable sort in all modern JS engines (V8, SpiderMonkey guarantee stability for Array.prototype.sort since ES2019). Within each tier, the original insertion order is preserved (stable).

The sort replaces the current `[...factures].reverse()` on line 27 of `app/factures/page.tsx`.

---

### `isFactureEnRetard` Helper [VERIFIED: logic derived from D-09/D-10]

```typescript
// Source: VERIFIED decision D-09/D-10 from CONTEXT.md
export function isFactureEnRetard(
  facture: Facture,
  settings: AppSettings,
  today: Date,
): boolean {
  if (facture.paiement.statut !== "en_attente") return false;
  const factureMs = new Date(
    `${facture.dateFacture.slice(0, 10)}T00:00:00.000Z`,
  ).getTime();
  const todayMs = new Date(
    `${today.toISOString().slice(0, 10)}T00:00:00.000Z`,
  ).getTime();
  const daysSince = Math.floor((todayMs - factureMs) / 86_400_000);
  return daysSince > settings.delaiPaiementJours;
}
```

**Edge cases:**
- `dateFacture` is always `YYYY-MM-DD` (set by `buildFacture` via `new Date().toISOString().slice(0, 10)`) — slice to 10 is defensive but safe.
- Normalising both dates to `T00:00:00.000Z` eliminates timezone ambiguity — matches the pattern used throughout `lib/dashboard.ts`.
- `daysSince > delaiPaiementJours` (strict greater-than): a facture on exactly day 30 is NOT yet en retard; day 31 is. This matches D-09 ("non payée après N jours").
- `today` is injected as a parameter for testability (matches `countAlertingDLCs`, `countProducedThisWeek` patterns in `lib/dashboard.ts`).
- No `date-fns` import required — arithmetic is simpler and avoids a dependency.

---

### Dashboard KPI Functions [VERIFIED: pattern from lib/dashboard.ts]

```typescript
// Source: VERIFIED pattern from lib/dashboard.ts countActiveRMs etc.
export function sumFacturesEnAttente(factures: Facture[]): number {
  return factures
    .filter((f) => f.paiement.statut === "en_attente")
    .reduce((sum, f) => sum + f.totalTTC, 0);
}

export function countFacturesEnRetard(
  factures: Facture[],
  settings: AppSettings,
  today: Date,
): number {
  return factures.filter((f) => isFactureEnRetard(f, settings, today)).length;
}
```

`countFacturesEnRetard` must import `isFactureEnRetard` from `lib/factures`. Since `lib/dashboard.ts` and `lib/factures.ts` are both pure helper files with no circular dependencies, this import is clean.

**TTC formatting for KPI card value:**

```typescript
// Inline in app/page.tsx — not a shared helper
const totalEnAttente = sumFacturesEnAttente(factures);
const value = totalEnAttente.toLocaleString("fr-CH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}) + " CHF";
```

`fr-CH` locale uses thin space as thousands separator, producing "1 245.00 CHF" matching D-14. Note: `toLocaleString` uses the browser's locale engine — in Node.js test environments this may not produce the expected separator. For tests, format manually or avoid formatting in the helper (format in the component instead).

---

### Zod Schema Extension for Parametres [VERIFIED: existing schema in app/parametres/page.tsx]

**New field addition to `settingsSchema`:**

```typescript
delaiPaiementJours: z.coerce.number()
  .int("Doit être un entier")
  .min(1, "Minimum 1 jour")
  .max(365, "Maximum 365 jours"),
```

**Key:** `z.coerce.number()` — not `z.number()`. The `coerce` variant handles the string-to-number conversion that react-hook-form performs with `<input type="number">`.

**`FormValues` type** is derived via `z.infer<typeof settingsSchema>` — no manual type update needed.

**`onSubmit` addition:**
```typescript
updateSettings({
  iban: values.iban ?? "",
  nomCreancier: values.nomCreancier,
  adresseLigne1: values.adresseLigne1 ?? "",
  adresseLigne2: values.adresseLigne2 ?? "",
  delaiPaiementJours: values.delaiPaiementJours,  // ADD
});
```

**Form `values` addition:**
```typescript
values: {
  iban: settings.iban,
  nomCreancier: settings.nomCreancier,
  adresseLigne1: settings.adresseLigne1,
  adresseLigne2: settings.adresseLigne2,
  delaiPaiementJours: settings.delaiPaiementJours,  // ADD
},
```

---

### Migration v2→v3 Pattern [VERIFIED: v1→v2 in lib/store.ts]

The v1→v2 migration (line 221–223) is the canonical template:

```typescript
if (version === 1) {
  return { ...state, settings: DEFAULT_SETTINGS } as TraceabilityStore;
}
```

The v2→v3 migration follows the same structure but must handle the nested `factures` array and the nested `settings` object:

```typescript
if (version === 2) {
  // v2 → v3: add paiement field to all existing factures; add delaiPaiementJours to settings
  const factures = Array.isArray(state.factures)
    ? (state.factures as Facture[]).map((f) =>
        f.paiement ? f : { ...f, paiement: { statut: "en_attente" as const } }
      )
    : [];
  const settings = {
    ...(state.settings as AppSettings),
    delaiPaiementJours: 30,
  };
  return { ...state, factures, settings } as TraceabilityStore;
}
if (version === 3) {
  return persistedState as TraceabilityStore;
}
```

The `f.paiement ? f : { ...f, paiement: ... }` guard is idempotent — safe if migration runs twice (unlikely but defensive).

---

## Files to Modify — Exhaustive List

| File | Current Lines | Change Summary | Estimated Lines After |
|------|--------------|----------------|-----------------------|
| `lib/types.ts` | 99 | Add `paiement` field to `Facture`; add `delaiPaiementJours` to `AppSettings` | ~107 |
| `lib/store.ts` | 263 | Add `updateFacture`; update `DEFAULT_SETTINGS`; bump version 2→3; add v2→v3 migration; add v3 passthrough | ~285 |
| `lib/factures.ts` | 58 | Add `STATUT_PAIEMENT_LABELS`, `STATUT_PAIEMENT_CLASSES`, `CLASSE_EN_RETARD`, `isFactureEnRetard` | ~90 |
| `lib/dashboard.ts` | 274 | Add imports for `Facture`, `AppSettings`, `isFactureEnRetard`; add `sumFacturesEnAttente`, `countFacturesEnRetard` | ~298 |
| `app/factures/page.tsx` | 118 | Subscribe to `settings`; replace sort; add "Statut paiement" column with badges | ~170 |
| `app/factures/[id]/page.tsx` | 229 | Subscribe to `updateFacture`; add payment handlers; add payment section after totals | ~284 |
| `app/page.tsx` | 99 | Subscribe to `factures`, `settings`; import new KPI functions; replace KPI card 4 | ~115 |
| `app/parametres/page.tsx` | 138 | Extend Zod schema; add form field; add to onSubmit | ~165 |

**Files NOT modified:** `lib/facture-builder.ts`, `lib/seed.ts` (seed returns empty factures array — seeded factures created after this phase will include `paiement` via the type change, but the seed itself doesn't create factures).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Date arithmetic for daysSince | Custom date parser | Plain `Date.getTime()` arithmetic with `Math.floor` (same pattern as `lib/dashboard.ts`) |
| Toast on payment | Custom notification | `toast.success()` from `sonner` (already used throughout) |
| Form validation for `delaiPaiementJours` | Custom input validation | `z.coerce.number().int().min(1).max(365)` in Zod schema |
| Store persistence/migration | Custom localStorage logic | Zustand `persist` middleware with `migrate` function — already established |

---

## Common Pitfalls

### Pitfall 1: Seed data not updated when type changes
**What goes wrong:** `buildSeed()` returns `factures: [] as Facture[]` — this is a type assertion that will fail TypeScript compilation after the `paiement` field becomes required on `Facture`.
**Why it happens:** The `Facture` type now requires `paiement`, but the seed returns an empty array with a type assertion. The empty array itself is fine, but if any seed factures are added in future, they'll lack the field.
**How to avoid:** After adding `paiement` to `Facture`, verify `lib/seed.ts` still compiles (`tsc --noEmit`). The empty array case will compile fine. No seed change needed now.
**Warning signs:** TypeScript error `Type '{}[]' is not assignable to type 'Facture[]'` in seed.ts.

### Pitfall 2: Migration runs on already-migrated data
**What goes wrong:** If the migration is not idempotent, running it twice corrupts data.
**Why it happens:** Zustand persist increments version atomically, so double-run shouldn't occur — but defensive coding is warranted.
**How to avoid:** Use the `f.paiement ? f : { ...f, paiement: ... }` guard in the migration.

### Pitfall 3: `z.number()` instead of `z.coerce.number()` for the numeric input
**What goes wrong:** Zod validates the value as a string and throws a type error, preventing form submission.
**Why it happens:** `<input type="number">` still passes its value to react-hook-form as a string.
**How to avoid:** Always use `z.coerce.number()` for numeric HTML inputs.

### Pitfall 4: `today` not normalised to midnight UTC in `isFactureEnRetard`
**What goes wrong:** Depending on timezone and time of day, `daysSince` fluctuates by 1 day.
**Why it happens:** `new Date()` includes time component; arithmetic without normalisation gives fractional days.
**How to avoid:** Normalise both `factureMs` and `todayMs` to `T00:00:00.000Z` — exactly as done in `countAlertingDLCs` in `lib/dashboard.ts`.

### Pitfall 5: Payment buttons appear in print/PDF
**What goes wrong:** The buttons render on the printed facture, which looks unprofessional.
**Why it happens:** The payment section is inside the `printableRef` div.
**How to avoid:** Add `className="print:hidden"` to the buttons container. The status badge (for paid factures) may appear in print — this is acceptable and useful. Only the action buttons need `print:hidden`.

### Pitfall 6: `lib/dashboard.ts` exceeds 300 lines
**What goes wrong:** DEC-file-size-cap is violated.
**Why it happens:** Adding imports + 2 new functions pushes the file to ~298 lines — close to the edge. If any comment verbosity is added, it crosses 300.
**How to avoid:** Keep the two new functions terse (4–6 lines each, no block comments beyond a single JSDoc line).

---

## Environment Availability

Step 2.6: SKIPPED — no external dependencies. This phase is pure code and localStorage changes. No CLI tools, databases, or services beyond Next.js dev server are required.

---

## Validation Architecture

`workflow.nyquist_validation` is not set in `.planning/config.json` (only `skip_discuss` is set). Treated as enabled.

### Test Framework
No test framework is installed in the project. `package.json` has no test script, no `jest`, no `vitest`, no `playwright`. The `scripts` object contains only `dev`, `build`, `start`, `lint`.

| Property | Value |
|----------|-------|
| Framework | None installed |
| Config file | None |
| Quick run command | `npx tsc --noEmit` (type-checking as proxy) |
| Full suite command | `npm run build` (Next.js build as integration check) |

### Phase Requirements → Test Map

| Req | Behavior | Test Type | Command | Notes |
|-----|----------|-----------|---------|-------|
| D-10 | `isFactureEnRetard` returns correct boolean | unit | Manual: node -e inline or vitest if added | No test file exists |
| D-16 | `sumFacturesEnAttente` sums only en_attente factures | unit | Same | No test file exists |
| D-16 | `countFacturesEnRetard` counts correctly | unit | Same | No test file exists |
| D-11 | Sort places en retard first, then en attente, then payées | unit | Same | No test file exists |
| D-02/D-19 | Migration v2→v3 produces correct shape | integration | `npm run build` | Exercised on next load |
| D-03 | `updateFacture` updates correct record | integration | Manual browser test | No test file |

### Wave 0 Gaps
- [ ] No test infrastructure exists. Installing vitest would allow unit testing `isFactureEnRetard`, `sumFacturesEnAttente`, `countFacturesEnRetard`, and sort logic — the four pure functions that are genuinely testable without a browser.
- [ ] If test coverage is not required: use `npx tsc --noEmit` as the pre-commit check and `npm run build` as the phase gate.

**Recommendation:** Given the project has no existing test infrastructure and the phase is adding pure functions, the build check (`npm run build`) is the pragmatic phase gate. Do not add a test framework as part of this phase — it is out of scope per CONTEXT.md deferred items spirit.

---

## Security Domain

This phase handles no authentication, no sensitive data beyond what already exists in the store, no external service calls, and no new input vectors beyond a bounded integer field (`delaiPaiementJours: 1–365`). The Zod validation on the numeric field covers the only input validation concern.

ASVS V5 (Input Validation) is satisfied by the Zod schema. No other ASVS categories apply.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | JS Array.prototype.sort is stable in the Next.js/Node.js environment (V8 >= 7.0) | Sort Logic | If sort were unstable, relative order within tiers would be unpredictable — low risk in practice since Next.js 14 uses Node.js 18+ |
| A2 | `toLocaleString("fr-CH")` produces thin space thousands separators in the browser | Dashboard KPI | If the client browser lacks fr-CH locale data, formatting may differ — acceptable risk for a demo app |
| A3 | `lib/seed.ts` does not need modification (empty factures array is valid) | Files to Modify | If seed is expected to produce seeded factures with payment status, the seed.ts analysis is wrong — verified by reading the file |

A3 is verified (not actually assumed) — seed returns `factures: []`. Included for completeness.

---

## Open Questions (RESOLVED)

1. **KpiCard subLabel colour for "Toutes à jour"**
   - What we know: D-14 says sub-label should be green when count is 0. Current `KpiCard` types `subLabel` as `string`, rendering as `text-muted-foreground`.
   - What's unclear: Is the green colour strictly required for the demo, or is muted-foreground acceptable?
   - RESOLVED: Accept muted-foreground for "Toutes à jour" (consistent with all other KPI cards). Use the `alert` prop only for the red badge when `enRetardCount > 0`. This avoids a KpiCard API change.

2. **Seed factures after reset**
   - What we know: `buildSeed()` returns `factures: []`. After `resetToSeed()`, no factures exist.
   - What's unclear: Should the seed include a pre-paid or in-progress facture to demo the payment flow immediately?
   - RESOLVED: Out of scope for this phase — the CONTEXT.md does not mention seed changes. A user can trigger the flow by marking a delivery as livré which auto-creates a facture.

---

## Sources

### Primary (HIGH confidence)
- `lib/types.ts` — read directly from disk — Facture, AppSettings current shape
- `lib/store.ts` — read directly from disk — migration pattern, version, partialize, existing facture actions
- `lib/factures.ts` — read directly from disk — existing exports
- `lib/dashboard.ts` — read directly from disk — KPI function pattern, date normalisation pattern
- `lib/deliveries.ts` — read directly from disk — STATUT_LIVRAISON_CLASSES badge pattern
- `app/factures/page.tsx` — read directly from disk — current list structure and sort
- `app/factures/[id]/page.tsx` — read directly from disk — current detail structure and line count
- `app/page.tsx` — read directly from disk — KPI card 4 current content
- `app/parametres/page.tsx` — read directly from disk — current Zod schema and form structure
- `components/dashboard/kpi-card.tsx` — read directly from disk — props signature
- `lib/seed.ts` — read directly from disk — factures field in seed output
- `lib/facture-builder.ts` — read directly from disk — buildFacture shape confirmation
- `package.json` — read directly from disk — dependency versions confirmed

### Secondary (MEDIUM confidence)
- Zod `z.coerce.number()` for HTML input — [ASSUMED from Zod v4 behaviour pattern; consistent with `zod: ^4.4.3` installed]

---

## Metadata

**Confidence breakdown:**
- Codebase state: HIGH — all files read directly
- Standard stack: HIGH — all packages verified in package.json
- Migration pattern: HIGH — v1→v2 pattern read directly from store.ts
- Badge pattern: HIGH — deliveries.ts read directly
- Sort logic: HIGH (pattern) / MEDIUM (stable sort claim) — standard JS ES2019+ guarantee
- isFactureEnRetard implementation: HIGH — mirrors exact date arithmetic from dashboard.ts
- Zod coerce pattern: MEDIUM — training knowledge, consistent with installed version

**Research date:** 2026-05-05
**Valid until:** 2026-06-05 (stable codebase, no external dependencies)

# Phase 13: Suivi des paiements - Pattern Map

**Mapped:** 2026-05-05
**Files analyzed:** 8 (all files to be modified)
**Analogs found:** 8 / 8

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `lib/types.ts` | model | — | `lib/types.ts` itself (extend Facture + AppSettings) | self |
| `lib/store.ts` | store | CRUD + migration | `lib/store.ts` — v1→v2 migration block, `updateDelivery` action | self (exact pattern) |
| `lib/factures.ts` | utility | transform | `lib/deliveries.ts` — STATUT_LIVRAISON_LABELS/CLASSES + pure helpers | exact role-match |
| `lib/dashboard.ts` | utility | transform | `lib/dashboard.ts` — countActiveRMs, countAlertingDLCs patterns | self (exact pattern) |
| `app/factures/page.tsx` | component (list page) | request-response | `app/factures/page.tsx` itself + deliveries table badge pattern | self + role-match |
| `app/factures/[id]/page.tsx` | component (detail page) | request-response | `app/factures/[id]/page.tsx` itself — add section after totals | self |
| `app/page.tsx` | component (dashboard) | request-response | `app/page.tsx` itself — KPI card slot replacement | self |
| `app/parametres/page.tsx` | component (settings form) | request-response | `app/parametres/page.tsx` itself — Zod schema + FormField extension | self |

---

## Pattern Assignments

### `lib/types.ts` (model)

**Analog:** `lib/types.ts` lines 81–99 (current Facture + AppSettings shapes)

**Current Facture shape** (lines 81–91) — extend by adding `paiement` after `totalTTC`:
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
  // ADD:
  paiement: {
    statut: "en_attente" | "payee_livraison" | "payee_virement";
    datePaiement?: string; // YYYY-MM-DD, set at moment of marking
  };
};
```

**Current AppSettings shape** (lines 94–99) — extend by adding `delaiPaiementJours` after `adresseLigne2`:
```typescript
export type AppSettings = {
  iban: string;
  nomCreancier: string;
  adresseLigne1: string;
  adresseLigne2: string;
  // ADD:
  delaiPaiementJours: number; // default 30
};
```

**Convention:** French field names, union literals as string unions, optional marked with `?`. No changes to field order of existing fields.

---

### `lib/store.ts` (store, CRUD + migration)

**Analog:** `lib/store.ts` — existing `updateDelivery` (lines 158–162), `addFacture`/`deleteFacture` (lines 165–167), migration block (lines 219–231), `DEFAULT_SETTINGS` (lines 87–92), `partialize` (lines 233–242).

**updateX action pattern** (lines 158–162) — copy exactly for `updateFacture`:
```typescript
updateDelivery: (id, patch) =>
  set((s) => ({
    deliveries: s.deliveries.map((x) => (x.id === id ? { ...x, ...patch } : x)),
  })),
```

Apply identically:
```typescript
// Add after deleteFacture (line 167) in the Factures section
updateFacture: (id, patch) =>
  set((s) => ({
    factures: s.factures.map((x) => (x.id === id ? { ...x, ...patch } : x)),
  })),
```

The `patch` is `Partial<Facture>`. Since `paiement` is a nested object, callers pass the full replacement:
```typescript
updateFacture(facture.id, {
  paiement: { statut: "payee_livraison", datePaiement: new Date().toISOString().slice(0, 10) },
});
```

**`updateFacture` must also be declared in `TraceabilityActions`** (lines 41–83), after `deleteFacture`:
```typescript
// Factures
addFacture: (f: Facture) => void;
deleteFacture: (id: string) => void;
updateFacture: (id: string, patch: Partial<Facture>) => void; // ADD
```

**DEFAULT_SETTINGS** (lines 87–92) — add `delaiPaiementJours: 30`:
```typescript
const DEFAULT_SETTINGS: AppSettings = {
  iban: "",
  nomCreancier: "TraceKebab Sàrl",
  adresseLigne1: "",
  adresseLigne2: "",
  delaiPaiementJours: 30, // ADD
};
```

**Migration pattern** (lines 219–231) — v1→v2 is the template:
```typescript
// Current v1→v2 (lines 221–223) — template to follow:
if (version === 1) {
  return { ...state, settings: DEFAULT_SETTINGS } as TraceabilityStore;
}
if (version === 2) {
  return persistedState as TraceabilityStore; // currently a passthrough — REPLACE with migration body
}
```

Replace the `version === 2` passthrough branch with the migration body, and add a new `version === 3` passthrough:
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

Also bump `version: 2` to `version: 3` (line 217).

**`partialize`** (lines 233–242) — no change needed; `factures` and `settings` are already listed explicitly. No spread — each field is listed by name. Convention must be maintained.

---

### `lib/factures.ts` (utility, transform)

**Analog:** `lib/deliveries.ts` lines 13–26 (STATUT_LIVRAISON_LABELS / STATUT_LIVRAISON_CLASSES)

**Badge constant pattern from `lib/deliveries.ts`** (lines 13–26):
```typescript
export const STATUT_LIVRAISON_LABELS: Record<Delivery["statut"], string> = {
  preparee: "Préparée",
  livree:   "Livrée",
};

export const STATUT_LIVRAISON_CLASSES: Record<Delivery["statut"], string> = {
  preparee: "bg-amber-50 border-amber-200 text-amber-800",
  livree:   "bg-emerald-50 border-emerald-200 text-emerald-800",
};
```

Copy this pattern exactly into `lib/factures.ts` for payment statuts:
```typescript
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

// Separate constant for the "En retard" overlay badge (not part of statut map)
export const CLASSE_EN_RETARD = "bg-orange-50 border-orange-200 text-orange-800";
```

**`isFactureEnRetard` helper** — date normalisation pattern from `lib/dashboard.ts` lines 43–51 (`countAlertingDLCs`):
```typescript
// Pattern from countAlertingDLCs (lib/dashboard.ts lines 43-45):
const todayMs = new Date(
  `${today.toISOString().slice(0, 10)}T00:00:00.000Z`,
).getTime();
```

Apply to `isFactureEnRetard`:
```typescript
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

Imports needed at top of `lib/factures.ts`:
```typescript
import type { Facture, AppSettings } from "./types";
```

---

### `lib/dashboard.ts` (utility, transform)

**Analog:** `lib/dashboard.ts` — `countActiveRMs` (lines 29–31), `countAlertingDLCs` (lines 38–52) as the pattern for new KPI functions.

**Existing short KPI function pattern** (lines 29–31):
```typescript
export function countActiveRMs(rms: RawMaterial[]): number {
  return rms.filter((rm) => rm.quantiteRestante > 0).length;
}
```

**New functions to add** — follow the same terse 4–6 line shape (important: file is currently 274 lines; keep additions minimal):
```typescript
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

**Import additions at top of `lib/dashboard.ts`** (lines 17–24 currently):
```typescript
// Existing imports (lines 17-24):
import type {
  RawMaterial,
  FinishedProduct,
  Delivery,
  ProductionOrder,
  Customer,
  Recipe,
} from "./types";

// ADD to this import block:
import type { Facture, AppSettings } from "./types";
// AND add cross-file import:
import { isFactureEnRetard } from "./factures";
```

Append new functions at the bottom of `lib/dashboard.ts` after the `formatRelativeDate` function (after line 274), under a new section comment:
```typescript
// ─── Factures KPI helpers ─────────────────────────────────────────────────────
```

---

### `app/factures/page.tsx` (component, request-response)

**Analog:** `app/factures/page.tsx` itself (lines 1–118) + badge rendering pattern from `components/livraisons/deliveries-table.tsx`.

**Current store subscription** (line 19–21) — add `settings`:
```typescript
// Currently:
const factures = useTraceabilityStore((s) => s.factures);
const customers = useTraceabilityStore((s) => s.customers);
const hasHydrated = useTraceabilityStore((s) => s.hasHydrated);

// Add:
const settings = useTraceabilityStore((s) => s.settings);
```

**Current sort** (line 27) — replace with 3-tier sort:
```typescript
// Currently:
const sorted = [...factures].reverse();

// Replace with:
const today = new Date();
function paiementRank(f: Facture): number {
  if (isFactureEnRetard(f, settings, today)) return 0;
  if (f.paiement.statut === "en_attente") return 1;
  return 2;
}
const sorted = [...factures].sort((a, b) => paiementRank(a) - paiementRank(b));
```

**New imports needed**:
```typescript
import { isFactureEnRetard, STATUT_PAIEMENT_LABELS, STATUT_PAIEMENT_CLASSES, CLASSE_EN_RETARD } from "@/lib/factures";
import type { Facture } from "@/lib/types";
import { cn } from "@/lib/utils";
```

**colgroup** (lines 42–50) — add 8th column for "Statut paiement" (currently 7 columns); reduce existing widths slightly to accommodate:
```typescript
// Add after the last <col>:
<col style={{ width: "14%" }} /> {/* Statut paiement */}
```

**New TableHead** (after last existing `<TableHead>` at line 73):
```tsx
<TableHead className="text-sm font-medium text-muted-foreground py-3 px-3 border-b border-border">
  Statut paiement
</TableHead>
```

**New TableCell badge** in the row map (after last `<TableCell>` at line 110):
```tsx
<TableCell className="py-2 px-3 text-sm">
  <span
    className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium",
      STATUT_PAIEMENT_CLASSES[f.paiement.statut],
    )}
  >
    {STATUT_PAIEMENT_LABELS[f.paiement.statut]}
  </span>
  {isFactureEnRetard(f, settings, today) && (
    <span
      className={cn(
        "ml-1 inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium",
        CLASSE_EN_RETARD,
      )}
    >
      En retard
    </span>
  )}
</TableCell>
```

**Badge rendering convention** — inline `<span>` with `cn(...)`, NOT the shadcn `<Badge>` component. This matches the delivery table badge pattern established in `components/livraisons/deliveries-table.tsx`.

---

### `app/factures/[id]/page.tsx` (component, request-response)

**Analog:** `app/factures/[id]/page.tsx` itself (229 lines). Payment section is inserted at line 175 (after the totals footer `</div>`, before the QR-bill section).

**Add store subscription** (after `settings` subscription on line 25):
```typescript
const updateFacture = useTraceabilityStore((s) => s.updateFacture);
```

**Payment handler functions** — add after QR payload computation (after line 50), before the `return` statement:
```typescript
function handlePayerLivraison() {
  updateFacture(facture.id, {
    paiement: { statut: "payee_livraison", datePaiement: new Date().toISOString().slice(0, 10) },
  });
  toast.success(`Facture ${facture.numeroFacture} marquée comme payée`);
}

function handleVirementRecu() {
  updateFacture(facture.id, {
    paiement: { statut: "payee_virement", datePaiement: new Date().toISOString().slice(0, 10) },
  });
  toast.success(`Facture ${facture.numeroFacture} marquée comme payée`);
}
```

**Toast import** — `toast` from `sonner` (already used in `app/parametres/page.tsx` line 7):
```typescript
import { toast } from "sonner";
```

**Payment section JSX** — insert after the closing `</div>` of the totals footer block (after line 174), before `{/* QR-bill section */}`:
```tsx
{/* Section paiement — boutons masqués à l'impression */}
<div className="print:hidden rounded-md border bg-background p-4">
  <p className="text-xs font-medium text-muted-foreground uppercase mb-3 tracking-wide">
    Paiement
  </p>
  {facture.paiement.statut === "en_attente" ? (
    <div className="flex gap-2 flex-wrap">
      <Button
        variant="outline"
        size="sm"
        className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
        onClick={handlePayerLivraison}
      >
        Payé à la livraison
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="border-blue-300 text-blue-700 hover:bg-blue-50"
        onClick={handleVirementRecu}
      >
        Virement reçu
      </Button>
    </div>
  ) : (
    <div className="flex items-center gap-2 flex-wrap">
      <span
        className={cn(
          "inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium",
          STATUT_PAIEMENT_CLASSES[facture.paiement.statut],
        )}
      >
        {STATUT_PAIEMENT_LABELS[facture.paiement.statut]}
      </span>
      {facture.paiement.datePaiement && (
        <span className="text-sm text-muted-foreground">
          le {formatDate(facture.paiement.datePaiement)}
        </span>
      )}
    </div>
  )}
</div>
```

**New imports needed**:
```typescript
import { toast } from "sonner";
import { buildQrBillPayload, isFactureEnRetard, STATUT_PAIEMENT_LABELS, STATUT_PAIEMENT_CLASSES } from "@/lib/factures";
import { cn } from "@/lib/utils";
```

**No confirmation dialog** (D-06) — no AlertDialog import needed. Handlers call directly.

**Button pattern** — `variant="outline"` with colour override via `className`. Same `<Button>` component used in the print action bar (line 62):
```tsx
// Existing print button pattern (line 62) — copy variant="outline" size="sm":
<Button variant="outline" size="sm" onClick={handlePrint}>
```

**Line count after additions:** ~284 lines — within the 300-line budget. No component extraction required.

---

### `app/page.tsx` (component, dashboard)

**Analog:** `app/page.tsx` lines 68–90 (KPI card grid) + `components/dashboard/kpi-card.tsx` (props signature).

**KpiCard props signature** (`components/dashboard/kpi-card.tsx` lines 4–9):
```typescript
type KpiCardProps = {
  label: string;
  value: string | number;
  subLabel: string;
  alert?: string; // rendered as red badge when truthy
  href?: string;  // when provided, wraps card in a Next.js Link
};
```

**Current KPI card 4** (lines 85–89) — replace entirely:
```tsx
// Current (REMOVE):
<KpiCard
  label="Livraisons cette semaine"
  value={deliveriesThisWeek}
  subLabel={`${brochesLivreesThisWeek} broches livrées`}
/>

// Replacement:
<KpiCard
  label="Factures impayées"
  value={totalEnAttente === 0 ? "0.00 CHF" : totalEnAttente.toLocaleString("fr-CH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " CHF"}
  subLabel={enRetardCount > 0 ? `${enRetardCount} en retard` : "Toutes à jour"}
  alert={enRetardCount > 0 ? `${enRetardCount} en retard` : undefined}
  href="/factures"
/>
```

**New store subscriptions** (add after `deliveries` on line 27):
```typescript
const factures = useTraceabilityStore((s) => s.factures);
const settings = useTraceabilityStore((s) => s.settings);
```

**New KPI computations** (add to the KPI values section after line 55):
```typescript
const totalEnAttente  = sumFacturesEnAttente(factures);
const enRetardCount   = countFacturesEnRetard(factures, settings, today);
```

**Import additions** to `@/lib/dashboard` import block (lines 10–19):
```typescript
import {
  // existing...
  sumFacturesEnAttente,
  countFacturesEnRetard,
} from "@/lib/dashboard";
```

**Remove unused imports** once `countDeliveriesThisWeek` and `countBrochesLivreesThisWeek` are no longer used by any card:
- Remove `countDeliveriesThisWeek` and `countBrochesLivreesThisWeek` from the `@/lib/dashboard` import.
- Remove `deliveriesThisWeek` and `brochesLivreesThisWeek` computed variables (lines 54–55).
- Keep `deliveries` store subscription only if it is still used elsewhere (it is used in `getRecentActivity` on line 59 — keep it).

---

### `app/parametres/page.tsx` (component, settings form)

**Analog:** `app/parametres/page.tsx` itself (138 lines) — extend the existing Zod schema and add a new `FormField`.

**Current Zod schema** (lines 21–26):
```typescript
const settingsSchema = z.object({
  iban: z.string().max(34, "IBAN trop long").optional().or(z.literal("")),
  nomCreancier: z.string().max(70, "Maximum 70 caractères"),
  adresseLigne1: z.string().max(70, "Maximum 70 caractères").optional().or(z.literal("")),
  adresseLigne2: z.string().max(70, "Maximum 70 caractères (NPA + ville)").optional().or(z.literal("")),
});
```

**Add `delaiPaiementJours` to schema** — use `z.coerce.number()` not `z.number()` (HTML `<input type="number">` passes string to react-hook-form):
```typescript
const settingsSchema = z.object({
  iban: z.string().max(34, "IBAN trop long").optional().or(z.literal("")),
  nomCreancier: z.string().max(70, "Maximum 70 caractères"),
  adresseLigne1: z.string().max(70, "Maximum 70 caractères").optional().or(z.literal("")),
  adresseLigne2: z.string().max(70, "Maximum 70 caractères (NPA + ville)").optional().or(z.literal("")),
  delaiPaiementJours: z.coerce.number()
    .int("Doit être un entier")
    .min(1, "Minimum 1 jour")
    .max(365, "Maximum 365 jours"),
});
```

**`FormValues` type** (line 28) — no manual change; derived from schema via `z.infer<typeof settingsSchema>`, so `delaiPaiementJours: number` is automatic.

**`form` values** (lines 38–43) — add `delaiPaiementJours`:
```typescript
values: {
  iban: settings.iban,
  nomCreancier: settings.nomCreancier,
  adresseLigne1: settings.adresseLigne1,
  adresseLigne2: settings.adresseLigne2,
  delaiPaiementJours: settings.delaiPaiementJours, // ADD
},
```

**`onSubmit`** (lines 47–53) — add `delaiPaiementJours`:
```typescript
function onSubmit(values: FormValues) {
  updateSettings({
    iban: values.iban ?? "",
    nomCreancier: values.nomCreancier,
    adresseLigne1: values.adresseLigne1 ?? "",
    adresseLigne2: values.adresseLigne2 ?? "",
    delaiPaiementJours: values.delaiPaiementJours, // ADD
  });
  toast.success("Paramètres enregistrés");
}
```

**New `FormField`** — copy from existing `adresseLigne2` field pattern (lines 119–131), place after the IBAN field (after line 103):
```tsx
<FormField
  control={form.control}
  name="delaiPaiementJours"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Délai de paiement (jours)</FormLabel>
      <FormControl>
        <Input
          type="number"
          min={1}
          max={365}
          placeholder="30"
          {...field}
        />
      </FormControl>
      <FormDescription>
        Nombre de jours après la date de facture avant qu&apos;elle soit considérée en retard.
      </FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

**`FormField` pattern** (lines 84–103 for the IBAN field) — copy the `<FormItem>` / `<FormControl>` / `<FormDescription>` / `<FormMessage>` structure exactly. No new component imports required (`Input`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, `FormMessage` are all already imported).

---

## Shared Patterns

### Badge Rendering (inline `<span>`, NOT shadcn `<Badge>`)
**Source:** `lib/deliveries.ts` lines 23–26 (STATUT_LIVRAISON_CLASSES), rendered inline in `components/livraisons/deliveries-table.tsx`
**Apply to:** `app/factures/page.tsx` (list column), `app/factures/[id]/page.tsx` (payment section)
```tsx
<span
  className={cn(
    "inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium",
    STATUT_PAIEMENT_CLASSES[facture.paiement.statut],
  )}
>
  {STATUT_PAIEMENT_LABELS[facture.paiement.statut]}
</span>
```

### Store `updateX` Action
**Source:** `lib/store.ts` lines 158–162 (`updateDelivery`)
**Apply to:** `lib/store.ts` (new `updateFacture`), `TraceabilityActions` type (new declaration)
```typescript
updateX: (id, patch) =>
  set((s) => ({
    xArray: s.xArray.map((x) => (x.id === id ? { ...x, ...patch } : x)),
  })),
```

### Date Normalisation to Midnight UTC
**Source:** `lib/dashboard.ts` lines 43–45 (`countAlertingDLCs`)
**Apply to:** `lib/factures.ts` (`isFactureEnRetard`)
```typescript
const todayMs = new Date(
  `${today.toISOString().slice(0, 10)}T00:00:00.000Z`,
).getTime();
```

### Toast Success
**Source:** `app/parametres/page.tsx` line 53 (`toast.success("Paramètres enregistrés")`)
**Apply to:** `app/factures/[id]/page.tsx` (payment handlers)
```typescript
import { toast } from "sonner";
// usage:
toast.success(`Facture ${facture.numeroFacture} marquée comme payée`);
```

### Zustand Store Subscription (one selector per line)
**Source:** `app/factures/[id]/page.tsx` lines 23–26
**Apply to:** All pages adding new subscriptions
```typescript
const factures  = useTraceabilityStore((s) => s.factures);
const customers = useTraceabilityStore((s) => s.customers);
const settings  = useTraceabilityStore((s) => s.settings);
const hasHydrated = useTraceabilityStore((s) => s.hasHydrated);
```

### Hydration Guard
**Source:** `app/factures/page.tsx` lines 23–25
**Apply to:** No new pages — already present in all files being modified
```typescript
if (!hasHydrated) {
  return <div className="h-9" />;
}
```

### Zod Schema (react-hook-form + zodResolver)
**Source:** `app/parametres/page.tsx` lines 21–26 (schema), 35–44 (form init)
**Apply to:** `app/parametres/page.tsx` extension only (no other form pages in this phase)

---

## No Analog Found

None — all files have close analogs in the existing codebase.

---

## Metadata

**Analog search scope:** `lib/`, `app/`, `components/dashboard/`
**Files read:** 10 (lib/types.ts, lib/store.ts, lib/factures.ts, lib/dashboard.ts, lib/deliveries.ts, app/factures/page.tsx, app/factures/[id]/page.tsx, app/page.tsx, app/parametres/page.tsx, components/dashboard/kpi-card.tsx)
**Pattern extraction date:** 2026-05-05

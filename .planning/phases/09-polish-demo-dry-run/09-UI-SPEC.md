---
phase: 9
slug: polish-demo-dry-run
status: approved
created: 2026-05-05
type: deferred-fixes-contract
inherits: 01-UI-SPEC.md
---

# Phase 9 — UI Deferred-Fixes Contract

> This is NOT a new-feature spec. It is a **deferred-fixes and audit contract** — a punch list of cross-cutting UX rules to enforce and specific deferred items from STATE.md to apply before the milestone closes. Every token in `01-UI-SPEC.md` remains locked. This spec only documents what is being fixed, where, and the observable criteria that prove it is fixed.

---

## 1. Cross-Cutting UX Rules to Enforce

These rules were declared in `01-UI-SPEC.md` and inherited by all phases. Phase 9 verifies compliance across the whole app and patches any drift.

### 1.1 DLC Color Coding (REQ-dlc-color-coding)

**Rule:** Wherever a DLC date is shown as a badge, color MUST reflect time-to-DLC via `<DlcBadge value={isoDate} />`. No phase may inline the DLC color classes (`bg-emerald-100`, `bg-amber-100`, `bg-red-100`, `bg-zinc-100`) outside of `DlcBadge` or `BUCKET_CLASSES` inside `lib/dlc.ts`.

**Audit target:** All `*.tsx` files in `app/` and `components/`. Exceptions (not violations):
- `components/dlc-badge.tsx` — the `BUCKET_CLASSES` record itself
- `components/dashboard/kpi-card.tsx` — the KPI alert badge uses `bg-red-100` for a non-DLC alert (DLC count alert, not a DLC badge display)
- `components/production/allocation-step.tsx` — amber/emerald classes render a "manquant" / "Complet" shortfall badge, not a DLC date; these are allocation-status indicators, not DLC badges, so they are exempt

**Fix criterion:** After audit, `grep -r "bg-emerald-100\|bg-amber-100\|bg-red-100" components/ app/` returns only the three known-exempt locations above, or zero unexpected hits.

**Verified screens:** matières premières table, dashboard DLC alerts, broches in livraisons, traçabilité downstream status.

### 1.2 Toasts on Every Mutation (REQ-toasts-on-mutations)

**Required toast calls (exhaustive list from `01-UI-SPEC.md` inherited copy contract):**

| Trigger | Component | Expected toast |
|---------|-----------|----------------|
| Receive raw material | `components/matieres/reception-dialog.tsx` | `toast.success("Lot réceptionné — ...")` |
| Create production order | `components/production/production-wizard.tsx` | `toast.success("Production confirmée — ...")` |
| Create delivery (préparée) | `components/livraisons/new-delivery-dialog.tsx` | `toast.success("Livraison préparée — ...")` |
| Mark delivery livrée | `components/livraisons/deliveries-table.tsx` | `toast.success("Livraison confirmée")` |
| Create client | `components/clients/client-dialog.tsx` | `toast.success("Client ajouté — ...")` |
| Edit client | `components/clients/client-dialog.tsx` | `toast.success("Client mis à jour — ...")` |
| Delete client | `components/clients/clients-table.tsx` | `toast.success("Client supprimé — ...")` |
| Reset démo | `components/layout/reset-button.tsx` | `toast.success("Données démo réinitialisées.")` |

**Audit method:** `grep -rn "toast\." app/ components/` lists all toast calls. Cross-reference each required trigger above. If any is missing, add it.

**Fix criterion:** Every row in the table above has a confirmed `toast.success(...)` call in the identified component.

### 1.3 Confirmations on Critical Actions (REQ-confirmations-on-critical-actions)

**Required confirmation gates:**

| Action | Component | Confirmation mechanism |
|--------|-----------|----------------------|
| Confirmer la production | `components/production/production-wizard.tsx` (step 3) | Récapitulatif step with explicit "Confirmer la production" primary button — no AlertDialog needed; step 3 itself is the gate |
| Marquer comme livrée | `components/livraisons/deliveries-table.tsx` | AlertDialog or explicit modal confirmation before status flip |
| Réinitialiser démo | `components/layout/reset-button.tsx` | `<AlertDialog>` with destructive confirm button |
| Supprimer un client | `components/clients/clients-table.tsx` | `<AlertDialog>` with destructive confirm button |

**Fix criterion:** Each action above has its confirmation gate confirmed present in the component. No destructive state mutation happens on a single unconfirmed click.

### 1.4 Empty States on Every List/Table (REQ-empty-states)

**Required `<EmptyState>` instances:**

| Route / Component | Empty condition | Heading (locked) | Body (locked) |
|-------------------|-----------------|------------------|---------------|
| `/matieres-premieres` | `rawMaterials.length === 0` | Aucune matière première en stock | Réceptionnez votre premier lot pour commencer le suivi. |
| `/production` — Ordres tab | `productionOrders.length === 0` | Aucun ordre de fabrication enregistré | Lancez votre premier ordre de fabrication depuis cette page. |
| `/livraisons` | `deliveries.length === 0` | Aucune livraison enregistrée | Préparez votre première livraison depuis cette page. |
| `/clients` | `customers.length === 0` | Aucun client enregistré | Ajoutez votre premier client restaurant. |
| `/tracabilite` (no result) | query returned nothing | Aucun lot trouvé pour ce numéro | Vérifiez le numéro saisi ou utilisez un des exemples ci-dessus. |
| Dashboard — Activité récente | `items.length === 0` | Aucune activité récente | (body per dashboard component) |
| Dashboard — Alertes | `items.length === 0` | Tout va bien | Aucune alerte en cours. |

**Fix criterion:** Each route/component listed above renders `<EmptyState>` (not a blank grid, not `null`) when its data array is empty.

### 1.5 No Pagination (REQ-no-pagination)

**Rule:** No pagination controls (`<Pagination>`, `next`/`prev` buttons linked to page state, `slice()` applied to limit displayed rows) may appear in any table or list.

**Fix criterion:** `grep -rn "pagination\|Pagination\|currentPage\|setPage" app/ components/` returns zero results (or only comments).

---

## 2. Deferred Items from STATE.md

Five specific items deferred from earlier phases. Each maps to exact code locations and precise CSS changes.

### D-01 — Reset Button Font Size (deferred from Phase 1/2)

**Problem:** `size="sm"` on the shadcn Button cascades `text-xs` (12px) onto the label, but the UI-SPEC locks button text at `text-sm` (14px, Label role).

**Location:** `components/layout/reset-button.tsx`, the `<Button variant="ghost" size="sm">` trigger.

**Fix:** Remove `size="sm"` from the `<AlertDialogTrigger asChild>` Button. The default (no `size` prop) renders `text-sm`. Alternatively, keep `size="sm"` and add an explicit `className="text-sm"` override — either approach is acceptable as long as the rendered label is 14px.

**Verify:** Button label "Réinitialiser démo" renders at 14px (`text-sm`) — no `text-xs` class present on the button or its children.

### D-02 — Sidebar Active Indicator (deferred from Phase 1)

**Problem:** The active pip is `top-1.5 bottom-1.5 rounded-full w-0.5`, which renders as a 24px-tall pill (the item is 36px tall; 36 - 6 - 6 = 24px). The UI-SPEC locks it as a **full-row 2px strip** with no `rounded-full`.

**Location:** `components/layout/nav-item.tsx`, the `<span aria-hidden="true">` active indicator.

**Current classes:** `absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-primary`

**Fix:** Replace with: `absolute left-0 top-0 bottom-0 w-0.5 bg-primary` — remove `top-1.5`, `bottom-1.5`, `rounded-full`; set `top-0 bottom-0`.

**Verify:** The active indicator strip spans the full height of the nav item row (36px), not the inner 24px pip.

### D-03 — Pressed-State Classes (deferred from Phase 1)

**Problem:** `active:bg-zinc-200` is missing on inactive sidebar nav items and ghost buttons. The UI-SPEC hover/focus/active table mandates `active: bg-zinc-200` for pressed state.

**Locations:**
- `components/layout/nav-item.tsx` — the `className` on the inactive branch of `cn(...)`: add `active:bg-zinc-200`
- `components/layout/reset-button.tsx` — the `<Button variant="ghost">` trigger: add `active:bg-zinc-200` to its className

**Fix:** Add `active:bg-zinc-200` to the appropriate `cn()` string in each location.

**Verify:** `grep -n "active:bg-zinc-200" components/layout/nav-item.tsx components/layout/reset-button.tsx` finds at least one match per file.

### D-04 — Minor CSS Drift (deferred from Phase 1)

Three sub-items:

**D-04a — `--destructive` HSL value:**
Current in `app/globals.css`: `--destructive: 0 84% 60%;` — this is brighter than red-600 (#DC2626).
UI-SPEC locks `--destructive` to `#DC2626` (red-600).
HSL for red-600: `0 72% 51%`.
**Fix:** Change `--destructive: 0 84% 60%;` → `--destructive: 0 72% 51%;` in `app/globals.css`.

**D-04b — Sonner shadow:**
Current in `components/ui/sonner.tsx`, toast classNames:
```
"group-[.toaster]:shadow-lg"
```
UI-SPEC locks dialog/popover layer to `shadow-md`. Toast is a popover-layer element.
**Fix:** Replace `shadow-lg` → `shadow-md` in the toast className string in `components/ui/sonner.tsx`.

**D-04c — Brand role in Typography table:**
This was a documentation gap flagged in STATE.md ("Brand role missing from §Typography table"). The UI-SPEC `01-UI-SPEC.md` already declares the brand row ("TraceKebab", `text-base font-semibold`) in the Layout section. No source file change required — this item is resolved by annotation only (note in SUMMARY).

**Verify D-04a:** `grep "destructive:" app/globals.css` shows `0 72% 51%`.
**Verify D-04b:** `grep "shadow" components/ui/sonner.tsx` shows `shadow-md`, not `shadow-lg`.

### D-05 — AlertDialog Dimension Drift (deferred from Phase 1/3/5/6)

**Problem:** The shadcn-generated `components/ui/alert-dialog.tsx` ships with:
- `AlertDialogTitle`: `text-lg font-semibold` (should be `text-xl font-semibold` per Heading role)
- `AlertDialogContent`: `sm:rounded-lg` (should be `rounded-md` per UI-SPEC border-radius rule)
- `AlertDialogContent`: `shadow-lg` (should be `shadow-md` per UI-SPEC shadow rule)

**Location:** `components/ui/alert-dialog.tsx`

**Fixes:**
1. `AlertDialogTitle`: `cn("text-lg font-semibold", ...)` → `cn("text-xl font-semibold", ...)`
2. `AlertDialogContent`: in the `cn(...)` string, replace `sm:rounded-lg` → `rounded-md` (also drop the `sm:` prefix — the UI-SPEC does not use responsive variants)
3. `AlertDialogContent`: replace `shadow-lg` → `shadow-md`

**Verify:** After fix:
- `grep "AlertDialogTitle" components/ui/alert-dialog.tsx` shows `text-xl`
- `grep "rounded" components/ui/alert-dialog.tsx` shows `rounded-md`, not `rounded-lg`
- `grep "shadow" components/ui/alert-dialog.tsx` shows `shadow-md`, not `shadow-lg`

Every AlertDialog rendered across phases 2, 3, 5, 6, 9 (reset-button, clients-table, deliveries-table) inherits these fixes automatically.

---

## 3. Demo Flow Walkthrough Script (§9 5-Step Flow)

For Plan 09-02 — the demo dry-run. Executor calls `resetToSeed()` first (to guarantee a clean slate), then walks each step verifying no blocker exists. Any blocker found in steps 1-5 must be fixed inline before marking the plan done.

### Pre-flight

```
1. Open browser to http://localhost:3000
2. Click "Réinitialiser démo" → confirm AlertDialog → toast "Données démo réinitialisées." appears
3. Confirm seed state: Dashboard shows 5 matières premières, 3 broches en stock, ≥ 1 livraison
```

### Step 1 — Réceptionner un lot de viande de bœuf

```
1. Navigate to /matieres-premieres
2. Click "+ Réceptionner un lot"
3. Fill form:
   - Type: boeuf
   - Nom: Épaule de bœuf test démo
   - Fournisseur: Boucherie Test SA
   - N° de lot fournisseur: BT-2026-DEMO
   - Quantité reçue: 100 kg
   - Date de réception: today
   - DLC: today + 8 days
   - Température de réception: 3
4. Click "Réceptionner"
5. Toast "Lot réceptionné — ..." appears ✓
6. New row appears in table with green DLC badge ✓
```

### Step 2 — Lancer un ordre de fabrication (4 broches, consommant le lot du Step 1)

```
1. Navigate to /production → tab "Ordres de fabrication"
2. Click "+ Nouvel ordre de fabrication"
3. Step 1 wizard: select "Broche standard 25 kg" recipe, set nombre de broches = 4
4. Step 2 wizard: allocate raw materials — include the "BT-2026-DEMO" lot for bœuf allocation
5. Step 3 wizard: verify récapitulatif shows 4 broches, "BT-2026-DEMO" lot consumed
6. Click "Confirmer la production"
7. Toast "Production confirmée — 4 broches (Broche standard 25 kg)" appears ✓
8. Production order appears in table ✓
9. Navigate to /matieres-premieres: BT-2026-DEMO quantité restante decremented ✓
```

### Step 3 — Livrer 2 broches à un client

```
1. Navigate to /livraisons
2. Click "+ Nouvelle livraison"
3. Select any client (e.g. "Kebab Royal Lausanne")
4. Set date de livraison: today
5. Multi-select 2 of the 4 newly produced broches (TK-lot numbers visible)
6. Click "Préparer la livraison" → toast "Livraison préparée — 2 broche(s)" ✓
7. Row appears in table with statut "Préparée"
8. Click "Marquer comme livrée" → AlertDialog appears → confirm
9. Toast "Livraison confirmée" ✓ — statut changes to "Livrée"
```

### Step 4 — Traçabilité search on supplier lot BT-2026-DEMO

```
1. Navigate to /tracabilite
2. Type "BT-2026-DEMO" in search bar (or paste)
3. Press "Rechercher"
4. Section 1 (Matière première): card shows BT-2026-DEMO details from Boucherie Test SA ✓
5. Section 2 (Ordres de fabrication): shows the production order from Step 2 ✓
6. Section 3 (Clients impactés): shows the client from Step 3 with broche lot numbers ✓
7. Visual chain fournisseur → production → client final is complete ✓
```

### Step 5 — Export PDF

```
1. From the traçabilité result view (BT-2026-DEMO search active)
2. Click "Exporter dossier traçabilité (PDF)"
3. Browser print dialog opens (window.print() / react-to-print) ✓
4. PDF preview shows the three-section dossier ✓
5. User can cancel (no need to actually print to paper for the dry-run) ✓
```

### Dry-Run Pass Criteria

All 5 steps completed without a blocking error. A "blocking error" is defined as:
- Any step that cannot be completed because a button is missing, a route throws, or a state mutation silently fails.
- A UI cosmetic imperfection (wrong font size, wrong shadow) is NOT a blocker — it is logged in SUMMARY as a known issue.

---

## 4. Checker Sign-Off Checklist (for Plan 09-02 human-verify)

- [ ] DLC color audit: no unexpected DLC color classes outside exempt locations
- [ ] Toast audit: all 8 required toast calls confirmed present
- [ ] Confirmation audit: all 4 critical actions gated
- [ ] Empty state audit: all 7 list/table empty states confirmed
- [ ] No pagination controls in any table
- [ ] D-01 reset button text-sm confirmed
- [ ] D-02 sidebar active indicator full-row strip confirmed
- [ ] D-03 pressed-state `active:bg-zinc-200` on nav items and ghost button confirmed
- [ ] D-04a `--destructive: 0 72% 51%` in globals.css confirmed
- [ ] D-04b sonner shadow-md confirmed
- [ ] D-05 AlertDialog text-xl / rounded-md / shadow-md confirmed
- [ ] §9 5-step demo flow completed without blocker
- [ ] `tsc --noEmit` exits 0
- [ ] `npm run build` exits 0

# Phase 2 — UI Review

**Audited:** 2026-05-04
**Baseline:** `02-UI-SPEC.md` (supplemental) + inherited `01-UI-SPEC.md`
**Screenshots:** not captured — dev server is up on `:3000` but Playwright browsers are not installed (`npx playwright install` required). Audit is code-only.
**Phase 2 surface:** the reset confirmation `AlertDialog` + success toast; Phase 1 placeholders unchanged.

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 4/4 | All five locked French strings byte-exact match `02-CONTEXT.md` and `02-UI-SPEC.md` |
| 2. Visuals | 4/4 | Composition matches spec: trigger preserves Phase 1 ghost styling; dialog uses shadcn `AlertDialog` primitives without customization |
| 3. Color | 4/4 | Confirm = `destructive` variant (red-600); Cancel = `outline` (neutral); no accent inside this dialog — matches Phase 1 reservation |
| 4. Typography | 3/4 | `AlertDialogTitle` ships `text-lg` (18px) from shadcn boilerplate, but Phase 2 §Typography maps it to Phase 1's Heading role (`text-xl` / 20px). `text-lg` is not in the Phase 1 4-size inventory |
| 5. Spacing | 3/4 | Footer `sm:space-x-2` and content `p-6` align with spec, but `AlertDialogContent` ships `sm:rounded-lg` (8px) and `shadow-lg`, while Phase 1 §Density locks dialogs to `rounded-md` (6px) and `shadow-md` |
| 6. Experience Design | 4/4 | Destructive confirmation primitive correctly chosen (`AlertDialog`, not `Dialog`); Esc/outside-click semantics inherited from Radix; `resetToSeed` wipes localStorage + reseeds + toasts |

**Overall: 22/24**

---

## Top 3 Priority Fixes

1. **`AlertDialogTitle` renders at 18px (`text-lg`), not the contract's 20px Heading (`text-xl`).** Visual hierarchy in the destructive dialog is one step quieter than every other Heading in the app. **Fix:** in `components/ui/alert-dialog.tsx:82`, change `"text-lg font-semibold"` → `"text-xl font-semibold leading-snug"` to match Phase 1 §Typography Heading role and the explicit Phase 2 mapping.
2. **`AlertDialogContent` uses `sm:rounded-lg` and `shadow-lg`, deviating from Phase 1 dialog density tokens (`rounded-md`, `shadow-md`).** Subtle but propagates inconsistency to every future destructive flow (delete client, etc.). **Fix:** in `components/ui/alert-dialog.tsx:39`, replace `shadow-lg` with `shadow-md` and `sm:rounded-lg` with `sm:rounded-md` (or drop the breakpoint since the app is desktop-only — `rounded-md`).
3. **No automated test or visual regression covers Esc / click-outside / focus-on-cancel behavior** for the destructive dialog. Spec says "verify, do not customize" Radix defaults — but nothing actually verifies. **Fix:** add a Playwright/RTL spec hitting `/`, opening the dialog via the header button, and asserting (a) Esc closes without firing `resetToSeed`, (b) outside-click is a no-op (Radix `AlertDialog` semantics), (c) initial focus lands on Cancel.

---

## Detailed Findings

### Pillar 1: Copywriting (4/4)

All five Phase 2 locked strings present and byte-exact (`components/layout/reset-button.tsx`):

| Element | Expected | Actual | Line |
|---------|----------|--------|------|
| Trigger label | `Réinitialiser démo` | `Réinitialiser démo` | 30 |
| Dialog title | `Réinitialiser les données démo ?` | `Réinitialiser les données démo ?` | 35 |
| Dialog body | `Cette action efface l'intégralité des données de démonstration et restaure le jeu de données initial. Cette opération est irréversible.` | matches (apostrophe encoded as `&apos;`, renders identically) | 37 |
| Cancel | `Annuler` | `Annuler` | 41 |
| Confirm | `Réinitialiser` | `Réinitialiser` | 46 |
| Success toast | `Données démo réinitialisées.` | `Données démo réinitialisées.` (terminal period present) | 22 |

Phase 1 stub copy `Disponible en Phase 2` correctly removed. No generic English labels (`Submit`, `OK`, `Cancel`) leaked into the surface — `Cancel` only appears as a shadcn primitive identifier (`AlertDialogCancel`), not as user copy.

### Pillar 2: Visuals (4/4)

- Trigger preserves Phase 1 surface: `<Button variant="ghost" size="sm" className="gap-2">` with `RotateCcw size={16}` icon — visual continuity intact (`reset-button.tsx:28-31`).
- Dialog uses Radix-backed shadcn primitives: `AlertDialog` / `Trigger` / `Content` / `Header` / `Title` / `Description` / `Footer` / `Cancel` / `Action`. No inline custom layout, matches the prescriptive composition in `02-UI-SPEC.md` lines 86–110.
- Icon paired with visible text label (no icon-only button — accessibility passes); `aria-hidden="true"` correctly applied to the `RotateCcw` glyph (`reset-button.tsx:29`).
- No decorative elements introduced — sober B2B aesthetic preserved.

### Pillar 3: Color (4/4)

- Confirm action: `className={buttonVariants({ variant: "destructive" })}` (`reset-button.tsx:43`) → resolves to `bg-destructive text-destructive-foreground` per `components/ui/button.tsx:14-15`. Matches Phase 1 destructive-token reservation (red-600).
- Cancel action: `AlertDialogCancel` defaults to `buttonVariants({ variant: "outline" })` (`alert-dialog.tsx:120`) → neutral, no accent. Correct.
- No `bg-primary` / `text-primary` / `border-primary` inside the dialog. Accent is reserved for creation/confirmation CTAs per Phase 1 §Color — destructive flows correctly excluded.
- No hardcoded hex / `rgb()` values in either audited file.

### Pillar 4: Typography (3/4) — WARNING

**Finding (justifies the score):** `components/ui/alert-dialog.tsx:82` defines `AlertDialogTitle` as `"text-lg font-semibold"` (18px). This is the unmodified shadcn boilerplate. However:

- Phase 1 §Typography declares only **4 sizes**: `text-sm` (14px), `text-xl` (20px), `text-3xl` (28px). `text-lg` (18px) is **not in the inventory**.
- Phase 2 §Typography explicitly maps `<AlertDialogTitle>` → Heading role = `text-xl font-semibold leading-snug` and asserts "shadcn defaults already comply" — but the boilerplate does not in fact match.

Description and button-label typography are fine: `AlertDialogDescription` ships `text-sm text-muted-foreground` (matches Body role), button labels inherit `text-sm font-medium` from `buttonVariants` (matches Label role). Issue is isolated to the title.

**Fix:** edit `alert-dialog.tsx:82` `"text-lg font-semibold"` → `"text-xl font-semibold leading-snug"`.

### Pillar 5: Spacing (3/4) — WARNING

Spec-aligned tokens:
- `AlertDialogContent` uses `p-6` (lg = 24px) ✓ — Phase 2 §Spacing predicted exactly this.
- `AlertDialogFooter` uses `sm:space-x-2` (8px) ✓ — matches the `gap-2 between footer buttons` claim.
- `AlertDialogHeader` uses `space-y-2` (8px) ✓ — sm token, fine for title↔description.
- `Button className="gap-2"` on the trigger ✓ — matches Phase 1 sidebar/header `gap-2` icon-to-label adjacency.

**Findings (justify the score):** two density-token deviations from Phase 1 §Density & Visual Rhythm, both inherited from unmodified shadcn boilerplate:

1. `alert-dialog.tsx:39` ships `shadow-lg` on `AlertDialogContent`. Phase 1 §Density: `shadow-md on dialogs (popover layer)`. Subtle but the dialog now floats heavier than spec.
2. `alert-dialog.tsx:39` ships `sm:rounded-lg` (8px). Phase 1 §Density: `rounded-md (6px) for buttons, cards, dialogs, badges, table containers`. The `sm:` prefix is also dead weight in a desktop-only app per Phase 1 §Design System Breakpoints.

No arbitrary spacing values (`[13px]` etc.) introduced. The remaining `[50%]`/`[48%]` tokens at line 39 are standard shadcn centering/animation primitives, not spacing-scale violations.

**Fix:** edit `alert-dialog.tsx:39` — replace `shadow-lg` with `shadow-md`, replace `sm:rounded-lg` with `rounded-md` (drop the breakpoint qualifier).

### Pillar 6: Experience Design (4/4)

- **Correct primitive choice:** `AlertDialog` (Radix `role="alertdialog"`, no outside-click dismiss) — not `Dialog`. Matches the Phase 2 amendment promoting `alert-dialog` from Phase 9 → Phase 2 (`02-UI-SPEC.md` §Amendments).
- **Confirmation gate for destructive action:** clicking `Réinitialiser démo` no longer fires the Phase 1 stub toast directly; it now opens the dialog. Confirmed at `reset-button.tsx:26-50`.
- **State mutation only on confirm:** `handleReset` (line 20–23) is bound to `AlertDialogAction onClick`, never to Cancel. `useTraceabilityStore.getState().resetToSeed()` is invoked inline; success toast follows.
- **localStorage hygiene:** `resetToSeed` in `lib/store.ts:164-167` removes the persist key (`tracekebab-store-v1`) before reseeding, avoiding stale rehydration.
- **Keyboard / focus contract:** Radix defaults intact (no `onEscapeKeyDown`/`onPointerDownOutside` overrides in `alert-dialog.tsx`) — Esc closes, outside-click is a no-op, initial focus lands on Cancel per shadcn convention.
- **Toast wiring:** `toast.success("Données démo réinitialisées.")` uses the globally-mounted sonner `<Toaster />` from Phase 1 — no duplicate provider.

Minor note (not deducted): there is no automated test asserting Esc-doesn't-fire-reset or focus-lands-on-Cancel — this remains a verification gap if Radix defaults silently regress in a future shadcn upgrade. Recommended in priority fix #3.

---

## Registry Safety

`components.json` present (shadcn initialized). UI-SPEC §Registry Safety declares only the **shadcn official** registry, no third-party blocks. Pattern scan on the two audited files (`grep -E "fetch\(|XMLHttpRequest|navigator\.sendBeacon|process\.env|eval\(|Function\(|new Function|import\(.*https?:"`) returned **zero matches**.

Registry audit: 1 first-party block checked (`alert-dialog`), no flags. No deductions.

---

## Files Audited

- `/Users/sayanth/Desktop/viande/components/layout/reset-button.tsx` (52 lines — primary Phase 2 surface)
- `/Users/sayanth/Desktop/viande/components/ui/alert-dialog.tsx` (142 lines — shadcn boilerplate, light audit)
- `/Users/sayanth/Desktop/viande/components/ui/button.tsx` (referenced — to confirm `destructive`/`outline`/`ghost` variant tokens)
- `/Users/sayanth/Desktop/viande/lib/store.ts` (referenced lines 145–195 — `resetToSeed` + persist key wiring)
- `/Users/sayanth/Desktop/viande/.planning/phases/02-domain-model-zustand-store-seed-data/02-UI-SPEC.md` (contract)
- `/Users/sayanth/Desktop/viande/.planning/phases/02-domain-model-zustand-store-seed-data/02-CONTEXT.md` (locked copy strings)
- `/Users/sayanth/Desktop/viande/.planning/phases/01-scaffolding-application-shell/01-UI-SPEC.md` (inherited tokens)
